import { Injectable, effect, inject, PLATFORM_ID, signal, computed } from '@angular/core';
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

    // 🔹 Signals
    private userSignal = signal<User | null>(null);
    private jwtSignal = signal<string | null>(null);
    private firebaseTokenSignal = signal<string | null>(null);

    // 🔹 Computed
    isAuthenticated = computed(() => !!(this.jwtSignal() || this.firebaseTokenSignal()));

    constructor() {
        if (this.isBrowser()) {
            // 🔄 Detecta cambios en el usuario de Firebase
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
                    this.clearTokens();
                }
            });

            // 🔁 Sincroniza tokens del localStorage al iniciar
            this.jwtSignal.set(localStorage.getItem(this.jwtKey));
            this.firebaseTokenSignal.set(localStorage.getItem(this.firebaseKey));
        }

        // 👀 Log automático en consola cuando cambia el estado
        effect(() => {
            console.log('🧠 AuthService - Usuario actual:', this.userSignal());
            console.log('🔑 JWT Token:', this.jwtSignal()?.substring(0, 20) + '...');
            console.log('🔵 Firebase Token:', this.firebaseTokenSignal()?.substring(0, 20) + '...');
            console.log('✅ Autenticado:', this.isAuthenticated());
        });
    }

    // 🧱 Helpers
    private isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
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

    // 🚮 Limpieza
    clearTokens(): void {
        this.clearJwtToken();
        this.clearFirebaseToken();
    }

    // 👤 Usuario
    get user() {
        return this.userSignal.asReadonly();
    }

    // 🔐 Login con Google
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
            this.clearTokens();
            this.userSignal.set(null);
            console.log('✅ Sesión cerrada correctamente');
        } catch (error) {
            console.error('⚠️ Error al cerrar sesión:', error);
        }
    }

    getCurrentUser(): User | null {
        return this.userSignal();
    }
}
