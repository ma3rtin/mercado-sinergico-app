import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { Usuario } from '@app/models/UsuarioInterfaces/Usuario';
import { LocalidadService, Localidad } from '@app/services/localidad/localidad.service';
import { CommonModule } from '@angular/common';
import { InputComponent } from '@app/shared/input/input-component';
import { SelectComponent } from '@app/shared/select/select-component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, SelectComponent],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css']
})
export class Perfil implements OnInit {
  // 🧩 Servicios
  private usuarioService = inject(UsuarioService);
  private localidadService = inject(LocalidadService);
  private fb = inject(FormBuilder);

  // 🧠 Signals
  localidades = signal<Localidad[]>([]);
  usuario = signal<Usuario | null>(null);
  cargando = signal(true);
  sesionIniciada = signal(false);
  mensaje = signal<string | null>(null);
  tieneCambios = signal(false);
  cpSeleccionado = signal('');
  loadingImagen = signal(false);

  // 📦 Archivo seleccionado
  selectedFile: File | null = null;

  form!: FormGroup;
  private inicializando = true;

  // 🔧 Inicialización
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
      if (!this.inicializando) this.tieneCambios.set(true);
    });

    this.localidadService.getAll().subscribe({
      next: (locs) => this.localidades.set(locs),
      error: (err) => console.error('Error al obtener localidades:', err),
    });

    this.usuarioService.getPerfil().subscribe({
      next: (u) => {
        this.usuario.set(u);
        this.sesionIniciada.set(true);
        const fechaFormateada = this.formatDate(u.fecha_nac);
        this.form.patchValue({
          telefono: u.telefono || '',
          fecha_nac: fechaFormateada,
          imagen_url: u.imagen_url || '',
          localidad: u.direccion?.localidad?.id_localidad ?? null,
          cp: u.direccion?.codigo_postal || '',
          calle: u.direccion?.calle || '',
          numero: u.direccion?.numero || '',
          piso: u.direccion?.piso || '',
          dpto: u.direccion?.departamento || '',
        });
        this.inicializando = false;
        this.tieneCambios.set(false);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener usuario:', err);
        this.cargando.set(false);
        this.sesionIniciada.set(false);
      }
    });
  }

  // 📅 Formatear fecha
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

  // 💾 Guardar cambios (datos + imagen)
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensaje.set('Tenés campos obligatorios sin completar ❌');
      return;
    }

    this.loadingImagen.set(true);

    // 📦 Crear FormData para enviar JSON + archivo
    const formData = new FormData();
    Object.entries(this.form.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value as string);
    });
    if (this.selectedFile) formData.append('imagen', this.selectedFile);

    this.usuarioService.updatePerfil(formData).subscribe({
      next: (res) => {
        const u = (res as any).usuario ?? res;
        this.usuario.set(u);
        this.mensaje.set('Perfil actualizado correctamente ✅');
        this.form.markAsPristine();
        this.tieneCambios.set(false);
        this.loadingImagen.set(false);
        this.selectedFile = null;
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.mensaje.set('Error al actualizar perfil ❌');
        this.loadingImagen.set(false);
      }
    });
  }

  // 📸 Seleccionar imagen (sin subir todavía)
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.selectedFile = input.files[0]; // 🔹 guardamos el archivo para enviar luego

    const reader = new FileReader();
    reader.onload = () => {
      const preview = reader.result as string;
      const user = this.usuario();
      if (user) {
        this.usuario.set({ ...user, imagen_url: preview });
      }
      this.tieneCambios.set(true);
    };
    reader.readAsDataURL(this.selectedFile);
  }

  // 🏙️ Opciones de localidades para el select
  opcionesLocalidades = computed(() =>
    this.localidades().map(l => ({
      value: l.id_localidad,
      label: l.nombre
    }))
  );

  actualizarCP(id: number) {
    const loc = this.localidades().find(l => l.id_localidad === id);
    this.form.patchValue({ cp: loc?.codigo_postal || '' });
  }
}
