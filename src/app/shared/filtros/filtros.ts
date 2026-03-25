import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '../icono/icono';

// 📦 Interfaces para los filtros
export interface OpcionFiltro {
  id: string | number;
  nombre: string;
  valor: any;
}

export interface RangoPrecio {
  min: number | null;
  max: number | null;
}

export interface FiltrosAplicados {
  categorias: (string | number)[];
  marcas: (string | number)[];
  tiposPaquete: string[];
  ordenamiento: string;
  rangoPrecio: RangoPrecio;
  estados: string[];
}

/**
 * Configuración de filtros disponibles
 * Define qué filtros mostrar y cómo obtener sus datos
 */
export interface ConfigFiltros {
  // 🎯 Servicios para obtener datos
  obtenerCategorias?: () => Observable<OpcionFiltro[]>;
  obtenerMarcas?: () => Observable<OpcionFiltro[]>;

  // 🎨 Filtros a mostrar (true = mostrar, false = ocultar)
  mostrarCategoria?: boolean;
  mostrarMarca?: boolean;
  mostrarTipoPaquete?: boolean;
  mostrarRangoPrecio?: boolean;
  mostrarOrdenamiento?: boolean;
  mostrarEstados?: boolean;

  // 📋 Opciones personalizadas
  opcionesTipoPaquete?: OpcionFiltro[];
  opcionesOrdenamiento?: OpcionFiltro[];
  opcionesEstados?: OpcionFiltro[];

  // 🎯 Textos personalizables
  tituloCategoria?: string;
  tituloMarca?: string;
  tituloTipoPaquete?: string;
  tituloRangoPrecio?: string;
  tituloOrdenamiento?: string;
  tituloEstados?: string;
}

@Component({
  selector: 'app-filtros',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, IconComponent],
  templateUrl: './filtros.html',
})
export class FiltrosComponent {

  // 🎯 SIGNAL INPUTS
  config = input.required<ConfigFiltros>();
  titulo = input<string>('Filtros');

  // 📤 OUTPUTS
  filtrosAplicados = output<FiltrosAplicados>();
  filtrosLimpiados = output<void>();

  // 🎨 ESTADO INTERNO
  categorias = signal<OpcionFiltro[]>([]);
  marcas = signal<OpcionFiltro[]>([]);
  categoriasSeleccionadas = signal<(string | number)[]>([]);
  marcasSeleccionadas = signal<(string | number)[]>([]);
  tiposPaqueteSeleccionados = signal<string[]>([]);
  estadosSeleccionados = signal<string[]>([]);
  ordenSeleccionado = signal<string>('');
  precioMin = signal<number | null>(null);
  precioMax = signal<number | null>(null);

  cargando = signal<boolean>(false);
  error = signal<string | null>(null);
  isDrawerOpen = signal<boolean>(false);

  // 📊 COMPUTED
  tieneCategoriasSeleccionadas = computed(() => this.categoriasSeleccionadas().length > 0);
  tieneMarcasSeleccionadas = computed(() => this.marcasSeleccionadas().length > 0);
  tieneTiposPaqueteSeleccionados = computed(() => this.tiposPaqueteSeleccionados().length > 0);
  tieneEstadosSeleccionados = computed(() => this.estadosSeleccionados().length > 0);
  tieneRangoPrecio = computed(() => this.precioMin() !== null || this.precioMax() !== null);
  tieneOrdenamiento = computed(() => !!this.ordenSeleccionado());

  tieneFiltrosActivos = computed(() =>
    this.tieneCategoriasSeleccionadas() ||
    this.tieneMarcasSeleccionadas() ||
    this.tieneTiposPaqueteSeleccionados() ||
    this.tieneEstadosSeleccionados() ||
    this.tieneRangoPrecio() ||
    this.tieneOrdenamiento()
  );

  contadorFiltrosActivos = computed(() => {
    let count = 0;
    if (this.tieneCategoriasSeleccionadas()) count++;
    if (this.tieneMarcasSeleccionadas()) count++;
    if (this.tieneTiposPaqueteSeleccionados()) count++;
    if (this.tieneEstadosSeleccionados()) count++;
    if (this.tieneRangoPrecio()) count++;
    if (this.tieneOrdenamiento()) count++;
    return count;
  });

  // 🎯 EFFECTS - Cargar datos cuando cambia la config
  private platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      const cfg = this.config();
      if (cfg && isPlatformBrowser(this.platformId)) {
        this.cargarDatosFiltros();
      }
    });
  }

  // 📥 Cargar datos de categorías y marcas
  private async cargarDatosFiltros(): Promise<void> {
    const cfg = this.config();
    if (!cfg) return;

    this.cargando.set(true);
    this.error.set(null);

    try {
      // Cargar categorías si está configurado
      if (cfg.obtenerCategorias && cfg.mostrarCategoria) {
        cfg.obtenerCategorias().subscribe({
          next: (categorias: OpcionFiltro[]) => {
            this.categorias.set(categorias);
          },
          error: (err: any) => {
            console.error('Error cargando categorías:', err);
          }
        });
      }

      // Cargar marcas si está configurado
      if (cfg.obtenerMarcas && cfg.mostrarMarca) {
        cfg.obtenerMarcas().subscribe({
          next: (marcas: OpcionFiltro[]) => {
            this.marcas.set(marcas);
          },
          error: (err: any) => {
            console.error('Error cargando marcas:', err);
          }
        });
      }

      this.cargando.set(false);
    } catch (error) {
      console.error('Error general cargando filtros:', error);
      this.error.set('Error al cargar los filtros');
      this.cargando.set(false);
    }
  }

  // 🎯 MÉTODOS DE SELECCIÓN

  // Categorías
  toggleCategoria(categoriaId: string | number): void {
    const seleccionadas = [...this.categoriasSeleccionadas()];
    const index = seleccionadas.indexOf(categoriaId);

    if (index > -1) {
      seleccionadas.splice(index, 1);
    } else {
      seleccionadas.push(categoriaId);
    }

    this.categoriasSeleccionadas.set(seleccionadas);
  }

  esCategoriaSeleccionada(categoriaId: string | number): boolean {
    return this.categoriasSeleccionadas().includes(categoriaId);
  }

  // Marcas
  toggleMarca(marcaId: string | number): void {
    const seleccionadas = [...this.marcasSeleccionadas()];
    const index = seleccionadas.indexOf(marcaId);

    if (index > -1) {
      seleccionadas.splice(index, 1);
    } else {
      seleccionadas.push(marcaId);
    }

    this.marcasSeleccionadas.set(seleccionadas);
  }

  esMarcaSeleccionada(marcaId: string | number): boolean {
    return this.marcasSeleccionadas().includes(marcaId);
  }

  // Tipos de Paquete
  toggleTipoPaquete(tipo: string): void {
    const seleccionados = [...this.tiposPaqueteSeleccionados()];
    const index = seleccionados.indexOf(tipo);

    if (index > -1) {
      seleccionados.splice(index, 1);
    } else {
      seleccionados.push(tipo);
    }

    this.tiposPaqueteSeleccionados.set(seleccionados);
  }

  esTipoPaqueteSeleccionado(tipo: string): boolean {
    return this.tiposPaqueteSeleccionados().includes(tipo);
  }

  // Estados
  toggleEstado(estado: string): void {
    const seleccionados = [...this.estadosSeleccionados()];
    const index = seleccionados.indexOf(estado);

    if (index > -1) {
      seleccionados.splice(index, 1);
    } else {
      seleccionados.push(estado);
    }

    this.estadosSeleccionados.set(seleccionados);
  }

  esEstadoSeleccionado(estado: string): boolean {
    return this.estadosSeleccionados().includes(estado);
  }

  // Ordenamiento
  cambiarOrdenamiento(orden: string): void {
    this.ordenSeleccionado.set(orden);
  }

  // Rango de Precio
  cambiarPrecioMin(precio: number | null): void {
    this.precioMin.set(precio);
  }

  cambiarPrecioMax(precio: number | null): void {
    this.precioMax.set(precio);
  }

  // 📱 MÉTODOS DRAWER MOBILE
  toggleDrawer(): void {
    this.isDrawerOpen.update(v => !v);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  // 🎯 APLICAR Y LIMPIAR FILTROS
  aplicarFiltros(): void {
    const filtros: FiltrosAplicados = {
      categorias: this.categoriasSeleccionadas(),
      marcas: this.marcasSeleccionadas(),
      tiposPaquete: this.tiposPaqueteSeleccionados(),
      ordenamiento: this.ordenSeleccionado(),
      rangoPrecio: {
        min: this.precioMin(),
        max: this.precioMax(),
      },
      estados: this.estadosSeleccionados(),
    };

    console.log('🎯 Filtros aplicados:', filtros);
    this.filtrosAplicados.emit(filtros);
    this.closeDrawer();
  }

  limpiarFiltros(): void {
    this.categoriasSeleccionadas.set([]);
    this.marcasSeleccionadas.set([]);
    this.tiposPaqueteSeleccionados.set([]);
    this.estadosSeleccionados.set([]);
    this.ordenSeleccionado.set('');
    this.precioMin.set(null);
    this.precioMax.set(null);

    this.filtrosLimpiados.emit();
    this.aplicarFiltros();
  }

  // 🎨 HELPERS PARA EL TEMPLATE
  mostrarFiltro(nombreFiltro: keyof ConfigFiltros): boolean {
    const cfg = this.config();
    return cfg?.[nombreFiltro] === true;
  }

  obtenerTitulo(nombreFiltro: string): string {
    const cfg = this.config();
    const key = `titulo${nombreFiltro}` as keyof ConfigFiltros;
    return (cfg?.[key] as string) || nombreFiltro;
  }

  obtenerOpciones(nombreFiltro: string): OpcionFiltro[] {
    const cfg = this.config();
    const key = `opciones${nombreFiltro}` as keyof ConfigFiltros;
    return (cfg?.[key] as OpcionFiltro[]) || [];
  }
}
