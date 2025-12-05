import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  forwardRef,
  effect,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
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
  // Función que retorna un Observable con los datos
  obtenerDatos: () => Observable<T[]>;
  
  // Función que filtra los datos según el término de búsqueda
  filtrar: (datos: T[], termino: string) => T[];
  
  // Función que mapea los datos T a OpcionSelect para mostrar
  mapear: (item: T) => OpcionSelect;
  
  // Campo por el que se busca (ej: 'nombre', 'etiqueta')
  campoTexto?: string;
  
  // Debounce en ms para la búsqueda
  debounceMs?: number;
}

@Component({
  selector: 'app-buscador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscador.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BuscadorComponent),
      multi: true,
    },
  ],
})
export class BuscadorComponent<T = any> implements OnInit, ControlValueAccessor, OnChanges {
  @ViewChild('contenedorDropdown') contenedorDropdown!: ElementRef;
  @ViewChild('inputBusqueda') inputBusqueda!: ElementRef;

  // Inputs - Configuración genérica
  @Input() etiqueta = signal<string>('');
  @Input() marcador = signal<string>('Seleccionar opción');
  @Input() requerido = signal<boolean>(false);
  @Input() deshabilitado = signal<boolean>(false);
  @Input() limpiable = signal<boolean>(true);
  @Input() buscable = signal<boolean>(true);
  @Input() multiSeleccion = signal<boolean>(false);
  @Input() maxSelecciones = signal<number>(0);
  @Input() textAyuda = signal<string>('');
  @Input() mensajeError = signal<string>('');
  @Input() mensajeExito = signal<string>('');
  @Input() tamañoEtiqueta = signal<'sm' | 'md' | 'lg'>('md');
  @Input() tamaño = signal<'sm' | 'md' | 'lg'>('md');
  @Input() textoCargando = signal<string>('Cargando opciones...');
  @Input() textoVacio = signal<string>('No se encontraron opciones');
  @Input() textoErrorCarga = signal<string>('Error al cargar opciones');

  // 🎯 INPUT PRINCIPAL: Configuración del buscador
  @Input() config: ConfigBuscador<T> | null = null;

  // Outputs
  @Output() cambioValor = new EventEmitter<OpcionSelect | OpcionSelect[] | null>();
  @Output() cambioApertura = new EventEmitter<boolean>();
  @Output() datosCargados = new EventEmitter<OpcionSelect[]>();
  @Output() errorDatos = new EventEmitter<Error>();
  @Output() seleccionado = new EventEmitter<any>(); // Emite el dato original T

  // Estado interno
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

  // Computed
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

  constructor() {
    effect(() => {
      if (this.config) {
        this.cargarDatos();
      }
    });
  }

  ngOnInit(): void {
    if (this.config) {
      this.cargarDatos();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && !changes['config'].firstChange) {
      this.cargarDatos();
    }
  }

  // 📥 Cargar datos usando la configuración
  private async cargarDatos(): Promise<void> {
    if (!this.config) return;

    try {
      this.cargando.set(true);
      this.errorCarga.set(null);

      const datos = await new Promise<T[]>((resolve, reject) => {
        const observable = this.config!.obtenerDatos();
        const suscripcion = observable.pipe(
          debounceTime(this.config!.debounceMs || 300),
          distinctUntilChanged()
        ).subscribe({
          next: (valor) => {
            suscripcion.unsubscribe();
            resolve(valor);
          },
          error: reject,
        });
      });

      this.datosOriginales = datos;

      // Mapear a OpcionSelect
      const opcionesMapeadas = datos.map((item) => this.config!.mapear(item));
      this.opcionesInternas.set(opcionesMapeadas);
      this.datosCargados.emit(opcionesMapeadas);
      this.cargando.set(false);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.errorCarga.set(err.message);
      this.errorDatos.emit(err);
      this.cargando.set(false);
    }
  }

  // ControlValueAccessor
  private alCambiar: (valor: any) => void = () => {};
  private alTocar: () => void = () => {};

  writeValue(valor: any): void {
    if (valor === null || valor === undefined) {
      this.valorSeleccionado.set(null);
      this.idsSeleccionados.set([]);
      this.terminoBusqueda.set('');
    } else if (Array.isArray(valor)) {
      this.valorSeleccionado.set(valor);
      this.idsSeleccionados.set(valor.map((v) => v.id));
    } else {
      this.valorSeleccionado.set(valor);
      this.idsSeleccionados.set([valor.id]);
    }
  }

  registerOnChange(fn: (valor: any) => void): void {
    this.alCambiar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocar = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
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

    // Encontrar el dato original
    const datosOriginal = this.datosOriginales.find(
      (d) => this.config!.mapear(d).id === opcion.id
    );

    if (this.multiSeleccion()) {
      this.manejarMultiSeleccion(opcion, datosOriginal);
    } else {
      this.valorSeleccionado.set(opcion);
      this.idsSeleccionados.set([opcion.id]);
      this.abierto.set(false);
      this.terminoBusqueda.set('');
      this.alCambiar(opcion);
      this.cambioValor.emit(opcion);
      this.seleccionado.emit(datosOriginal); // Emitir dato original
    }
  }

  private manejarMultiSeleccion(opcion: OpcionSelect, datosOriginal?: T): void {
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

    this.alCambiar(this.valorSeleccionado());
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
    this.alCambiar(null);
    this.cambioValor.emit(null);
  }

  eliminarSeleccion(opcion: OpcionSelect, evento?: Event): void {
    if (evento) evento.stopPropagation();

    if (this.multiSeleccion()) {
      const actual = Array.isArray(this.valorSeleccionado()) ? this.valorSeleccionado() : [];
      const actualizado = (actual as OpcionSelect[]).filter((o) => o.id !== opcion.id);
      this.valorSeleccionado.set(actualizado.length > 0 ? actualizado : null);
      this.idsSeleccionados.set(actualizado.map((o) => o.id));
      this.alCambiar(this.valorSeleccionado());
      this.cambioValor.emit(this.valorSeleccionado());
    }
  }

  manejarDesenfoque(): void {
    this.enfocado.set(false);
    this.alTocar();
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