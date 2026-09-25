import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  DestroyRef,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge, Subject, filter, map, catchError, of, switchMap } from 'rxjs';
import { decodeId, getProductSlugUrl, getPaqueteSlugUrl } from '@app/shared/utils/obfuscator';

// Services
import { ProductosService } from '@app/services/producto/producto.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';

// Interfaces
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

// Components
import { PaqueteCard } from '@app/shared/paquete-card/paquete-card';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';
import { PaginationComponent } from '@app/shared/paginacion/paginacion';
import { VisorImagenesComponent } from '@app/shared/visor-imagenes/visor-imagenes-component';
import { TipoBadgeComponent } from '@app/tipo-badge/tipo-badge';
import { LoaderComponent } from '@app/shared/loader/loader';
import { BackButtonComponent } from '@app/shared/back-button/back-button';

@Component({
  selector: 'app-producto-detalle-seleccion',
  standalone: true,
  imports: [
    CommonModule,
    PaqueteCard,
    ButtonComponent,
    IconComponent,
    PaginationComponent,
    VisorImagenesComponent,
    TipoBadgeComponent,
    LoaderComponent,
    BackButtonComponent,
  ],
  templateUrl: './producto-detalle-seleccion-component.html',
})
export class ProductoDetalleSeleccionComponent implements OnInit {
  // 📄 MÉTODOS DE PAGINACIÓN
  onPageChange(page: number): void {
    this.paginaActual.set(page);
    console.log(`📄 Cambiando a página ${page}`);
  }

  onItemsPerPageChange(itemsPerPage: number): void {
    this.itemsPorPagina.set(itemsPerPage);
    this.paginaActual.set(1); // Resetear a página 1
    console.log(`🔢 Mostrando ${itemsPerPage} items por página`);
  }

  // 🔧 Services
  private readonly productosService = inject(ProductosService);
  private readonly paquetePublicadoService = inject(PaquetePublicadoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  productoIdActual = signal<number | null>(null);

  private readonly productoIdCambio$ = new Subject<number>();
  private readonly recargarProducto$ = new Subject<void>();
  private readonly recargarPaquetes$ = new Subject<void>();


  // 🌐 Platform check
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // 🚀 Signals
  productoSeleccionado = signal<Producto | null>(null);
  todosLosPaquetes = signal<PaquetePublicado[]>([]);
  isLoadingProducto = signal(true);
  isLoadingPaquetes = signal(true);
  errorMessage = signal('');
  errorPaquetes = signal(false);

  // 📄 SIGNALS DE PAGINACIÓN
  paginaActual = signal<number>(1);
  itemsPorPagina = signal<number>(12);

  // 🎯 Filtro de Tipo de Paquete
  filtroTipoPaquete = signal<'TODOS' | 'SINERGICO' | 'ENERGICO'>('TODOS');

  // 📊 Computed Signals
  paquetesDelProducto = computed(() => {
    const todos = this.todosLosPaquetes();
    const filtro = this.filtroTipoPaquete();

    if (filtro === 'TODOS') {
      return todos;
    }

    return todos.filter(p => p.tipo === filtro);
  });

  // 📊 COMPUTED: Paquetes paginados
  paquetesPaginados = computed(() => {
    const page = this.paginaActual();
    const perPage = this.itemsPorPagina();
    const filtrados = this.paquetesDelProducto();

    const start = (page - 1) * perPage;
    const end = start + perPage;

    return filtrados.slice(start, end);
  });

  // 📊 COMPUTED: Total de items para la paginación
  totalItemsPaginacion = computed(() => {
    return this.paquetesDelProducto().length;
  });

  // Loading general
  isLoading = computed(
    () => this.isLoadingProducto() || this.isLoadingPaquetes()
  );

  // Hay paquetes disponibles en total (para la caja de info superior)
  hayPaquetesDisponibles = computed(
    () => this.todosLosPaquetes().length > 0
  );

  // Hay paquetes disponibles con el filtro actual
  hayPaquetesFiltrados = computed(
    () => this.paquetesDelProducto().length > 0
  );

  // 🏷️ COMPUTED: Nombre de la categoría (maneja string u objeto)
  categoriaNombre = computed(() => {
    const producto = this.productoSeleccionado();
    if (!producto?.categoria) return '';
    return typeof producto.categoria === 'string'
      ? producto.categoria
      : producto.categoria?.nombre ?? '';
  });

  // 🏷️ COMPUTED: Nombre de la marca (maneja string u objeto)
  marcaNombre = computed(() => {
    const producto = this.productoSeleccionado();
    if (!producto?.marca) return '';
    return typeof producto.marca === 'string'
      ? producto.marca
      : producto.marca?.nombre ?? '';
  });

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.onCambioDeRuta(params));

    // Producto y paquetes van en cadenas cancelables separadas: un cambio de
    // ruta (o un "Reintentar") descarta cualquier request anterior en vuelo.
    merge(
      this.productoIdCambio$,
      this.recargarProducto$.pipe(map(() => this.productoIdActual())),
    ).pipe(
      filter((id): id is number => id !== null),
      switchMap((id) => {
        this.isLoadingProducto.set(true);
        return this.productosService.getProductoById(id).pipe(
          map((producto) => ({ ok: true as const, producto })),
          catchError((error) => of({ ok: false as const, error })),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((resultado) => {
      this.isLoadingProducto.set(false);
      if (resultado.ok) {
        this.productoSeleccionado.set(resultado.producto);
        return;
      }
      let mensaje = 'Error al cargar el producto.';
      if (resultado.error?.status === 404) mensaje = 'Producto no encontrado.';
      else if (resultado.error?.status === 0) mensaje = 'No se pudo conectar con el servidor.';
      this.errorMessage.set(mensaje);
    });

    merge(
      this.productoIdCambio$,
      this.recargarPaquetes$.pipe(map(() => this.productoIdActual())),
    ).pipe(
      filter((id): id is number => id !== null),
      switchMap((id) => {
        this.isLoadingPaquetes.set(true);
        return this.paquetePublicadoService.getByProductId(id).pipe(
          map((paquetes) => ({ ok: true as const, paquetes })),
          catchError(() => of({ ok: false as const })),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((resultado) => {
      this.isLoadingPaquetes.set(false);
      if (resultado.ok) {
        this.todosLosPaquetes.set(resultado.paquetes);
        this.errorPaquetes.set(false);
      } else {
        this.todosLosPaquetes.set([]);
        this.errorPaquetes.set(true);
      }
    });
  }

  private onCambioDeRuta(params: ParamMap): void {
    const rawId = params.get('id');
    let productoId: number | null = null;

    if (rawId) {
      // Detectar patrón de slug con ID ofuscado al final (ej: "termo-stanley-p2y8")
      const match = rawId.match(/-p([a-z0-9]+)$/);
      productoId = match ? decodeId(match[1]) : Number(rawId);
    }

    if (!productoId || isNaN(productoId)) {
      this.errorMessage.set('ID de producto inválido');
      this.isLoadingProducto.set(false);
      this.isLoadingPaquetes.set(false);
      return;
    }

    this.errorMessage.set('');
    this.errorPaquetes.set(false);
    this.filtroTipoPaquete.set('TODOS');
    this.paginaActual.set(1);
    this.productoSeleccionado.set(null);
    this.todosLosPaquetes.set([]);
    this.productoIdActual.set(productoId);
    this.productoIdCambio$.next(productoId);
  }

  // 🔄 Recargar datos
  recargarDatos(): void {
    if (!this.productoIdActual()) return;
    this.errorMessage.set('');
    this.recargarProducto$.next();
    this.recargarPaquetes$.next();
  }

  // 🔄 Reintentar sólo la carga de paquetes
  recargarPaquetes(): void {
    if (!this.productoIdActual()) return;
    this.recargarPaquetes$.next();
  }

  // 🎯 Cambiar Filtro
  toggleFiltro(tipo: 'SINERGICO' | 'ENERGICO'): void {
    if (this.filtroTipoPaquete() === tipo) {
      this.filtroTipoPaquete.set('TODOS');
    } else {
      this.filtroTipoPaquete.set(tipo);
    }
    this.paginaActual.set(1); // Volver a la página 1 al filtrar
  }

  // 🧭 NAVEGACIÓN

  /**
   * Navegar a la vista de "sumarse" al paquete seleccionado
   */
  navegarASumarse(paqueteId: number): void {
    if (!paqueteId) {
      console.error('❌ ID de paquete inválido');
      return;
    }

    const producto = this.productoSeleccionado();
    if (!producto) {
      console.error('❌ No hay producto seleccionado');
      return;
    }

    const paquete = this.todosLosPaquetes().find(p => p.id_paquete_publicado === paqueteId);

    const slugProducto = getProductSlugUrl(producto);
    const slugPaquete = paquete ? getPaqueteSlugUrl(paquete) : String(paqueteId);

    console.log('🧭 Navegando a sumarse:', {
      productoId: producto.id_producto,
      paqueteId,
      url: `/paquete/${slugPaquete}/producto/${slugProducto}`
    });

    this.router.navigate(['/paquete', slugPaquete, 'producto', slugProducto], {
      queryParams: { from: 'producto' }
    });
  }

  /**
   * Volver a la vista de productos
   */
  volverAProductos(): void {
    this.router.navigate(['/productos']);
  }

  /**
   * Scrollear suavemente hasta la sección de paquetes
   */
  scrollToPackages(): void {
    const element = document.getElementById('paquetes-disponibles');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // 🎨 HELPERS VISUALES

  /**
   * Formatear precio en pesos argentinos
   */
  formatPrice(price?: number): string {
    if (!price && price !== 0) return '$0';

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  /**
   * Obtener URL de imagen con fallback
   */
  getImageUrl(producto: Producto): string {
    return producto.imagen_url || '/assets/images/placeholder-product.png';
  }

  /**
   * Manejo de error de imagen
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target.src.includes('placeholder')) return;
    target.src = '/assets/images/placeholder-product.png';
  }
}
