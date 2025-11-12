import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuario/usuario.service';
import { AuthService } from '../../services/auth/auth.service';
import { ButtonComponent } from './../../shared/botones-component/buttonComponent';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, ButtonComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  // 🧩 Inyecciones
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  // 🧠 Signals
  email = signal('');
  password = signal('');
  showPassword = signal(false);
  mensaje = signal<string | undefined>(undefined);
  loading = signal(false);

  // 👁️ Cambiar visibilidad de la contraseña
  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  // 🚀 Login normal
  onSubmit() {
    this.loading.set(true);
    this.mensaje.set(undefined);

    const credenciales = {
      email: this.email(),
      contraseña: this.password(),
    };

    this.usuarioService.login(credenciales).subscribe({
      next: (response) => {
        console.log('✅ Token recibido:', response.token);
        this.authService.setJwtToken(response.token);
        this.loading.set(false);
        this.toastr.success('Sesión iniciada correctamente', 'Éxito');
        this.router.navigate(['/perfil']);
      },
      error: (err) => {
        console.error('❌ Error al iniciar sesión:', err);
        this.mensaje.set('El mail o la contraseña son incorrectos');
        this.loading.set(false);
      },
    });
  }

  // 🔵 Login con Google
  async signInWithGoogle() {
    try {
      this.loading.set(true);
      this.mensaje.set(undefined);

      const user = await this.authService.signInWithGoogle();
      console.log('✅ Usuario autenticado con Google:', user);

      const firebaseToken = this.authService.getFirebaseToken();
      if (!firebaseToken) throw new Error('No se pudo obtener el token de Firebase');

      this.usuarioService.loginWithFirebase(firebaseToken).subscribe({
        next: (response) => {
          console.log('✅ Usuario sincronizado con el backend:', response.usuario);
          this.toastr.success('Inicio de sesión con Google exitoso', 'Éxito');
          this.router.navigate(['/perfil']);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('❌ Error al sincronizar usuario:', err);
          this.mensaje.set('Error al sincronizar la cuenta con el servidor');
          this.loading.set(false);
        },
      });
    } catch (error) {
      console.error('❌ Error al iniciar sesión con Google:', error);
      this.mensaje.set('Error al iniciar sesión con Google');
      this.loading.set(false);
    }
  }
}
