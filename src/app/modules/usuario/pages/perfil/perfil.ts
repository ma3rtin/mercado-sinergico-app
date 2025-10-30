import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { Usuario } from '@app/models/UsuarioInterfaces/Usuario';
import { LocalidadService, Localidad } from '@app/services/localidad/localidad.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css']
})
export class Perfil implements OnInit {
  private usuarioService = inject(UsuarioService);
  private localidadService = inject(LocalidadService);
  private fb = inject(FormBuilder);

  localidades: Localidad[] = [];
  usuario?: Usuario;
  form!: FormGroup;
  cargando = true;
  sesionIniciada = false;
  mensaje?: string;
  cpSeleccionado = '';

  private inicializando = true;
  tieneCambios = false;

  private formatDate(date: any): string {
    if (!date) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      const [day, month, year] = date.split('/');
      return `${year}-${month}-${day}`;
    }
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  }

  onLocalidadChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value);
    const loc = this.localidades.find(l => l.id_localidad === id);
    this.form.patchValue({ cp: loc?.codigo_postal || '' });
    this.cpSeleccionado = loc?.codigo_postal?.toString() || '';
    this.form.markAsDirty();
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      telefono: ['', [Validators.required, Validators.minLength(8)]],
      fecha_nac: ['', Validators.required],
      imagen_url: [''],
      localidad: ['', Validators.required],
      cp: [''],
      calle: [''],
      numero: [''],
      piso: [''],
      dpto: [''],
    });

    this.form.valueChanges.subscribe(() => {
      if (!this.inicializando) this.tieneCambios = true;
    });

    this.localidadService.getAll().subscribe({
      next: (locs) => (this.localidades = locs),
      error: (err) => console.error('Error al obtener localidades:', err),
    });

    this.usuarioService.getPerfil().subscribe({
      next: (u) => {
        this.usuario = u;
        this.sesionIniciada = true;

        const fechaFormateada = this.formatDate(u.fecha_nac);

        this.form.patchValue({
          telefono: u.telefono || '',
          fecha_nac: fechaFormateada,
          imagen_url: u.imagen_url || '',
          localidad: u.direccion?.localidad?.id_localidad || '',
          cp: u.direccion?.codigo_postal || '',
          calle: u.direccion?.calle || '',
          numero: u.direccion?.numero || '',
          piso: u.direccion?.piso || '',
          dpto: u.direccion?.departamento || ''
        });

        this.inicializando = false;
        this.tieneCambios = false;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener usuario:', err);
        this.cargando = false;
        this.sesionIniciada = false;
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensaje = 'Tenés campos obligatorios sin completar ❌';
      return;
    }

    const datos = this.form.value;

    this.usuarioService.updatePerfil(datos).subscribe({
      next: (u) => {
        this.usuario = u;
        this.mensaje = 'Perfil actualizado correctamente ✅';
        this.form.markAsPristine();
        this.tieneCambios = false;
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.mensaje = 'Error al actualizar perfil ❌';
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const imgData = reader.result as string;

      if (this.usuario) {
        this.usuario = {
          ...this.usuario,
          imagen_url: imgData ?? this.usuario.imagen_url,
        };
      }

      this.form.patchValue({ imagen_url: imgData });
      this.form.markAsDirty();
    };

    reader.readAsDataURL(file);
  }
}
