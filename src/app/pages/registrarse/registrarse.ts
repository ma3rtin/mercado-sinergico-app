import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { PLATFORM_ID } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuario/usuario.service';
import { AuthService } from '../../services/auth/auth.service';
import { CrearUsuarioDTO } from '@app/models/DTOs/Usuario/crearUsuarioDTO';
import { ButtonComponent } from '../../shared/botones/buttonComponent';
import { ToastService } from '@app/services/toast/toast.service';
import { IconComponent } from '@app/shared/icono/icono';

@Component({
  selector: 'app-registrarse',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    IconComponent,
  ],
  templateUrl: './registrarse.html',
  styleUrls: ['./registrarse.css'],
})
export class RegistrarseComponent implements OnInit {
  // 🧠 Signals
  loading = signal(false);
  submitted = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  registroExitoso = signal(false);
  emailRegistrado = signal('');
  reenviando = signal(false);

  // 👁️ Cambiar visibilidad de las contraseñas
  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update((v) => !v);
  }

  // 🧱 Formulario
  form!: FormGroup;

  // 🧩 Inyecciones
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
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
        fecha_nac: ['', Validators.required],
        telefono: [''],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
          ],
        ],
        confirmPassword: ['', Validators.required],
        recaptcha: [''],
      },
      { validators: this.passwordsMatch }
    );

    // ⚙️ Cargar script reCAPTCHA solo en navegador
    if (isPlatformBrowser(this.platformId)) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      (window as any).onRecaptchaSuccess = (token: string) => {
        this.form.get('recaptcha')?.setValue(token);
      };
    }
  }

  // 🔍 Validador custom
  passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  // 📄 Helper para el template
  get f() {
    return this.form.controls;
  }

  // 🚀 Envío del formulario
  onSubmit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.mostrarError('Por favor completá correctamente el formulario');
      return;
    }

    const datos: CrearUsuarioDTO = {
      email: this.form.value.email!,
      nombre: this.form.value.nombre!,
      contraseña: this.form.value.password!,
      telefono: this.form.value.telefono || '0000000000',
      fecha_nac: this.form.value.fecha_nac!,
      imagen_url: '',
      rolId: 1,
    };

    this.loading.set(true);

    this.usuarioService.register(datos).subscribe({
      next: (response: any) => {
        this.loading.set(false);
        this.emailRegistrado.set(datos.email);
        this.registroExitoso.set(true);
        this.mostrarExito(response?.message || 'Registro exitoso. Revisá tu correo para activar tu cuenta.');
      },
      error: (error) => {
        this.loading.set(false);
        console.error('❌ Error en registro:', error);
        this.mostrarError(
          error?.error?.error || error?.error?.message || error?.message || 'Error al registrarte. Intentá nuevamente.'
        );
      },
    });
  }

  // ✉️ Reenviar verificación desde la pantalla de éxito
  reenviarVerificacion(): void {
    const email = this.emailRegistrado();
    if (!email) return;

    this.reenviando.set(true);
    this.usuarioService.reenviarVerificacion(email).subscribe({
      next: (response) => {
        this.reenviando.set(false);
        this.mostrarExito(response?.message || 'Si la cuenta está pendiente, enviamos un nuevo correo.');
      },
      error: (error) => {
        this.reenviando.set(false);
        this.mostrarError(
          error?.error?.error || error?.error?.message || 'No pudimos reenviar el correo. Intentá en unos minutos.'
        );
      },
    });
  }

  // 🧾 Toasts
  mostrarExito(msg: string): void {
    this.toast.success(msg, 'Éxito');
  }

  mostrarError(msg: string): void {
    this.toast.error(msg, 'Error');
  }
}
