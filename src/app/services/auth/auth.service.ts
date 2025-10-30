import { Injectable, inject, PLATFORM_ID } from '@angular/core';
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
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly jwtKey = 'jwt_token';
  private readonly firebaseKey = 'firebase_token';
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  private logoutInProgress = false;

    // 👇 inyectamos el PLATFORM_ID para detectar SSR
    private platformId = inject(PLATFORM_ID);

  constructor() {
    onAuthStateChanged(auth, async (user) => {
      this.userSubject.next(user);

            if (user && !this.logoutInProgress) {
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
    }

    // ✅ Funciones seguras contra SSR (todas chequean si hay window)

    private isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    setJwtToken(token: string): void {
        if (!this.isBrowser()) return;
        localStorage.setItem(this.jwtKey, token);
        console.log('🟢 JWT guardado:', token.substring(0, 20) + '...');
    }

    getJwtToken(): string | null {
        if (!this.isBrowser()) return null;
        return localStorage.getItem(this.jwtKey);
    }

    clearJwtToken(): void {
        if (!this.isBrowser()) return;
        localStorage.removeItem(this.jwtKey);
    }

    setFirebaseToken(token: string): void {
        if (!this.isBrowser()) return;
        localStorage.setItem(this.firebaseKey, token);
        console.log('🔵 Token Firebase guardado:', token.substring(0, 20) + '...');
    }

    getFirebaseToken(): string | null {
        if (!this.isBrowser()) return null;
        return localStorage.getItem(this.firebaseKey);
    }

    clearFirebaseToken(): void {
        if (!this.isBrowser()) return;
        localStorage.removeItem(this.firebaseKey);
    }

    clearTokens(): void {
        if (!this.isBrowser()) return;
        this.clearJwtToken();
        this.clearFirebaseToken();
    }

    isAuthenticated(): boolean {
        if (!this.isBrowser()) return false;
        return !!(this.getJwtToken() || this.getFirebaseToken());
    }

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
            this.logoutInProgress = true;
            await firebaseSignOut(auth);
            this.clearTokens();
            console.log('✅ Sesión cerrada completamente');
        } catch (error) {
            console.error('⚠️ Error al cerrar sesión:', error);
        } finally {
            this.logoutInProgress = false;
        }
    }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  getUserObservable(): Observable<User | null> {
    return this.user$;
  }
}
