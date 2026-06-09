import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { Usuario } from '@app/models/UsuarioInterfaces/Usuario';
import { LocalidadService, Localidad } from '@app/services/localidad/localidad.service';
import { CommonModule } from '@angular/common';
import { InputComponent } from '@app/shared/input/input-component';
import { SelectComponent } from '@app/shared/select/select-component';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { ToastService } from '@app/services/toast/toast.service';
import { IconComponent } from '@app/shared/icono/icono';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, SelectComponent, ButtonComponent, IconComponent],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css']
})
export class Perfil implements OnInit {
  // 🧩 Servicios
  private usuarioService = inject(UsuarioService);
  private localidadService = inject(LocalidadService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  // 🧠 Signals
  localidades = signal<Localidad[]>([]);
  usuario = signal<Usuario | null>(null);
  cargando = signal(true);
  sesionIniciada = signal(false);
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
      cp: ['', Validators.required],
      calle: ['', Validators.required],
      numero: ['', Validators.required],
      piso: [''],
      dpto: [''],
      observaciones: [''],
    });

    this.form.valueChanges.subscribe(() => {
      if (!this.inicializando) this.tieneCambios.set(true);
    });

    this.form.get('localidad')?.valueChanges.subscribe(locationId => {
      if (locationId) {
        const locId = Number(locationId);
        const loc = this.localidades().find(l => l.id_localidad === locId);
        if (loc) {
          this.form.patchValue({ cp: loc.codigo_postal }, { emitEvent: false });
        }
      }
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
          observaciones: u.direccion?.observaciones || '',
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

  // 📅 Formatear fecha (evita bug de timezone UTC→local)
  private formatDate(date: any): string {
    if (!date) return '';
    // Ya está en formato yyyy-MM-dd → usarla directo
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    // Formato dd/MM/yyyy → invertir
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      const [day, month, year] = date.split('/');
      return `${year}-${month}-${day}`;
    }
    // ISO string (ej: "1990-05-15T00:00:00.000Z") → extraer solo la parte de fecha
    // sin convertir a hora local para evitar restar un día en UTC-3
    if (typeof date === 'string' && date.includes('T')) {
      return date.substring(0, 10);
    }
    // Fallback con getUTC* para no aplicar offset local
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  }

  // 💾 Guardar cambios (datos + imagen)
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.form.updateValueAndValidity({ emitEvent: true });
      this.toast.warning('Completá los campos obligatorios antes de guardar.');
      return;
    }

    this.loadingImagen.set(true);
    const v = this.form.value;

    // 📦 Si hay imagen nueva, usar FormData; si no, enviar JSON
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('telefono', v.telefono ?? '');
      formData.append('fecha_nac', v.fecha_nac ?? '');
      if (v.localidad) formData.append('localidad_id', String(v.localidad));
      if (v.cp) formData.append('cp', String(v.cp));
      if (v.calle) formData.append('calle', v.calle);
      if (v.numero) formData.append('numero', String(v.numero));
      if (v.piso) formData.append('piso', String(v.piso));
      if (v.dpto) formData.append('dpto', v.dpto);
      formData.append('observaciones', v.observaciones ?? '');
      formData.append('imagen', this.selectedFile);
      this.enviarPerfil(formData);
    } else {
      const body: Record<string, any> = {
        telefono: v.telefono,
        fecha_nac: v.fecha_nac,
      };
      if (v.localidad) body['localidad_id'] = Number(v.localidad);
      if (v.cp) body['cp'] = v.cp;
      if (v.calle) body['calle'] = v.calle;
      if (v.numero) body['numero'] = Number(v.numero);
      if (v.piso) body['piso'] = Number(v.piso);
      if (v.dpto) body['dpto'] = v.dpto;
      body['observaciones'] = v.observaciones;
      this.enviarPerfil(body);
    }
  }

  private enviarPerfil(data: FormData | Record<string, any>): void {
    this.usuarioService.updatePerfil(data).subscribe({
      next: (res) => {
        const u = (res as any).usuario ?? res;
        this.usuario.set(u);
        this.toast.success('Perfil actualizado correctamente.');
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.form.updateValueAndValidity({ emitEvent: true });
        this.tieneCambios.set(false);
        this.loadingImagen.set(false);
        this.selectedFile = null;
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.toast.error('No se pudo actualizar el perfil. Intentá nuevamente.', 'Error al guardar');
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

  opcionesLocalidades = computed(() =>
    this.localidades().map(l => ({
      value: l.id_localidad,
      label: l.nombre
    }))
  );
}
