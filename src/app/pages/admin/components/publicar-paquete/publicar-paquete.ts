import {
  Component,
  OnInit,
  inject,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  // --- Datos principales ---
  paquetesBase: any[] = [];
  zonas: any[] = [];

  // --- Selecciones del formulario ---
  paqueteBaseSeleccionado: number | null = null;
  zonaSeleccionada: number | null = null;
  estadoSeleccionado: number | null = null;
  fechaInicio: string = '';
  fechaFin: string = '';
  cantProductos: number | null = null;

  // --- Estados ---
  estados = [
    { id_estado: 1, nombre: 'Pendiente' },
    { id_estado: 2, nombre: 'Activo' },
    { id_estado: 3, nombre: 'Finalizado' },
  ];

  // --- Buscador ---
  busqueda = '';
  resultadosBusqueda: any[] = [];
  mostrandoResultados = false;
  cargando = false;

  // --- Referencias ---
  @ViewChild('inputBusqueda') inputBusqueda!: ElementRef<HTMLInputElement>;
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLElement>;

  private toastr = inject(ToastrService);
  private paqueteBaseService = inject(PaqueteBaseService);
  private zonaService = inject(ZonaService);
  private paquetePublicadoService = inject(PaquetePublicadoService);

  ngOnInit(): void {
    this.cargarZonas();
    this.cargarPaquetesIniciales();
  }

  // --- Cargar primeros 10 paquetes base ---
  cargarPaquetesIniciales(): void {
    this.cargando = true;
    this.paqueteBaseService.getPaquetes().subscribe({
      next: (data) => {
        this.paquetesBase = data.slice(0, 10);
        this.resultadosBusqueda = this.paquetesBase;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener paquetes base:', err);
        this.toastr.error('Error al cargar los paquetes base.', 'Error');
        this.cargando = false;
      },
    });
  }

  cargarZonas(): void {
    this.zonaService.getZonas().subscribe({
      next: (data) => (this.zonas = data),
      error: (err) => {
        console.error('Error al obtener zonas:', err);
        this.toastr.error('Error al cargar las zonas.', 'Error');
      },
    });
  }

  // --- Buscar por nombre ---
  buscarPaquetes(): void {
    const query = this.busqueda.trim().toLowerCase();

    if (!query) {
      // Si no hay texto → mostrar primeros 10
      this.resultadosBusqueda = this.paquetesBase.slice(0, 10);
      this.mostrandoResultados = true;
      return;
    }

    this.resultadosBusqueda = this.paquetesBase.filter((p) =>
      p.nombre.toLowerCase().includes(query)
    );
    this.mostrandoResultados = true;
  }

  // --- Seleccionar paquete ---
  seleccionarPaquete(paquete: any): void {
    this.paqueteBaseSeleccionado = paquete.id_paquete_base;
    this.busqueda = paquete.nombre;
    this.mostrandoResultados = false;
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
    this.mostrandoResultados = false;
  }

  // --- Detectar tecla Escape ---
  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;

    if (this.mostrandoResultados) {
      this.mostrandoResultados = false;
      this.inputBusqueda?.nativeElement.blur();
      keyboardEvent.preventDefault();
    }
  }

  // --- Mostrar lista al enfocar el input ---
  abrirLista(): void {
    if (!this.mostrandoResultados) {
      this.buscarPaquetes();
    }
  }

  // --- Publicar paquete ---
  publicarPaquete(): void {
    if (!this.paqueteBaseSeleccionado) {
      this.toastr.error('Debés seleccionar un paquete base.', 'Error de validación');
      return;
    }
    if (!this.zonaSeleccionada) {
      this.toastr.error('Debés seleccionar una zona.', 'Error de validación');
      return;
    }
    if (!this.estadoSeleccionado) {
      this.toastr.error('Debés seleccionar un estado.', 'Error de validación');
      return;
    }
    if (!this.fechaInicio || !this.fechaFin) {
      this.toastr.error('Debés ingresar las fechas de inicio y fin.', 'Error de validación');
      return;
    }

    const paquete = {
      paqueteBaseId: this.paqueteBaseSeleccionado,
      estadoId: this.estadoSeleccionado,
      zonaId: this.zonaSeleccionada,
      fecha_inicio: new Date(this.fechaInicio),
      fecha_fin: new Date(this.fechaFin),
      cant_productos: this.cantProductos ?? undefined,
    };

    this.paquetePublicadoService.createPaquete(paquete).subscribe({
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

  reiniciarFormulario(): void {
    this.busqueda = '';
    this.paqueteBaseSeleccionado = null;
    this.zonaSeleccionada = null;
    this.estadoSeleccionado = null;
    this.fechaInicio = '';
    this.fechaFin = '';
    this.cantProductos = null;
  }
}
