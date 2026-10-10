import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { ButtonComponent } from '../../shared/botones/buttonComponent';
import { ToastService } from '@app/services/toast/toast.service';
import { IconComponent } from '@app/shared/icono/icono';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, ButtonComponent, IconComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  email = signal('');
  password = signal('');
  showPassword = signal(false);
  mensaje = signal('');
  loading = signal(false);
  resetEmailSent = signal(false);
  resetEmail = signal('');

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  async onSubmit() {
    if (!this.email() || !this.password()) {
      this.mensaje.set('Ingresá tu email y contraseña');
      return;
    }

    this.loading.set(true);
    this.mensaje.set('');

    try {
      await this.authService.signInWithEmailPassword(this.email(), this.password());
      this.toast.success('Sesión iniciada correctamente', 'Éxito');
      this.router.navigate(['/perfil']);
    } catch (error: any) {
      console.error('❌ Error al iniciar sesión:', error);
      const code = error?.code ?? '';
      this.mensaje.set(this.mapAuthError(code, 'El mail o la contraseña son incorrectos'));
    } finally {
      this.loading.set(false);
    }
  }

  async signInWithGoogle() {
    this.loading.set(true);
    this.mensaje.set('');
    try {
      await this.authService.signInWithGoogle();
      this.toast.success('Inicio de sesión con Google exitoso', 'Éxito');
      this.router.navigate(['/perfil']);
    } catch (error: any) {
      console.error('❌ Error al iniciar sesión con Google:', error);
      this.mensaje.set(this.mapAuthError(error?.code ?? '', 'Error al iniciar sesión con Google'));
    } finally {
      this.loading.set(false);
    }
  }

  async sendResetEmail() {
    if (!this.resetEmail()) {
      this.mensaje.set('Ingresá tu email para enviar el link de recuperación');
      return;
    }
    this.loading.set(true);
    try {
      await this.authService.resetPassword(this.resetEmail());
      this.resetEmailSent.set(true);
      this.toast.success('Te enviamos un email para restablecer tu contraseña', 'Revisá tu casilla');
    } catch (error: any) {
      this.mensaje.set(this.mapAuthError(error?.code ?? '', 'No se pudo enviar el email'));
    } finally {
      this.loading.set(false);
    }
  }

  private mapAuthError(code: string, fallback: string): string {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'El mail o la contraseña son incorrectos';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Probá más tarde.';
      case 'auth/user-disabled':
        return 'Esta cuenta está deshabilitada.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return '';
      default:
        return fallback;
    }
  }
}