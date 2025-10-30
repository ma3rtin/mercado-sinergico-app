import { ButtonComponent } from './../../shared/botones-component/buttonComponent';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuario/usuario.service';
import { AuthService } from '../../services/auth/auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true,
  imports: [FormsModule, RouterModule, ButtonComponent],
})
export class LoginComponent {
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  showPassword = false;
  mensaje?: string;
  isLoading = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.isLoading = true;
    this.mensaje = undefined;

    this.usuarioService.login({ email: this.email, contraseña: this.password }).subscribe({
      next: (response) => {
        console.log('✅ Token recibido:', response.token);
        console.log('🔐 Token guardado por AuthService');
        this.isLoading = false;
        this.router.navigate(['/perfil']);
      },
      error: (err) => {
        console.error('❌ Error al iniciar sesión:', err);
        this.mensaje = 'El mail o la contraseña son incorrectos';
        this.isLoading = false;
      },
    });
  }

  async signInWithGoogle() {
    try {
      this.isLoading = true;
      this.mensaje = undefined;

      const user = await this.authService.signInWithGoogle();
      console.log('✅ Usuario autenticado con Google:', user);

      const firebaseToken = await this.authService.getFirebaseToken();
      if (!firebaseToken) {
        throw new Error('No se pudo obtener el token de Firebase');
      }

      this.usuarioService.loginWithFirebase(firebaseToken).subscribe({
        next: (response) => {
          console.log('✅ Usuario sincronizado con el backend:', response.usuario);
          this.router.navigate(['/perfil']);
        },
        error: (err) => {
          console.error('❌ Error al sincronizar usuario:', err);
          this.mensaje = 'Error al sincronizar la cuenta con el servidor';
          this.isLoading = false;
        }
      });

    } catch (error) {
      console.error('❌ Error al iniciar sesión con Google:', error);
      this.mensaje = 'Error al iniciar sesión con Google';
      this.isLoading = false;
    }
  }
}