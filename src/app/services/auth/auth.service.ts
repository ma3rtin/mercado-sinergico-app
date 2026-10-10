import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Auth,
  authState,
  user,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  getIdToken,
  User,
} from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { LoginResponse } from '@app/services/usuario/types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly jwtKey = 'jwt_token';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(Auth);
  private readonly http = inject(HttpClient);

  private authState$ = authState(this.auth);
  private user$ = user(this.auth);

  userSignal = toSignal(this.user$, { initialValue: null });

  private jwtSignal = signal<string | null>(null);
  private sessionReadySignal = signal(false);

  isAuthenticated = computed(() => !!this.jwtSignal());

  constructor() {
    if (this.isBrowser()) {
      this.restoreJwtFromStorage();
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private restoreJwtFromStorage(): void {
    this.jwtSignal.set(localStorage.getItem(this.jwtKey));
  }

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

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    const result = await signInWithPopup(this.auth, provider);
    await this.exchangeWithBackend(result.user);
  }

  async signInWithEmailPassword(email: string, password: string): Promise<void> {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    await this.exchangeWithBackend(result.user);
  }

  async signUpWithEmailPassword(email: string, password: string, displayName: string): Promise<void> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    await this.exchangeWithBackend(result.user);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
    } catch {
      /* no había sesión Firebase abierta */
    } finally {
      this.clearJwtToken();
    }
  }

  getCurrentUser(): User | null {
    return this.userSignal();
  }

  get user() {
    return this.userSignal;
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

  private async exchangeWithBackend(firebaseUser: User): Promise<void> {
    const idToken = await getIdToken(firebaseUser);
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiUrl}/usuarios/login-firebase`, { token: idToken })
    );
    this.setJwtToken(res.token);
  }

  async restoreSession(): Promise<void> {
    if (!this.isBrowser()) {
      this.sessionReadySignal.set(true);
      return;
    }

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        this.restoreJwtFromStorage();
        this.sessionReadySignal.set(true);
        resolve();
      }, 100);
    });
  }

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