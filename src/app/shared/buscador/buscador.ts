import {
  Component,
  input,
  output,
  signal,
  computed,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface OpcionSelect {
  id: string | number;
  etiqueta: string;
  deshabilitado?: boolean;
  grupo?: string;
  [key: string]: any;
}

/**
 * Configuración genérica para buscar datos
 * T = tipo de datos que retorna el servicio (ej: PaquetePublicado, Producto)
 */
export interface ConfigBuscador<T = any> {
  obtenerDatos: () => Observable<T[]>;
  filtrar: (datos: T[], termino: string) => T[];
  mapear: (item: T) => OpcionSelect;
  campoTexto?: string;
  debounceMs?: number;
}

@Component({
  selector: 'app-buscador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscador.html',
})
export class BuscadorComponent<T = any> implements OnInit {
  @ViewChild('contenedorDropdown') contenedorDropdown!: ElementRef;
  @ViewChild('inputBusqueda') inputBusqueda!: ElementRef;

  // 🎯 SIGNAL INPUTS - La forma moderna de Angular 17+
  // Estos SÍ aceptan valores directos desde el template
  etiqueta = input<string>('');
  marcador = input<string>('Seleccionar opción');
  requerido = input<boolean>(false);
  deshabilitado = input<boolean>(false);
  limpiable = input<boolean>(true);
  buscable = input<boolean>(true);
  multiSeleccion = input<boolean>(false);
  maxSelecciones = input<number>(0);
  textAyuda = input<string>('');
  mensajeError = input<string>('');
  mensajeExito = input<string>('');
  tamañoEtiqueta = input<'sm' | 'md' | 'lg'>('md');
  tamaño = input<'sm' | 'md' | 'lg'>('md');
  textoCargando = input<string>('Cargando opciones...');
  textoVacio = input<string>('No se encontraron opciones');
  textoErrorCarga = input<string>('Error al cargar opciones');

  // Config también puede ser signal input
  config = input<ConfigBuscador<T> | null>(null);

  // 📤 OUTPUTS modernos
  cambioValor = output<OpcionSelect | OpcionSelect[] | null>();
  cambioApertura = output<boolean>();
  datosCargados = output<OpcionSelect[]>();
  errorDatos = output<Error>();
  seleccionado = output<any>(); // Emite el dato original T

  // 🎨 Estado interno (signals normales)
  valorSeleccionado = signal<OpcionSelect | OpcionSelect[] | null>(null);
  idsSeleccionados = signal<(string | number)[]>([]);
  terminoBusqueda = signal<string>('');
  abierto = signal<boolean>(false);
  enfocado = signal<boolean>(false);
  cargando = signal<boolean>(false);
  errorCarga = signal<string | null>(null);
  idEntrada = signal<string>(`select-${Math.random().toString(36).substr(2, 9)}`);

  // Datos internos
  private datosOriginales: T[] = [];
  private opcionesInternas = signal<OpcionSelect[]>([]);

  // Propiedades accesibles en el template
  ObjectKeys = Object.keys;

  // 📊 COMPUTED - Ahora usando signal inputs directamente
  todasOpciones = computed(() => this.opcionesInternas());

  opcionesFiltradas = computed(() => {
    const termino = this.terminoBusqueda().toLowerCase();
    if (!termino) return this.todasOpciones();

    return this.todasOpciones().filter((opt) =>
      opt.etiqueta.toLowerCase().includes(termino)
    );
  });

  opcionesAgrupadas = computed(() => {
    const opts = this.opcionesFiltradas();
    const agrupadas: { [key: string]: OpcionSelect[] } = {};

    opts.forEach((opt) => {
      const grupo = opt.grupo || 'Sin grupo';
      if (!agrupadas[grupo]) agrupadas[grupo] = [];
      agrupadas[grupo].push(opt);
    });

    return agrupadas;
  });

  etiquetaMostrada = computed(() => {
    const seleccionado = this.valorSeleccionado();
    if (!seleccionado) return '';

    if (Array.isArray(seleccionado)) {
      return seleccionado.map((s) => s.etiqueta).join(', ');
    }
    return seleccionado.etiqueta;
  });

  conteoSeleccionados = computed(() => {
    const seleccionado = this.valorSeleccionado();
    if (Array.isArray(seleccionado)) return seleccionado.length;
    return seleccionado ? 1 : 0;
  });

  errorActual = computed(() => {
    if (this.errorCarga()) return this.errorCarga();
    if (!this.enfocado() && this.requerido() && !this.valorSeleccionado()) {
      return 'Este campo es requerido';
    }
    return this.mensajeError();
  });

  tieneError = computed(() => !!this.errorActual());

  claseEtiqueta = computed(() => {
    const tamaños: { [key: string]: string } = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg font-semibold',
    };
    return tamaños[this.tamañoEtiqueta()];
  });

  clasesEntrada = computed(() => {
    const base =
      'w-full px-4 py-2.5 border rounded-full transition-all focus:outline-none focus:ring-2 cursor-pointer';
    const tamaños: { [key: string]: string } = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    const bordes = this.tieneError()
      ? 'border-red-500 focus:ring-red-300 focus:border-red-500 bg-red-50'
      : this.enfocado() || this.abierto()
        ? 'border-secondary focus:ring-secondary/30 focus:border-secondary bg-white'
        : 'border-gray-300 hover:border-gray-400 bg-white';

    const deshabilitadoClase = this.deshabilitado() ? 'opacity-50 cursor-not-allowed' : '';

    return `${base} ${tamaños[this.tamaño()]} ${bordes} ${deshabilitadoClase}`;
  });

  tieneAyudaOError = computed(
    () =>
      !!this.textAyuda() ||
      !!this.errorActual() ||
      !!this.mensajeExito()
  );

  // 🎯 EFFECT - Reemplaza OnChanges para signal inputs
  constructor() {
    // Effect para cargar datos cuando cambia la config
    effect(() => {
      const cfg = this.config();
      if (cfg) {
        this.cargarDatos();
      }
    });
  }

  ngOnInit(): void {
    // Ya no necesitas OnInit para esto, el effect lo maneja
  }

  // 📥 Cargar datos usando la configuración
  private async cargarDatos(): Promise<void> {
    const cfg = this.config();
    if (!cfg) return;

    try {
      this.cargando.set(true);
      this.errorCarga.set(null);

      const datos = await new Promise<T[]>((resolve, reject) => {
        let suscripcion: any;

        suscripcion = cfg.obtenerDatos()
          .pipe(
            debounceTime(cfg.debounceMs || 300),
            distinctUntilChanged()
          )
          .subscribe({
            next: (valor) => resolve(valor),
            error: reject,
          });

        // 🔐 Esto garantiza que siempre se desuscriba
        suscripcion.add(() => {
          suscripcion = null;
        });
      });

      // Guardar datos
      this.datosOriginales = datos;

      const opcionesMapeadas = datos.map((item) => cfg.mapear(item));
      this.opcionesInternas.set(opcionesMapeadas);
      this.datosCargados.emit(opcionesMapeadas);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.errorCarga.set(err.message);
      this.errorDatos.emit(err);

    } finally {
      this.cargando.set(false);
    }
  }

  // Métodos públicos
  alternarDropdown(): void {
    if (this.deshabilitado() || this.cargando()) return;

    this.abierto.update((v) => !v);
    this.cambioApertura.emit(this.abierto());

    if (this.abierto() && this.buscable()) {
      setTimeout(() => this.inputBusqueda?.nativeElement?.focus());
    }
  }

  seleccionarOpcion(opcion: OpcionSelect): void {
    if (opcion.deshabilitado) return;

    const cfg = this.config();
    if (!cfg) return;

    // Encontrar el dato original
    const datosOriginal = this.datosOriginales.find(
      (d) => cfg.mapear(d).id === opcion.id
    );

    if (this.multiSeleccion()) {
      this.manejarMultiSeleccion(opcion);
    } else {
      this.valorSeleccionado.set(opcion);
      this.idsSeleccionados.set([opcion.id]);
      this.abierto.set(false);
      this.terminoBusqueda.set('');
      this.cambioValor.emit(opcion);
      this.seleccionado.emit(datosOriginal); // Emitir dato original
    }
  }

  private manejarMultiSeleccion(opcion: OpcionSelect): void {
    const actual = Array.isArray(this.valorSeleccionado())
      ? this.valorSeleccionado()
      : [];
    const ids = this.idsSeleccionados();

    const seleccionado = ids.includes(opcion.id);

    if (seleccionado) {
      const actualizado = (actual as OpcionSelect[]).filter((o) => o.id !== opcion.id);
      this.valorSeleccionado.set(actualizado.length > 0 ? actualizado : null);
      this.idsSeleccionados.set(actualizado.map((o) => o.id));
    } else {
      if (this.maxSelecciones() && ids.length >= this.maxSelecciones()) {
        return;
      }

      const actualizado = [...actual as OpcionSelect[], opcion];
      this.valorSeleccionado.set(actualizado);
      this.idsSeleccionados.set(actualizado.map((o) => o.id));
    }

    this.cambioValor.emit(this.valorSeleccionado());
  }

  esOpcionSeleccionada(opcion: OpcionSelect): boolean {
    return this.idsSeleccionados().includes(opcion.id);
  }

  limpiarValor(): void {
    this.valorSeleccionado.set(null);
    this.idsSeleccionados.set([]);
    this.terminoBusqueda.set('');
    this.abierto.set(false);
    this.cambioValor.emit(null);
  }

  eliminarSeleccion(opcion: OpcionSelect, evento?: Event): void {
    if (evento) evento.stopPropagation();

    if (this.multiSeleccion()) {
      const actual = Array.isArray(this.valorSeleccionado()) ? this.valorSeleccionado() : [];
      const actualizado = (actual as OpcionSelect[]).filter((o) => o.id !== opcion.id);
      this.valorSeleccionado.set(actualizado.length > 0 ? actualizado : null);
      this.idsSeleccionados.set(actualizado.map((o) => o.id));
      this.cambioValor.emit(this.valorSeleccionado());
    }
  }

  manejarDesenfoque(): void {
    this.enfocado.set(false);
  }

  manejarEnfoque(): void {
    this.enfocado.set(true);
  }

  alCambiarBusqueda(termino: string): void {
    this.terminoBusqueda.set(termino);
  }

  recargarDatos(): void {
    this.cargarDatos();
  }

  @HostListener('document:click', ['$event'])
  alHacerClickDocumento(evento: MouseEvent): void {
    if (
      !this.contenedorDropdown?.nativeElement?.contains(evento.target) &&
      this.abierto()
    ) {
      this.abierto.set(false);
      this.cambioApertura.emit(false);
    }
  }

  get valorMostrado(): string {
    return this.etiquetaMostrada();
  }

  esArray(valor: any): boolean {
    return Array.isArray(valor);
  }

  getGroupKeys(): string[] {
    return Object.keys(this.opcionesAgrupadas());
  }

  getGroupOptions(grupo: string): OpcionSelect[] {
    return this.opcionesAgrupadas()[grupo] || [];
  }

  getSeleccionados(): OpcionSelect[] {
    const valor = this.valorSeleccionado();
    return Array.isArray(valor) ? valor : [];
  }
}
