import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuario/usuario.service';
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
  // 🧩 Inyecciones
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  // 🧠 Signals
  email = signal('');
  password = signal('');
  showPassword = signal(false);
  mensaje = signal<string | undefined>(undefined);
  loading = signal(false);
  cuentaNoVerificada = signal(false);
  reenviando = signal(false);

  // 👁️ Cambiar visibilidad de la contraseña
  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  // 🚀 Login normal
  onSubmit() {
    this.loading.set(true);
    this.mensaje.set(undefined);
    this.cuentaNoVerificada.set(false);

    const credenciales = {
      email: this.email(),
      contraseña: this.password(),
    };

    this.usuarioService.login(credenciales).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Sesión iniciada correctamente', 'Éxito');
        this.router.navigate(['/perfil']);
      },
      error: (err) => {
        console.error('❌ Error al iniciar sesión:', err);
        this.loading.set(false);
        if (err?.error?.code === 'EMAIL_NO_VERIFICADO') {
          this.cuentaNoVerificada.set(true);
          this.mensaje.set(
            err?.error?.message || 'Confirmá tu correo electrónico antes de iniciar sesión.'
          );
        } else {
          this.mensaje.set(
            err?.error?.error || err?.error?.message || 'El mail o la contraseña son incorrectos'
          );
        }
      },
    });
  }

  // ✉️ Reenviar enlace de activación si la cuenta no está verificada
  reenviarActivacion() {
    const email = this.email().trim();
    if (!email) {
      this.toast.error('Ingresá tu correo en el formulario para reenviar la activación', 'Atención');
      return;
    }

    this.reenviando.set(true);
    this.usuarioService.reenviarVerificacion(email).subscribe({
      next: (res) => {
        this.reenviando.set(false);
        this.toast.success(res?.message || 'Si la cuenta está pendiente, enviamos un nuevo correo.', 'Éxito');
      },
      error: (err) => {
        this.reenviando.set(false);
        this.toast.error(err?.error?.error || err?.error?.message || 'No se pudo reenviar el correo', 'Error');
      },
    });
  }

  // 🔵 Login con Google
  async signInWithGoogle() {
    try {
      this.loading.set(true);
      this.mensaje.set(undefined);
      this.cuentaNoVerificada.set(false);

      await this.authService.signInWithGoogle();

      const firebaseToken = this.authService.getFirebaseToken();
      if (!firebaseToken) throw new Error('No se pudo obtener el token de Firebase');

      this.usuarioService.loginWithFirebase(firebaseToken).subscribe({
        next: () => {
          this.toast.success('Inicio de sesión con Google exitoso', 'Éxito');
          this.router.navigate(['/perfil']);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('❌ Error al sincronizar usuario:', err);
          this.authService.signOut();
          if (err?.error?.code === 'EMAIL_NO_VERIFICADO') {
            this.mensaje.set(
              err?.error?.message || 'Google no confirmó este correo electrónico. Verificalo en tu cuenta Google.'
            );
          } else {
            this.mensaje.set(
              err?.error?.error || err?.error?.message || 'Error al sincronizar la cuenta con el servidor'
            );
          }
          this.loading.set(false);
        },
      });
    } catch (error) {
      console.error('❌ Error al iniciar sesión con Google:', error);
      this.authService.signOut();
      this.mensaje.set('Error al iniciar sesión con Google');
      this.loading.set(false);
    }
  }
}
