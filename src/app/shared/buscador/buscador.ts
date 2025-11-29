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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Observable } from 'rxjs';

export interface OpcionSelect {
  id: string | number;
  etiqueta: string;
  deshabilitado?: boolean;
  grupo?: string;
  [key: string]: any;
}

export interface ConfigFuenteDatos<T = any> {
  mapeo: (item: T) => OpcionSelect;
  obtenerDatos: () => Promise<T[]> | Observable<T[]>;
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
export class BuscadorComponent implements OnInit, ControlValueAccessor {
  @ViewChild('contenedorDropdown') contenedorDropdown!: ElementRef;
  @ViewChild('inputBusqueda') inputBusqueda!: ElementRef;

  // Inputs - Datos
  @Input() etiqueta = signal<string>('');
  @Input() marcador = signal<string>('Seleccionar opción');
  @Input() opciones = signal<OpcionSelect[]>([]);
  @Input() fuenteDatos = signal<ConfigFuenteDatos | null>(null);
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

  // Outputs
  @Output() cambioValor = new EventEmitter<OpcionSelect | OpcionSelect[] | null>();
  @Output() cambioApertura = new EventEmitter<boolean>();
  @Output() datosCargados = new EventEmitter<OpcionSelect[]>();
  @Output() errorDatos = new EventEmitter<Error>();

  // Estado interno
  valorSeleccionado = signal<OpcionSelect | OpcionSelect[] | null>(null);
  idsSeleccionados = signal<(string | number)[]>([]);
  terminoBusqueda = signal<string>('');
  abierto = signal<boolean>(false);
  enfocado = signal<boolean>(false);
  cargando = signal<boolean>(false);
  errorCarga = signal<string | null>(null);
  idEntrada = signal<string>(`select-${Math.random().toString(36).substr(2, 9)}`);

  // Propiedades accesibles en el template
  ObjectKeys = Object.keys;

  // Computed
  todasOpciones = computed(() => {
    return this.opciones().length > 0 ? this.opciones() : [];
  });

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
      'w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2 cursor-pointer';
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
      const fuenteDatos = this.fuenteDatos();
      if (fuenteDatos) {
        this.cargarDatosFuente(fuenteDatos);
      }
    });
  }

  ngOnInit(): void {
    if (this.fuenteDatos() && this.opciones().length === 0) {
      this.cargarDatosFuente(this.fuenteDatos()!);
    }
  }

  private async cargarDatosFuente(config: ConfigFuenteDatos): Promise<void> {
    try {
      this.cargando.set(true);
      this.errorCarga.set(null);

      const resultado = config.obtenerDatos();
      let datos: any[];

      if (resultado instanceof Promise) {
        datos = await resultado;
      } else if (resultado instanceof Observable) {
        datos = await new Promise((resolve, reject) => {
          const suscripcion = resultado.subscribe({
            next: (valor) => {
              suscripcion.unsubscribe();
              resolve(valor);
            },
            error: reject,
          });
        });
      } else {
        throw new Error('obtenerDatos debe retornar Promise u Observable');
      }

      const opcionesMapeadas = datos.map((item) => config.mapeo(item));
      this.opciones.set(opcionesMapeadas);
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

    if (this.multiSeleccion()) {
      this.manejarMultiSeleccion(opcion);
    } else {
      this.valorSeleccionado.set(opcion);
      this.idsSeleccionados.set([opcion.id]);
      this.abierto.set(false);
      this.terminoBusqueda.set('');
      this.alCambiar(opcion);
      this.cambioValor.emit(opcion);
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
    if (this.fuenteDatos()) {
      this.cargarDatosFuente(this.fuenteDatos()!);
    }
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

  // 🎯 MÉTODO GENÉRICO PARA CONFIGURAR FUENTE DE DATOS
  configurarFuenteDatos<T>(
    obtenerDatos: () => Observable<T[]> | Promise<T[]>,
    mapeo: (item: T) => OpcionSelect
  ): void {
    this.fuenteDatos.set({
      obtenerDatos,
      mapeo,
    });
  }
}