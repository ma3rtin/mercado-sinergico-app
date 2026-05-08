import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Auth,
  authState,
  user,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  getIdToken,
  User
} from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly jwtKey = 'jwt_token';
  private readonly firebaseKey = 'firebase_token';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(Auth);

  // 🔄 AuthState via Observables/Signals
  private authState$ = authState(this.auth);
  private user$ = user(this.auth);

  // Exponemos el usuario como signal
  userSignal = toSignal(this.user$, { initialValue: null });

  private jwtSignal = signal<string | null>(null);
  private firebaseTokenSignal = signal<string | null>(null);
  private sessionReadySignal = signal(false);

  isAuthenticated = computed(() => !!(this.jwtSignal() || this.firebaseTokenSignal() || this.userSignal()));

  constructor() {
    if (this.isBrowser()) {
      this.setupTokenSymmetry();
      this.restoreTokensFromStorage();
    }
  }

  // 🌍 Helpers
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Mantiene los tokens locales sincronizados con el estado de Firebase
   */
  private setupTokenSymmetry(): void {
    this.authState$.pipe(
      tap(async (user) => {
        if (user) {
          try {
            const token = await getIdToken(user);
            this.setFirebaseToken(token);
          } catch (error) {
            console.error('❌ Error al obtener token de Firebase:', error);
          }
        } else {
          // Si no hay usuario en Firebase y no hay JWT local, limpiamos todo
          if (!localStorage.getItem(this.jwtKey)) {
            this.clearTokens();
          }
        }
      })
    ).subscribe();
  }

  private restoreTokensFromStorage(): void {
    this.jwtSignal.set(localStorage.getItem(this.jwtKey));
    this.firebaseTokenSignal.set(localStorage.getItem(this.firebaseKey));
  }

  // 🔐 JWT (Backend propio)
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

  // 🔵 Firebase Token
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

  // 🔐 Login con Google
  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    try {
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      const token = await getIdToken(user);
      this.setFirebaseToken(token);
      return user;
    } catch (error) {
      console.error('❌ Error en login con Google:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
    } catch {
      /* Ignorar si no había sesión Firebase */
    } finally {
      this.clearTokens();
    }
  }

  getCurrentUser(): User | null {
    return this.userSignal() || null;
  }

  get user() {
    return this.userSignal;
  }

  getUserRole(): string | null {
    const token = this.getJwtToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.rol || null;
    } catch (error) {
      console.error('❌ Error al decodificar el token JWT:', error);
      return null;
    }
  }

  // ♻️ Restaurar sesión al iniciar la app
  async restoreSession(): Promise<void> {
    if (!this.isBrowser()) {
      this.sessionReadySignal.set(true);
      return;
    }

    // Pequeño delay para asegurar que Firebase inicializó su estado interno
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        this.restoreTokensFromStorage();
        this.sessionReadySignal.set(true);
        resolve();
      }, 100);
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
