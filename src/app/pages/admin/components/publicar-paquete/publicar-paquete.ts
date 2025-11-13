import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  DestroyRef,
  effect,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { PaqueteBaseService } from '@app/services/paquete/paquete-base.service';
import { ZonaService } from '@app/services/zona/zona.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { ButtonComponent } from '@app/shared/botones-component/buttonComponent';

@Component({
  selector: 'app-publicar-paquete',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
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

  estados = [
    { id_estado: 1, nombre: 'Pendiente' },
    { id_estado: 2, nombre: 'Activo' },
    { id_estado: 3, nombre: 'Finalizado' },
  ];

  // 🧩 ViewChilds
  @ViewChild('inputBusqueda') inputBusqueda!: ElementRef<HTMLInputElement>;
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLElement>;

  constructor(
    private toastr: ToastrService,
    private paqueteBaseService: PaqueteBaseService,
    private zonaService: ZonaService,
    private paquetePublicadoService: PaquetePublicadoService,
    private destroyRef: DestroyRef
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
  }

  // --- Cargar primeros 10 paquetes base ---
  cargarPaquetesIniciales(): void {
    this.cargando.set(true);

    this.paqueteBaseService
      .getPaquetes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const primeros = data.slice(0, 10);
          this.paquetesBase.set(data);
          this.resultadosBusqueda.set(primeros);
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('❌ Error al obtener paquetes base:', err);
          this.toastr.error('Error al cargar los paquetes base.', 'Error');
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
          this.toastr.error('Error al cargar las zonas.', 'Error');
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
      this.toastr.error('Debés seleccionar un paquete base.', 'Error de validación');
      return;
    }
    if (!this.zonaSeleccionada()) {
      this.toastr.error('Debés seleccionar una zona.', 'Error de validación');
      return;
    }
    if (!this.estadoSeleccionado()) {
      this.toastr.error('Debés seleccionar un estado.', 'Error de validación');
      return;
    }
    if (!this.fechaInicio() || !this.fechaFin()) {
      this.toastr.error('Debés ingresar las fechas de inicio y fin.', 'Error de validación');
      return;
    }

    const paquete = {
      paqueteBaseId: this.paqueteBaseSeleccionado()!,
      estadoId: this.estadoSeleccionado()!,
      zonaId: this.zonaSeleccionada()!,
      fecha_inicio: new Date(this.fechaInicio()),
      fecha_fin: new Date(this.fechaFin()),
      cant_productos: this.cantProductos() ?? undefined,
      estado: this.estados.find(e => e.id_estado === this.estadoSeleccionado())!,
    };


    this.paquetePublicadoService
      .createPaquete(paquete)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('Paquete publicado correctamente 🎉', 'Éxito');
          this.reiniciarFormulario();
        },
        error: (err) => {
          console.error('Error al publicar paquete:', err);
          const msg = err.error?.message || 'Ocurrió un error al publicar el paquete.';
          this.toastr.error(msg, 'Fallo');
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
