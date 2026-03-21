import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  DestroyRef,
  effect,
  signal,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaqueteBaseService } from '@app/services/paquete/paquete-base.service';
import { ZonaService } from '@app/services/zona/zona.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { ToastService } from '@app/services/toast/toast.service';
import { AdminCreateWrapperComponent } from '@app/shared/admin-create-wrapper/admin-create-wrapper';
import { IconComponent } from '@app/shared/icono/icono';
import { AdminBackButtonComponent } from '@app/shared/admin-back-button/admin-back-button';

@Component({
  selector: 'app-publicar-paquete',
  standalone: true,
  imports: [FormsModule, ButtonComponent, AdminCreateWrapperComponent, IconComponent, AdminBackButtonComponent],
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

  // Estados y control
  cargando = signal<boolean>(false);
  mostrandoResultados = signal<boolean>(false);
  busqueda = signal<string>('');
  
  // ✏️ Edición
  isEditMode = signal<boolean>(false);
  editId = signal<number | null>(null);
  
  // 💡 Control de fecha para duplicado
  isDuplicate = signal<boolean>(false);


  estados = [
    { id_estado: 1, nombre: 'Pendiente' },
    { id_estado: 2, nombre: 'Activo' },
    { id_estado: 3, nombre: 'Finalizado' },
  ];

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
  ) {
    // ⚡ Efecto reactivo: filtra automáticamente al cambiar la búsqueda
    effect(() => {
      const q = this.busqueda().trim();
      if (q.length === 0 || q.length > 1) {
        this.buscarPaquetes();
      }
    });
  }

  ngOnInit(): void {
    this.cargarZonas();
    this.cargarPaquetesIniciales();
    
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
  }

  // --- Cargar datos para edición ---
  cargarDatosEdicion(id: number): void {
    this.cargando.set(true);
    this.paquetePublicadoService.getPaqueteById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (paquete) => {
        this.paqueteBaseSeleccionado.set(paquete.paqueteBase?.id_paquete_base ?? null);
        this.busqueda.set(paquete.paqueteBase?.nombre ?? '');
        this.zonaSeleccionada.set(paquete.zonaId ?? null);
        this.estadoSeleccionado.set(paquete.estado?.id_estado ?? null);
        
        if (paquete.fecha_inicio) {
          const fi = new Date(paquete.fecha_inicio);
          this.fechaInicio.set(this.isDuplicate() ? '' : fi.toISOString().split('T')[0]);
        }
        if (paquete.fecha_fin) {
          const ff = new Date(paquete.fecha_fin);
          this.fechaFin.set(this.isDuplicate() ? '' : ff.toISOString().split('T')[0]);
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

    const paquetePayload = {
      ...(this.isEditMode() ? { id_paquete_publicado: this.editId()! } : {}),
      paqueteBaseId: this.paqueteBaseSeleccionado()!,
      estadoId: this.estadoSeleccionado()!,
      zonaId: this.zonaSeleccionada()!,
      fecha_inicio: new Date(this.fechaInicio()),
      fecha_fin: new Date(this.fechaFin()),
      cant_productos: this.cantProductos() ?? undefined,
      estado: this.estados.find(e => e.id_estado === this.estadoSeleccionado())!,
    };

    const request$ = this.isEditMode()
      ? this.paquetePublicadoService.updatePaquete(paquetePayload as any)
      : this.paquetePublicadoService.createPaquete(paquetePayload as any);

    request$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success(this.isEditMode() ? 'Paquete actualizado correctamente 🎉' : 'Paquete publicado correctamente 🎉', 'Éxito');
          this.reiniciarFormulario();
          // 🚀 Redirigir de vuelta a la gestión
          this.router.navigate(['/admin/administrar-paquetes']); // Wait... wait. The user wanted to manage packages from "administrar-publicaciones"? No, wait, they click duplicate from "administrar-publicaciones". The redirect should probably be back to administrar-publicaciones. Let me check what the code originally navigated to. It was "administrar-paquetes" originally in publicar-paquete.ts. I will change it to redirect to administrar-publicaciones since that's where we manage them. Actually I will redirect back to administrar-publicaciones. Wait, the original code had `this.router.navigate(['/admin/administrar-paquetes']);`.
          this.router.navigate(['/admin/administrar-publicaciones']);
        },
        error: (err) => {
          console.error('Error al publicar/actualizar paquete:', err);
          const msg = err.error?.message || 'Ocurrió un error al procesar el paquete.';
          this.toast.error(msg, 'Fallo');
        },
      });
  }

  // --- Reset formulario ---
  reiniciarFormulario(): void {
    this.busqueda.set('');
    this.paqueteBaseSeleccionado.set(null);
    this.zonaSeleccionada.set(null);
    this.estadoSeleccionado.set(null);
    this.fechaInicio.set('');
    this.fechaFin.set('');
    this.cantProductos.set(null);
  }
}
