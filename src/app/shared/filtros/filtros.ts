import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
  DestroyRef,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  zonas: (string | number)[];
}

export interface ConfigFiltros {
  obtenerCategorias?: () => Observable<OpcionFiltro[]>;
  obtenerMarcas?: () => Observable<OpcionFiltro[]>;
  obtenerZonas?: () => Observable<OpcionFiltro[]>;

  mostrarCategoria?: boolean;
  mostrarMarca?: boolean;
  mostrarTipoPaquete?: boolean;
  mostrarRangoPrecio?: boolean;
  mostrarOrdenamiento?: boolean;
  mostrarEstados?: boolean;
  mostrarZona?: boolean;

  opcionesTipoPaquete?: OpcionFiltro[];
  opcionesOrdenamiento?: OpcionFiltro[];
  opcionesEstados?: OpcionFiltro[];
  opcionesZonas?: OpcionFiltro[];

  tituloCategoria?: string;
  tituloMarca?: string;
  tituloTipoPaquete?: string;
  tituloRangoPrecio?: string;
  tituloOrdenamiento?: string;
  tituloEstados?: string;
  tituloZona?: string;
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
  valoresIniciales = input<Partial<FiltrosAplicados>>();

  // 📤 OUTPUTS
  filtrosAplicados = output<FiltrosAplicados>();
  filtrosLimpiados = output<void>();

  // 🎨 ESTADO INTERNO
  categorias = signal<OpcionFiltro[]>([]);
  marcas = signal<OpcionFiltro[]>([]);
  zonas = signal<OpcionFiltro[]>([]);
  categoriasSeleccionadas = signal<(string | number)[]>([]);
  marcasSeleccionadas = signal<(string | number)[]>([]);
  zonasSeleccionadas = signal<(string | number)[]>([]);
  tiposPaqueteSeleccionados = signal<string[]>([]);
  estadosSeleccionados = signal<string[]>([]);
  ordenSeleccionado = signal<string>('');
  precioMin = signal<number | null>(null);
  precioMax = signal<number | null>(null);

  cargando = signal<boolean>(false);
  error = signal<string | null>(null);
  isDrawerOpen = signal<boolean>(false);

  // 📂 ESTADO DE ACORDEONES (Secciones expandidas)
  expandedSections = signal<Record<string, boolean>>({
    Categoria: true,
    Marca: true,
    Zona: true,
    TipoPaquete: true,
    RangoPrecio: true,
    Ordenamiento: true,
    Estados: true
  });

  // 🔍 BUSCADORES INTERNOS
  searchCategoria = signal<string>('');
  searchMarca = signal<string>('');
  searchZona = signal<string>('');

  // 📊 COMPUTED DE FILTRADO PARA LOS BUSCADORES
  filteredCategorias = computed(() => {
    const query = this.searchCategoria().toLowerCase().trim();
    if (!query) return this.categorias();
    return this.categorias().filter(c => c.nombre.toLowerCase().includes(query));
  });

  filteredMarcas = computed(() => {
    const query = this.searchMarca().toLowerCase().trim();
    if (!query) return this.marcas();
    return this.marcas().filter(m => m.nombre.toLowerCase().includes(query));
  });

  filteredZonas = computed(() => {
    const query = this.searchZona().toLowerCase().trim();
    if (!query) return this.zonas();
    return this.zonas().filter(z => z.nombre.toLowerCase().includes(query));
  });

  // 📊 COMPUTED ESTADOS
  tieneCategoriasSeleccionadas = computed(() => this.categoriasSeleccionadas().length > 0);
  tieneMarcasSeleccionadas = computed(() => this.marcasSeleccionadas().length > 0);
  tieneZonasSeleccionadas = computed(() => this.zonasSeleccionadas().length > 0);
  tieneTiposPaqueteSeleccionados = computed(() => this.tiposPaqueteSeleccionados().length > 0);
  tieneEstadosSeleccionados = computed(() => this.estadosSeleccionados().length > 0);
  tieneRangoPrecio = computed(() => this.precioMin() !== null || this.precioMax() !== null);
  tieneOrdenamiento = computed(() => !!this.ordenSeleccionado());

  tieneFiltrosActivos = computed(() =>
    this.tieneCategoriasSeleccionadas() ||
    this.tieneMarcasSeleccionadas() ||
    this.tieneZonasSeleccionadas() ||
    this.tieneTiposPaqueteSeleccionados() ||
    this.tieneEstadosSeleccionados() ||
    this.tieneRangoPrecio() ||
    this.tieneOrdenamiento()
  );

  contadorFiltrosActivos = computed(() => {
    let count = 0;
    if (this.tieneCategoriasSeleccionadas()) count++;
    if (this.tieneMarcasSeleccionadas()) count++;
    if (this.tieneZonasSeleccionadas()) count++;
    if (this.tieneTiposPaqueteSeleccionados()) count++;
    if (this.tieneEstadosSeleccionados()) count++;
    if (this.tieneRangoPrecio()) count++;
    if (this.tieneOrdenamiento()) count++;
    return count;
  });

  // 🚀 NUEVO: estado combinado de filtros, fuente única para la emisión reactiva
  private filtrosActuales = computed<FiltrosAplicados>(() => ({
    categorias: this.categoriasSeleccionadas(),
    marcas: this.marcasSeleccionadas(),
    tiposPaquete: this.tiposPaqueteSeleccionados(),
    ordenamiento: this.ordenSeleccionado(),
    rangoPrecio: {
      min: this.precioMin(),
      max: this.precioMax(),
    },
    estados: this.estadosSeleccionados(),
    zonas: this.zonasSeleccionadas(),
  }));

  // 🎯 EFFECTS - Cargar datos cuando cambia la config
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  constructor() {
    // 📱 En mobile, colapsar la mayoría por defecto
    if (isPlatformBrowser(this.platformId) && window.innerWidth < 1024) {
      this.expandedSections.set({
        Categoria: false,
        Marca: false,
        Zona: false,
        TipoPaquete: false,
        RangoPrecio: false,
        Ordenamiento: false,
        Estados: false
      });
    }

    effect(() => {
      const cfg = this.config();
      if (cfg && isPlatformBrowser(this.platformId)) {
        this.cargarDatosFiltros();
      }
    });

    effect(() => {
      const init = this.valoresIniciales();
      if (init) {
        if (init.categorias) this.categoriasSeleccionadas.set(init.categorias);
        if (init.marcas) this.marcasSeleccionadas.set(init.marcas);
        if (init.zonas) this.zonasSeleccionadas.set(init.zonas);
        if (init.tiposPaquete) this.tiposPaqueteSeleccionados.set(init.tiposPaquete);
        if (init.estados) this.estadosSeleccionados.set(init.estados);
        if (init.ordenamiento) this.ordenSeleccionado.set(init.ordenamiento);
        if (init.rangoPrecio) {
          this.precioMin.set(init.rangoPrecio.min);
          this.precioMax.set(init.rangoPrecio.max);
        }
      }
    });

    // 🚀 NUEVO: emisión reactiva de filtros, sin botón "Aplicar"
    // skip(1) evita emitir el estado vacío inicial (antes de valoresIniciales)
    // debounceTime(300) evita emitir en cada tecla/click, junta cambios seguidos
    toObservable(this.filtrosActuales)
      .pipe(
        skip(1),
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(filtros => {
        this.filtrosAplicados.emit(filtros);
      });
  }

  // 📥 Cargar datos de categorías, marcas y zonas
  private async cargarDatosFiltros(): Promise<void> {
    const cfg = this.config();
    if (!cfg) return;

    this.cargando.set(true);
    this.error.set(null);

    try {
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

      if (cfg.obtenerZonas && cfg.mostrarZona) {
        cfg.obtenerZonas().subscribe({
          next: (zonas: OpcionFiltro[]) => {
            this.zonas.set(zonas);
          },
          error: (err: any) => {
            console.error('Error cargando zonas:', err);
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

  toggleCategoria(categoriaId: string | number): void {
    const seleccionadas = [...this.categoriasSeleccionadas()];
    const index = seleccionadas.indexOf(categoriaId);
    if (index > -1) seleccionadas.splice(index, 1);
    else seleccionadas.push(categoriaId);
    this.categoriasSeleccionadas.set(seleccionadas);
  }

  esCategoriaSeleccionada(categoriaId: string | number): boolean {
    return this.categoriasSeleccionadas().includes(categoriaId);
  }

  toggleMarca(marcaId: string | number): void {
    const seleccionadas = [...this.marcasSeleccionadas()];
    const index = seleccionadas.indexOf(marcaId);
    if (index > -1) seleccionadas.splice(index, 1);
    else seleccionadas.push(marcaId);
    this.marcasSeleccionadas.set(seleccionadas);
  }

  esMarcaSeleccionada(marcaId: string | number): boolean {
    return this.marcasSeleccionadas().includes(marcaId);
  }

  toggleZona(zonaId: string | number): void {
    const seleccionadas = [...this.zonasSeleccionadas()];
    const index = seleccionadas.indexOf(zonaId);
    if (index > -1) seleccionadas.splice(index, 1);
    else seleccionadas.push(zonaId);
    this.zonasSeleccionadas.set(seleccionadas);
  }

  esZonaSeleccionada(zonaId: string | number): boolean {
    return this.zonasSeleccionadas().includes(zonaId);
  }

  toggleTipoPaquete(tipo: string): void {
    const seleccionados = [...this.tiposPaqueteSeleccionados()];
    const index = seleccionados.indexOf(tipo);
    if (index > -1) seleccionados.splice(index, 1);
    else seleccionados.push(tipo);
    this.tiposPaqueteSeleccionados.set(seleccionados);
  }

  esTipoPaqueteSeleccionado(tipo: string): boolean {
    return this.tiposPaqueteSeleccionados().includes(tipo);
  }

  toggleEstado(estado: string): void {
    const seleccionados = [...this.estadosSeleccionados()];
    const index = seleccionados.indexOf(estado);
    if (index > -1) seleccionados.splice(index, 1);
    else seleccionados.push(estado);
    this.estadosSeleccionados.set(seleccionados);
  }

  esEstadoSeleccionado(estado: string): boolean {
    return this.estadosSeleccionados().includes(estado);
  }

  cambiarOrdenamiento(orden: string): void {
    this.ordenSeleccionado.set(orden);
  }

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

  // 📂 MANEJO DE ACORDEONES
  toggleSection(section: string): void {
    this.expandedSections.update(sections => ({
      ...sections,
      [section]: !sections[section]
    }));
  }

  isSectionExpanded(section: string): boolean {
    return this.expandedSections()[section] ?? false;
  }

  // 🧹 LIMPIAR FILTROS
  // Ya no llama a aplicarFiltros(): el reset de signals dispara la
  // emisión reactiva sola a través del observable de filtrosActuales.
  limpiarFiltros(): void {
    this.categoriasSeleccionadas.set([]);
    this.marcasSeleccionadas.set([]);
    this.zonasSeleccionadas.set([]);
    this.tiposPaqueteSeleccionados.set([]);
    this.estadosSeleccionados.set([]);
    this.ordenSeleccionado.set('');
    this.precioMin.set(null);
    this.precioMax.set(null);
    this.searchZona.set('');

    // Re-aplicar valores iniciales (perfil del usuario: zona, etc.)
    const init = this.valoresIniciales();
    if (init) {
      if (init.zonas) this.zonasSeleccionadas.set(init.zonas);
      if (init.categorias) this.categoriasSeleccionadas.set(init.categorias);
      if (init.marcas) this.marcasSeleccionadas.set(init.marcas);
      if (init.tiposPaquete) this.tiposPaqueteSeleccionados.set(init.tiposPaquete);
      if (init.estados) this.estadosSeleccionados.set(init.estados);
      if (init.ordenamiento) this.ordenSeleccionado.set(init.ordenamiento);
      if (init.rangoPrecio) {
        this.precioMin.set(init.rangoPrecio.min);
        this.precioMax.set(init.rangoPrecio.max);
      }
    }

    this.filtrosLimpiados.emit();
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