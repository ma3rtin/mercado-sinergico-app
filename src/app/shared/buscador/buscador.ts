import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  signal,
  computed,
  input,
  output,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { getProductSlugUrl, getPaqueteSlugUrl } from '@app/shared/utils/obfuscator';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  finalize,
  take,
} from 'rxjs/operators';
import { of } from 'rxjs';

// Services
import { ProductosService } from '@app/services/producto/producto.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';

// Models
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { IconComponent } from '@app/shared/icono/icono';

// Tipos
type TipoBusqueda = 'todo' | 'productos' | 'paquetes';

interface ResultadoBusqueda {
  productos: Producto[];
  paquetes: PaquetePublicado[];
  cargando: boolean;
  error: string | null;
}

/**
 * 🔍 Componente de búsqueda para el header
 *
 * Características:
 * - Búsqueda en tiempo real con debounce
 * - Filtros por tipo (productos/paquetes)
 * - Versiones desktop y móvil
 * - Navegación directa a resultados
 *
 * @example
 * // Desktop
 * <app-buscador-header variant="desktop" />
 *
 * // Móvil
 * <app-buscador-header variant="mobile" />
 */
@Component({
  selector: 'app-buscador-header',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './buscador.html',
})
export class BuscadorComponent {
  // 🔧 Servicios
  private productosService = inject(ProductosService);
  private paquetesService = inject(PaquetePublicadoService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // 📌 ViewChild
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('searchContainer') searchContainer?: ElementRef<HTMLDivElement>;

  // 🎯 Inputs
  variant = input<'desktop' | 'mobile'>('desktop');

  // 📤 Outputs
  resultadoSeleccionado = output<void>();

  // 🔍 Estado de búsqueda
  searchOpen = signal(false);
  searchTerm = signal('');
  tipoBusqueda = signal<TipoBusqueda>('todo');

  limiteMostrado = signal<number>(6);

  resultados = signal<ResultadoBusqueda>({
    productos: [],
    paquetes: [],
    cargando: false,
    error: null,
  });

  // 📊 Computed
  hayResultados = computed(() => {
    const res = this.resultados();
    return res.productos.length > 0 || res.paquetes.length > 0;
  });

  totalResultados = computed(() => {
    const res = this.resultados();
    return res.productos.length + res.paquetes.length;
  });

  productosSlices = computed(() => {
    const res = this.resultados();
    return res.productos.slice(0, this.limiteMostrado());
  });

  paquetesSlices = computed(() => {
    const res = this.resultados();
    return res.paquetes.slice(0, this.limiteMostrado());
  });

  totalMostrados = computed(() => {
    return this.productosSlices().length + this.paquetesSlices().length;
  });

  mostrarProductos = computed(() => {
    const tipo = this.tipoBusqueda();
    return tipo === 'todo' || tipo === 'productos';
  });

  mostrarPaquetes = computed(() => {
    const tipo = this.tipoBusqueda();
    return tipo === 'todo' || tipo === 'paquetes';
  });

  esMobile = computed(() => this.variant() === 'mobile');

  // 🔍 Subject para búsqueda reactiva
  private searchSubject = new Subject<string>();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupSearch();
    }
  }

  // 🔧 Configuración de búsqueda con debounce
  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          if (!term.trim()) {
            this.limiteMostrado.set(6);
            this.resultados.set({
              productos: [],
              paquetes: [],
              cargando: false,
              error: null,
            });
            return of(null);
          }

          this.resultados.update(prev => ({
            ...prev,
            cargando: true,
            error: null,
          }));

          return combineLatest({
            productos: this.productosService.getProductos().pipe(
              take(1), // 🔑 CLAVE
              catchError(err => {
                console.error('❌ Error productos', err);
                return of([]);
              })
            ),
            paquetes: this.paquetesService.getPaquetes().pipe(
              take(1), // 🔑 CLAVE
              catchError(err => {
                console.error('❌ Error paquetes', err);
                return of([]);
              })
            ),
          }).pipe(
            finalize(() => {
              // 🔑 SIEMPRE se apaga el loading
              this.resultados.update(prev => ({
                ...prev,
                cargando: false,
              }));
            })
          );
        })
      )
      .subscribe(data => {
        if (!data) return;

        const term = this.searchTerm().toLowerCase();

        const productosFiltrados = data.productos.filter(p => {
          const marcaNombre =
            typeof p.marca === 'string'
              ? p.marca
              : p.marca?.nombre ?? '';

          const categoriaNombre =
            typeof p.categoria === 'string'
              ? p.categoria
              : p.categoria?.nombre ?? '';

          return (
            p.nombre?.toLowerCase().includes(term) ||
            p.descripcion?.toLowerCase().includes(term) ||
            marcaNombre.toLowerCase().includes(term) ||
            categoriaNombre.toLowerCase().includes(term)
          );
        });


        const paquetesFiltrados = data.paquetes.filter(paq =>
          paq.paqueteBase?.nombre?.toLowerCase().includes(term) ||
          paq.paqueteBase?.descripcion?.toLowerCase().includes(term) ||
          paq.paqueteBase?.marca?.nombre?.toLowerCase().includes(term) ||
          paq.paqueteBase?.categoria?.nombre?.toLowerCase().includes(term)
        );

        this.limiteMostrado.set(6);
        this.resultados.set({
          productos: productosFiltrados,
          paquetes: paquetesFiltrados,
          cargando: false,
          error: null,
        });
      });
  }


  // 🔍 Métodos de búsqueda
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.searchSubject.next(term);

    if (!this.searchOpen()) {
      this.searchOpen.set(true);
    }
  }

  onSearchFocus(): void {
    this.searchOpen.set(true);
  }

  onInputClick(event: Event): void {
    event.stopPropagation();
    this.searchOpen.set(true);
  }

  openSearch(): void {
    this.searchOpen.set(true);
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 100);
  }

  closeSearch(): void {
    this.searchOpen.set(false);
  }

  limpiarBusqueda(): void {
    this.searchTerm.set('');
    this.limiteMostrado.set(6);
    this.resultados.set({
      productos: [],
      paquetes: [],
      cargando: false,
      error: null,
    });
  }

  // 🎯 Cambiar filtro
  cambiarTipoBusqueda(tipo: TipoBusqueda, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.tipoBusqueda.set(tipo);
  }

  // 📍 Navegación
  verProducto(producto: Producto): void {
    if (producto.id_producto) {
      this.closeSearch();
      this.limpiarBusqueda();
      this.resultadoSeleccionado.emit();
      const slugUrl = getProductSlugUrl(producto);
      this.router.navigate(['/producto', slugUrl]);
    }
  }

  verPaquete(paquete: PaquetePublicado): void {
    if (paquete.id_paquete_publicado) {
      this.closeSearch();
      this.limpiarBusqueda();
      this.resultadoSeleccionado.emit();
      const slugUrl = getPaqueteSlugUrl(paquete);
      this.router.navigate(['/paquete', slugUrl, 'productos']);
    }
  }

  onScroll(event: Event): void {
    const container = event.target as HTMLElement;
    // Si el usuario llega a menos de 50px del final del scroll vertical del contenedor
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 50) {
      this.cargarMasResultados();
    }
  }

  cargarMasResultados(): void {
    const totalActualMostrado = this.totalMostrados();
    const totalCoincidencias = this.totalResultados();
    if (totalActualMostrado < totalCoincidencias) {
      this.limiteMostrado.update(lim => lim + 6);
    }
  }

  // 🎨 Helpers
  obtenerNombreMarca(producto: Producto): string {
    const rawMarca = producto.marca;
    if (!rawMarca) return 'Sin marca';
    return typeof rawMarca === 'string' ? rawMarca : rawMarca.nombre;
  }

  obtenerImagenProducto(producto: Producto): string {
    return producto.imagen_url || '/assets/images/placeholder-product.png';
  }

  obtenerImagenPaquete(paquete: PaquetePublicado): string {
    return (
      paquete.imagen_url ||
      paquete.paqueteBase?.imagen_url ||
      '/assets/images/placeholder-product.png'
    );
  }

  formatearPrecio(precio?: number | null): string {
    if (!precio) return 'Consultar';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(precio);
  }

  truncarTexto(texto: string, maxLength: number): string {
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
  }

  // 🎧 Host Listeners
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const searchContainer = this.searchContainer?.nativeElement;

    if (
      this.searchOpen() &&
      searchContainer &&
      !searchContainer.contains(target)
    ) {
      this.searchOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.searchOpen()) {
      this.closeSearch();
    }
  }
}
