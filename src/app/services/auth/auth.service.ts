import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
    getIdToken,
} from 'firebase/auth';
import { auth } from '../../config/firebase.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly jwtKey = 'jwt_token';
    private readonly firebaseKey = 'firebase_token';
    private readonly platformId = inject(PLATFORM_ID);

    private userSignal = signal<User | null>(null);
    private jwtSignal = signal<string | null>(null);
    private firebaseTokenSignal = signal<string | null>(null);
    private sessionReadySignal = signal(false);

    isAuthenticated = computed(() => !!(this.jwtSignal() || this.firebaseTokenSignal()));

    constructor() {
        if (this.isBrowser()) {
            this.setupFirebaseListener();
            this.restoreTokensFromStorage();
        }
    }

    // 🌍 Helpers
    private isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    private setupFirebaseListener(): void {
        onAuthStateChanged(auth, async (user) => {
            this.userSignal.set(user);

            if (user) {
                try {
                    const token = await getIdToken(user);
                    this.setFirebaseToken(token);
                } catch (error) {
                    console.error('❌ Error al obtener token de Firebase:', error);
                }
            } else {
                // 🚫 No limpiar JWT si el login fue por backend
                if (!localStorage.getItem(this.jwtKey)) {
                    this.clearTokens();
                }
            }
        });
    }

    private restoreTokensFromStorage(): void {
        this.jwtSignal.set(localStorage.getItem(this.jwtKey));
        this.firebaseTokenSignal.set(localStorage.getItem(this.firebaseKey));
    }

    // 🔐 JWT
    setJwtToken(token: string): void {
        if (!this.isBrowser()) return;
        localStorage.setItem(this.jwtKey, token);
        this.jwtSignal.set(token);
    }

    getJwtToken(): string | null {
        return this.jwtSignal();
    }

    clearJwtToken(): void {
        if (!this.isBrowser()) return;
        localStorage.removeItem(this.jwtKey);
        this.jwtSignal.set(null);
    }

    // 🔵 Firebase
    setFirebaseToken(token: string): void {
        if (!this.isBrowser()) return;
        localStorage.setItem(this.firebaseKey, token);
        this.firebaseTokenSignal.set(token);
    }

    getFirebaseToken(): string | null {
        return this.firebaseTokenSignal();
    }

    clearFirebaseToken(): void {
        if (!this.isBrowser()) return;
        localStorage.removeItem(this.firebaseKey);
        this.firebaseTokenSignal.set(null);
    }

    // 🧹 Limpieza general
    clearTokens(): void {
        this.clearJwtToken();
        this.clearFirebaseToken();
    }

    // 👤 Usuario
    get user() {
        return this.userSignal.asReadonly();
    }

    // 🔐 Login con Google (opcional)
    async signInWithGoogle(): Promise<User> {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');

        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const token = await getIdToken(user);
        this.setFirebaseToken(token);

        return user;
    }

    async signOut(): Promise<void> {
        try {
            await firebaseSignOut(auth);
        } catch {
            /* Ignorar si no había sesión Firebase */
        } finally {
            this.clearTokens();
            this.userSignal.set(null);
        }
    }

    getCurrentUser(): User | null {
        return this.userSignal();
    }

    getUserRole(): string | null {
        const token = this.getJwtToken();
        if (!token) return null;

        try {
            const partes = token.split('.');
            if (partes.length !== 3) return null;
            const payload = JSON.parse(atob(partes[1]));
            if (typeof payload?.rol !== 'string') return null;
            return payload.rol;
        } catch {
            return null;
        }
    }


    // ♻️ Restaurar sesión al iniciar la app
    async restoreSession(): Promise<void> {
        if (!this.isBrowser()) {
            this.sessionReadySignal.set(true);
            return;
        }

        await new Promise<void>((resolve) => {
            setTimeout(() => {
                this.restoreTokensFromStorage();
                this.sessionReadySignal.set(true);
                resolve();
            }, 0);
        });
    }

    // 🕐 Utilidad para guards
    async waitForSessionReady(): Promise<void> {
        if (this.sessionReadySignal()) return;
        await new Promise<void>((resolve) => {
            const check = () => {
                if (this.sessionReadySignal()) resolve();
                else setTimeout(check, 50);
            };
            check();
        });
    }

    isSessionReady(): boolean {
        return this.sessionReadySignal();
    }
}
