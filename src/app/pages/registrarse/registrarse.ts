import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario/usuario.service';
import { CrearUsuarioDTO } from '@app/models/DTOs/crearUsuarioDTO';
import { ButtonComponent } from './../../shared/botones-component/buttonComponent';

@Component({
  selector: 'app-registrarse',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent
  ],
  templateUrl: './registrarse.html',
  styleUrls: ['./registrarse.css'],
})
export class RegistrarseComponent implements OnInit {
  form!: FormGroup;
  submitted = false;

  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private platformId = inject(PLATFORM_ID);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.platformId = platformId;
  }

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
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!?-_]).+$/),
          ],
        ],
        confirmPassword: ['', Validators.required],
        recaptcha: [''], //Validar en el backend
      },
      { validators: this.passwordsMatch }
    );
    
    // Cargar el script de reCAPTCHA solo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      (window as any).onRecaptchaSuccess = (token: string) => {
        this.form.get('recaptcha')?.setValue(token); // Almacena el token y lo guarda en el form
      };
    }
  }

  // validador custom
  passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  // helper para template
  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.mostrarError();
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

    this.usuarioService.register(datos).subscribe({
      next: () => {
        this.mostrarExito();
        this.form.reset();
        this.submitted = false;
        this.router.navigate(['/login']);
      },
      error: () => {
        this.mostrarError();
      },
    });
  }

  mostrarExito(): void {
    this.toastr.success('Registro exitoso', 'Éxito');
  }
  
  mostrarError(): void {
    this.toastr.error('Por favor completá correctamente el formulario', 'Error');
  }
}