import { Component, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { ButtonComponent } from '../../shared/botones/buttonComponent';
import { ToastService } from '@app/services/toast/toast.service';
import { IconComponent } from '@app/shared/icono/icono';
import { AnalyticsService } from '@app/services/analytics/analytics.service';

@Component({
  selector: 'app-registrarse',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterModule, ButtonComponent, IconComponent],
  templateUrl: './registrarse.html',
  styleUrls: ['./registrarse.css'],
})
export class RegistrarseComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private analytics = inject(AnalyticsService);

  loading = signal(false);
  submitted = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  mensaje = signal('');

  form!: FormGroup;

  constructor() {
    this.form = this.fb.group(
      {
        nombre: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
          ],
        ],
        apellido: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        telefono: [''],
        fecha_nac: ['', Validators.required],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordsMatch }
    );
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update((v) => !v);
  }

  passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  get f() {
    return this.form.controls;
  }

  async onSubmit(): Promise<void> {
    this.submitted.set(true);
    this.mensaje.set('');

    if (this.form.invalid) {
      this.mensaje.set('Por favor completá correctamente el formulario');
      return;
    }

    const { nombre, apellido, email, password, fecha_nac, telefono } = this.form.value;
    const displayName = `${nombre} ${apellido}`.trim();

    this.loading.set(true);

    try {
      await this.authService.signUpWithEmailPassword(email!, password!, displayName);

      this.analytics.trackSignUp('email');
      this.toast.success('Registro exitoso. Bienvenido/a', 'Cuenta creada');
      this.router.navigate(['/perfil']);
    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      this.mensaje.set(this.mapAuthError(error?.code ?? '', 'No se pudo crear la cuenta'));
    } finally {
      this.loading.set(false);
    }

    void fecha_nac;
    void telefono;
  }

  async signInWithGoogle(): Promise<void> {
    this.loading.set(true);
    this.mensaje.set('');
    try {
      await this.authService.signInWithGoogle();
      this.analytics.trackSignUp('google');
      this.toast.success('Registro con Google exitoso', 'Bienvenido/a');
      this.router.navigate(['/perfil']);
    } catch (error: any) {
      this.mensaje.set(this.mapAuthError(error?.code ?? '', 'No se pudo registrar con Google'));
    } finally {
      this.loading.set(false);
    }
  }

  private mapAuthError(code: string, fallback: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con ese email';
      case 'auth/invalid-email':
        return 'El email no es válido';
      case 'auth/weak-password':
        return 'La contraseña es muy débil (mínimo 8 caracteres)';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return '';
      default:
        return fallback;
    }
  }
}