import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  DestroyRef,
  signal,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaqueteBaseService } from '@app/services/paquete/paquete-base.service';
import { ZonaService } from '@app/services/zona/zona.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { InputComponent } from '@app/shared/input/input-component';
import { SelectComponent, SelectOption } from '@app/shared/select/select-component';
import { ToastService } from '@app/services/toast/toast.service';
import { AdminCreateWrapperComponent } from '@app/shared/admin-create-wrapper/admin-create-wrapper';
import { IconComponent } from '@app/shared/icono/icono';
import { AdminBackButtonComponent } from '@app/shared/admin-back-button/admin-back-button';

interface ImageSlot {
  file: File | null;
  preview: string | null;
  existingUrl?: string;
  isExisting?: boolean;
}


@Component({
  selector: 'app-publicar-paquete',
  standalone: true,
  imports: [
    FormsModule,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    AdminCreateWrapperComponent,
    IconComponent,
    AdminBackButtonComponent,
  ],
  templateUrl: './publicar-paquete.html',
})
export class PublicarPaqueteComponent implements OnInit {
  // 🧠 Signals principales
  paquetesBase = signal<any[]>([]);
  zonas = signal<any[]>([]);
  resultadosBusqueda = signal<any[]>([]);

  // Selecciones del formulario
  paqueteBaseSeleccionado = signal<number | null>(null);
  zonaSeleccionada = signal<number | null>(null);
  estadoSeleccionado = signal<number | null>(null);
  fechaInicio = signal<string>('');
  fechaFin = signal<string>('');
  cantProductos = signal<number | null>(null);

  // 🆕 Nuevos campos
  nombre = signal<string>('');
  descuento = signal<number | null>(null);
  imagenSlot = signal<ImageSlot>({ file: null, preview: null });

  // Estados y control
  cargando = signal<boolean>(false);
  mostrandoResultados = signal<boolean>(false);
  busqueda = signal<string>('');

  // ✏️ Edición
  isEditMode = signal<boolean>(false);
  editId = signal<number | null>(null);

  // 💡 Control de fecha para duplicado
  isDuplicate = signal<boolean>(false);

  // 🗂 Opciones de estado (estáticas)
  estados = [
    { id_estado: 1, nombre: 'Pendiente' },
    { id_estado: 2, nombre: 'Activo' },
    { id_estado: 3, nombre: 'Finalizado' },
  ];

  // 🔄 Computed: opciones para app-select de zona
  zonasOptions = computed<SelectOption[]>(() =>
    this.zonas().map(z => ({ value: z.id_zona, label: z.nombre }))
  );

  // 🔄 Computed: opciones para app-select de estado
  estadosOptions = computed<SelectOption[]>(() =>
    this.estados.map(e => ({ value: e.id_estado, label: e.nombre }))
  );

  // 🧩 ViewChilds
  @ViewChild('inputBusqueda') inputBusqueda!: ElementRef<HTMLInputElement>;
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLElement>;

  private toast = inject(ToastService);

  constructor(
    private paqueteBaseService: PaqueteBaseService,
    private zonaService: ZonaService,
    private paquetePublicadoService: PaquetePublicadoService,
    private destroyRef: DestroyRef,
    private route: ActivatedRoute,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.cargarZonas();
    this.cargarPaquetesIniciales();
    
    // Por defecto forzamos fecha de inicio a hoy y estado a Activo
    this.fechaInicio.set(this.getHoyString());
    this.estadoSeleccionado.set(2);

    // 🔍 Capturar baseId o duplicadoId de la URL para pre-selección
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const baseId = params['baseId'];
      const duplicadoId = params['duplicadoId'];

      if (baseId) {
        this.paqueteBaseSeleccionado.set(Number(baseId));
      }

      if (duplicadoId) {
        this.isEditMode.set(true);
        this.isDuplicate.set(true);
        this.editId.set(Number(duplicadoId));
        this.cargarDatosEdicion(Number(duplicadoId));
      }
    });

    // 🔍 Modo edición desde ruta params /:id/editar
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params['id'];
      if (id && !this.isDuplicate()) {
        this.isEditMode.set(true);
        this.editId.set(Number(id));
        this.cargarDatosEdicion(Number(id));
      }
    });
  }

  // --- Cargar datos para edición ---
  cargarDatosEdicion(id: number): void {
    this.cargando.set(true);
    this.paquetePublicadoService.getPaqueteById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (paquete) => {
        this.paqueteBaseSeleccionado.set(paquete.paqueteBase?.id_paquete_base ?? null);
        this.busqueda.set(paquete.paqueteBase?.nombre ?? '');
        this.zonaSeleccionada.set(paquete.zonaId ?? null);
        
        // El estado siempre será Activo (2) salvo que no se pueda, pero forzamos 2 como default general o el que ya tenga.
        // Como no se puede cambiar, mantenemos el que venga (si es edicion) o forzamos 2 si es duplicado.
        this.estadoSeleccionado.set(this.isDuplicate() ? 2 : (paquete.estado?.id_estado ?? 2));

        // 🆕 Poblar nombre
        this.nombre.set(paquete.nombre ?? '');

        // 🆕 Poblar descuento
        this.descuento.set(paquete.descuento ?? null);

        // 🆕 Imagen existente como preview
        if (paquete.imagen_url) {
          this.imagenSlot.set({
            file: null,
            preview: paquete.imagen_url,
            existingUrl: paquete.imagen_url,
            isExisting: true,
          });
        }

        if (paquete.fecha_inicio) {
          const fi = new Date(paquete.fecha_inicio);
          this.fechaInicio.set(
            this.isDuplicate() ? this.getHoyString() : fi.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
          );
        }
        if (paquete.fecha_fin) {
          const ff = new Date(paquete.fecha_fin);
          this.fechaFin.set(
            this.isDuplicate() ? '' : ff.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
          );
        }

        this.cantProductos.set(paquete.cant_productos ?? null);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando paquete para edición:', err);
        this.toast.error('No se pudo cargar la publicación a editar');
        this.cargando.set(false);
      }
    });
  }

  // --- Cargar primeros 10 paquetes base ---
  cargarPaquetesIniciales(): void {
    this.cargando.set(true);

    this.paqueteBaseService
      .getPaquetes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.paquetesBase.set(data);

          // Si hay un paquete pre-seleccionado, buscar su nombre para el input
          if (this.paqueteBaseSeleccionado()) {
            const pre = data.find(p => p.id_paquete_base === this.paqueteBaseSeleccionado());
            if (pre) this.busqueda.set(pre.nombre);
          }

          const primeros = data.slice(0, 10);
          this.resultadosBusqueda.set(primeros);
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('❌ Error al obtener paquetes base:', err);
          this.toast.error('Error al cargar los paquetes base.', 'Error');
          this.cargando.set(false);
        },
      });
  }

  // --- Cargar zonas ---
  cargarZonas(): void {
    this.zonaService
      .getZonas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.zonas.set(data),
        error: (err) => {
          console.error('❌ Error al obtener zonas:', err);
          this.toast.error('Error al cargar las zonas.', 'Error');
        },
      });
  }

  // --- Buscar por nombre ---
  buscarPaquetes(): void {
    const query = this.busqueda().trim().toLowerCase();
    const base = this.paquetesBase();

    if (!query) {
      this.resultadosBusqueda.set(base.slice(0, 10));
      this.mostrandoResultados.set(true);
      return;
    }

    const filtrados = base.filter((p) =>
      p.nombre.toLowerCase().includes(query)
    );
    this.resultadosBusqueda.set(filtrados);
    this.mostrandoResultados.set(true);
  }

  // --- Seleccionar paquete ---
  seleccionarPaquete(paquete: any): void {
    this.paqueteBaseSeleccionado.set(paquete.id_paquete_base);
    this.busqueda.set(paquete.nombre);
    this.mostrandoResultados.set(false);
  }

  // --- 🆕 Limpiar selección de paquete base ---
  limpiarPaqueteBase(): void {
    this.paqueteBaseSeleccionado.set(null);
    this.busqueda.set('');
    this.mostrandoResultados.set(false);
    // Reenfocar el input de búsqueda
    setTimeout(() => this.inputBusqueda?.nativeElement.focus(), 50);
  }

  // --- 🆕 Manejo de imagen ---
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.toast.error('Solo se permiten archivos de imagen');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('La imagen no puede superar los 5 MB');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagenSlot.set({
        file,
        preview: e.target.result,
        existingUrl: undefined,
        isExisting: false,
      });
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeImage(event?: Event): void {
    if (event) event.stopPropagation();
    this.imagenSlot.set({ file: null, preview: null });
  }

  // --- Detectar click fuera del dropdown ---
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      this.inputBusqueda?.nativeElement.contains(target) ||
      this.scrollContainer?.nativeElement.contains(target)
    ) {
      return;
    }
    this.mostrandoResultados.set(false);
  }

  // --- Detectar tecla Escape ---
  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (this.mostrandoResultados()) {
      this.mostrandoResultados.set(false);
      this.inputBusqueda?.nativeElement.blur();
      keyboardEvent.preventDefault();
    }
  }

  // --- Mostrar lista al enfocar ---
  abrirLista(): void {
    if (!this.mostrandoResultados()) {
      this.buscarPaquetes();
    }
  }

  // --- Publicar paquete ---
  publicarPaquete(): void {
    // Validaciones
    if (!this.nombre().trim()) {
      this.toast.error('El nombre de la publicación es requerido.', 'Error de validación');
      return;
    }
    if (!this.paqueteBaseSeleccionado()) {
      this.toast.error('Debés seleccionar un paquete base.', 'Error de validación');
      return;
    }
    if (!this.zonaSeleccionada()) {
      this.toast.error('Debés seleccionar una zona.', 'Error de validación');
      return;
    }
    if (!this.estadoSeleccionado()) {
      this.toast.error('Debés seleccionar un estado.', 'Error de validación');
      return;
    }
    if (!this.fechaInicio() || !this.fechaFin()) {
      this.toast.error('Debés ingresar las fechas de inicio y fin.', 'Error de validación');
      return;
    }

    // Validar que las fechas sean coherentes (inicio <= fin)
    const dInicio = new Date(this.fechaInicio());
    const dFin = new Date(this.fechaFin());
    if (dFin < dInicio) {
      this.toast.error('La fecha de fin no puede ser anterior a la fecha de inicio.', 'Error de validación');
      return;
    }

    // Validar descuento
    const desc = this.descuento();
    if (desc !== null && (desc < 0 || desc > 100)) {
      this.toast.error('El descuento debe ser un valor entre 0 y 100.', 'Error de validación');
      return;
    }

    // Construir Payload JSON
    const payload: any = {
      nombre: this.nombre().trim(),
      paqueteBaseId: Number(this.paqueteBaseSeleccionado()!),
      estadoId: Number(this.estadoSeleccionado()!),
      zonaId: Number(this.zonaSeleccionada()!),
      fecha_inicio: this.argentinaDateToUTCIso(this.fechaInicio()),
      fecha_fin: this.argentinaDateToUTCIso(this.fechaFin()),
    };

    if (this.cantProductos() !== null) {
      payload.cant_productos = Number(this.cantProductos());
    }
    if (desc !== null) {
      payload.descuento = Number(desc);
    }

    const slot = this.imagenSlot();
    if (slot.preview && !slot.isExisting) {
      payload.imagen_base64 = slot.preview; // Enviar como base64 si el backend lo soporta
    }

    const editId = this.editId();
    if (this.isEditMode() && editId) {
      payload.id_paquete_publicado = Number(editId);
    }

    const request$ = (this.isEditMode() && editId)
      ? this.paquetePublicadoService.updatePaquete(payload)
      : this.paquetePublicadoService.createPaquete(payload);

    this.cargando.set(true);

    request$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result: any) => {
          this.cargando.set(false);
          this.toast.success(
            this.isEditMode() ? 'Publicación actualizada correctamente 🎉' : 'Paquete publicado correctamente 🎉',
            'Éxito'
          );
          this.reiniciarFormulario();
          const newId = result?.id_paquete_publicado;
          this.router.navigate(['/admin/administrar-publicaciones'], {
            queryParams: {
              reload: '1',
              ...(newId ? { highlight: String(newId) } : {})
            }
          });
        },
        error: (err) => {
          this.cargando.set(false);
          console.error('Error al publicar/actualizar paquete:', err);
          const msg = err.error?.message || 'Ocurrió un error al procesar el paquete.';
          this.toast.error(msg, 'Fallo');
        },
      });
  }

  // --- 🆕 Helper para parsear descuento desde template ---
  setDescuento(value: string | number | null): void {
    if (value === null || value === '' || value === undefined) {
      this.descuento.set(null);
    } else {
      const parsed = Number(value);
      this.descuento.set(isNaN(parsed) ? null : parsed);
    }
  }

  // --- Convierte "YYYY-MM-DD" Argentina → UTC ISO string para medianoche ART ---
  private argentinaDateToUTCIso(dateStr: string): string {
    const tz = 'America/Argentina/Buenos_Aires';
    // Referencia: mediodía UTC garantiza la misma fecha en Argentina (siempre UTC-3 o menos)
    const refUTC = new Date(`${dateStr}T12:00:00.000Z`);
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(refUTC);
    const hora = Number(partes.find(p => p.type === 'hour')?.value ?? 12);
    const min  = Number(partes.find(p => p.type === 'minute')?.value ?? 0);
    // offsetMs = diferencia UTC − ART en ms (ej: (12*60 − 9*60) * 60000 = 10800000)
    const offsetMs = ((12 * 60) - (hora * 60 + min)) * 60_000;
    return new Date(new Date(`${dateStr}T00:00:00.000Z`).getTime() + offsetMs).toISOString();
  }

  // --- Helper para obtener la fecha actual en formato YYYY-MM-DD para Argentina ---
  private getHoyString(): string {
    const today = new Date();
    return today.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  }

  // --- Reset formulario ---
  reiniciarFormulario(): void {
    this.busqueda.set('');
    this.paqueteBaseSeleccionado.set(null);
    this.zonaSeleccionada.set(null);
    this.estadoSeleccionado.set(2);
    this.fechaInicio.set(this.getHoyString());
    this.fechaFin.set('');
    this.cantProductos.set(null);
    this.nombre.set('');
    this.descuento.set(null);
    this.imagenSlot.set({ file: null, preview: null });
  }
}
