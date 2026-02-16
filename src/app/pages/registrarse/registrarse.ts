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

@Component({
  selector: 'app-registrarse',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
  ],
  templateUrl: './registrarse.html',
  styleUrls: ['./registrarse.css'],
})
export class RegistrarseComponent implements OnInit {
  // 🧠 Signals
  loading = signal(false);
  submitted = signal(false);

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

        // ✅ Si el backend devuelve un token al registrarse
        if (response?.token) {
          this.authService.setJwtToken(response.token);
        }

        this.mostrarExito('Registro exitoso');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loading.set(false);
        console.error('❌ Error en registro:', error);
        this.mostrarError(
          error?.error?.message || 'Error al registrarte. Intentá nuevamente.'
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
