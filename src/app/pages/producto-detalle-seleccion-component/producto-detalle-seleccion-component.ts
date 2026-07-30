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
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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


  // 🌐 Platform check
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // 🚀 Signals
  productoSeleccionado = signal<Producto | null>(null);
  todosLosPaquetes = signal<PaquetePublicado[]>([]);
  isLoadingProducto = signal(true);
  isLoadingPaquetes = signal(true);
  errorMessage = signal('');

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
      .subscribe((params) => {
        const productoId = Number(params.get('id'));

        console.log('🔄 Cambio de ruta detectado, producto ID:', productoId);

        if (!productoId || isNaN(productoId)) {
          this.errorMessage.set('ID de producto inválido');
          this.isLoadingProducto.set(false);
          this.isLoadingPaquetes.set(false);
          return;
        }
        this.productoIdActual.set(productoId);
        this.cargarDatos(productoId);
      });
  }

  // 📥 CARGA DE DATOS
  private cargarDatos(productoId: number): void {
    this.productoSeleccionado.set(null);
    this.todosLosPaquetes.set([]);
    console.log('🚀 Cargando datos para producto ID:', productoId);

    this.errorMessage.set('');
    this.productoSeleccionado.set(null);

    this.cargarProducto(productoId);
    this.cargarPaquetesDelProducto(productoId);
  }

  // 📦 Cargar producto por ID
  private cargarProducto(id: number): void {
    this.isLoadingProducto.set(true);

    this.productosService
      .getProductoById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (producto) => {
          console.log('✅ Producto cargado:', producto);
          this.productoSeleccionado.set(producto);
          this.isLoadingProducto.set(false);
        },
        error: (error) => {
          console.error('❌ Error cargando producto:', error);
          this.isLoadingProducto.set(false);

          let mensaje = 'Error al cargar el producto.';

          if (error.status === 404) {
            mensaje = 'Producto no encontrado.';
          } else if (error.status === 0) {
            mensaje = 'No se pudo conectar con el servidor.';
          }

          this.errorMessage.set(mensaje);
        },
      });
  }

  // 🎁 Cargar todos los paquetes
  private cargarPaquetesDelProducto(productoId: number): void {
    this.isLoadingPaquetes.set(true);

    this.paquetePublicadoService
      .getByProductId(productoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paquetes) => {
          console.log('✅ Paquetes del producto:', paquetes.length);
          this.todosLosPaquetes.set(paquetes);
          this.isLoadingPaquetes.set(false);
        },
        error: (error) => {
          console.error('❌ Error cargando paquetes del producto:', error);
          this.isLoadingPaquetes.set(false);
          this.todosLosPaquetes.set([]);
        },
      });
  }

  // 🔄 Recargar datos
  recargarDatos(): void {
    const productoId = this.productoIdActual();

    if (!productoId) {
      console.error('❌ No hay productoId para recargar');
      return;
    }

    console.log('🔄 Recargando datos para producto ID:', productoId);
    this.errorMessage.set('');
    this.cargarDatos(productoId);
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

    const productoId = this.productoSeleccionado()?.id_producto;
    if (!productoId) {
      console.error('❌ No hay producto seleccionado');
      return;
    }

    console.log('🧭 Navegando a sumarse:', {
      productoId,
      paqueteId,
      url: `/paquete/${paqueteId}/producto/${productoId}`
    });

    this.router.navigate(['/paquete', paqueteId, 'producto', productoId]);
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
