import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  DestroyRef,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { getProductSlugUrl, slugify } from '@app/shared/utils/obfuscator';
import { map, switchMap, of, forkJoin, catchError } from 'rxjs';

// Services
import { ProductosService } from '@app/services/producto/producto.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { ZonaService } from '@app/services/zona/zona.service';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';

// Interfaces
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import {
  ConfigFiltros,
  FiltrosAplicados,
  OpcionFiltro,
} from '@app/shared/filtros/filtros';
import { Zona } from '@app/models/ZonasInterfaces/Zona';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

// Components
import { FiltrosComponent } from '@app/shared/filtros/filtros';
import { ProductoCard } from '@app/shared/producto-card/producto-card';
import { PaginationComponent } from '@app/shared/paginacion/paginacion';
import { CatalogoWrapperComponent } from '@app/shared/catalogo-wrapper/catalogo-wrapper';
import { DelayedSkeleton } from '@app/shared/skeleton/delayed-skeleton';
import { ErrorState } from '@app/shared/error-state/error-state';
import { IconComponent } from '@app/shared/icono/icono';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    FiltrosComponent,
    ProductoCard,
    PaginationComponent,
    CatalogoWrapperComponent,
    DelayedSkeleton,
    ErrorState,
    IconComponent,
  ],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css'],
})
export class ProductosComponent implements OnInit {
  // 🔧 Services
  private readonly productosService = inject(ProductosService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly marcaService = inject(MarcaService);
  private readonly zonaService = inject(ZonaService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly paquetePublicadoService = inject(PaquetePublicadoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  // 🚀 Signals
  productosOriginales = signal<Producto[]>([]);
  productoSeleccionado = signal<Producto | null>(null);
  todasLasCategorias = signal<any[]>([]);
  todasLasMarcas = signal<any[]>([]);
  totalProductos = signal<number>(0);

  // Estados de carga individuales
  isLoadingProductos = signal(true);
  isLoadingZonas = signal(true);
  isLoadingPaquetes = signal(true);

  // isLoading computado reactivo
  isLoading = computed(
    () =>
      this.isLoadingProductos() ||
      this.isLoadingZonas() ||
      this.isLoadingPaquetes(),
  );

  errorMessage = signal('');
  todasLasZonas = signal<Zona[]>([]);
  paquetesActivos = signal<PaquetePublicado[]>([]);
  filtrosActuales = signal<FiltrosAplicados | null>(null);

  // 📄 SIGNALS DE PAGINACIÓN
  paginaActual = signal<number>(1);
  itemsPorPagina = signal<number>(12); // 12 productos por página (óptimo)

  // 📊 COMPUTED: Filtros iniciales basados en perfil del usuario (zona propia preseleccionada)
  valoresFiltrosIniciales = computed<Partial<FiltrosAplicados>>(() => {
    const perfil = this.usuarioService.perfilUsuario();
    const zonas = perfil?.direccion?.localidad?.zonas || [];
    if (zonas.length > 0 && zonas[0].id_zona) {
      return {
        zonas: [zonas[0].id_zona],
      };
    }
    return {};
  });

  // 📊 COMPUTED: Productos filtrados reactivamente (ahora filtrados en backend)
  productosFiltrados = computed(() => {
    return this.productosOriginales();
  });

  // 📊 COMPUTED: Productos paginados (ahora paginados en backend)
  productosPaginados = computed(() => {
    const seleccionado = this.productoSeleccionado();
    if (seleccionado) {
      return [seleccionado];
    }
    return this.productosOriginales();
  });

  // 📊 COMPUTED: Total de items para la paginación (del total del backend)
  totalItemsPaginacion = computed(() => {
    const seleccionado = this.productoSeleccionado();
    if (seleccionado) return 1;
    return this.totalProductos();
  });

  // 🌐 Platform check
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // 🧩 Computed signals
  hasProductos = computed(() => this.productosOriginales().length > 0);

  // 🎯 CONFIGURACIÓN DE FILTROS PARA PRODUCTOS
  configFiltrosProductos = computed<ConfigFiltros>(() => ({
    // 📊 Servicios para obtener datos
    obtenerCategorias: () =>
      this.categoriaService.getCategorias().pipe(
        map((categorias) =>
          categorias.map(
            (cat) =>
              ({
                id: cat.id_categoria,
                nombre: cat.nombre,
                valor: cat.id_categoria,
              }) as OpcionFiltro,
          ),
        ),
      ),

    obtenerMarcas: () =>
      this.marcaService.getMarcas().pipe(
        map((marcas) =>
          marcas.map(
            (marca) =>
              ({
                id: marca.id_marca,
                nombre: marca.nombre,
                valor: marca.id_marca,
              }) as OpcionFiltro,
          ),
        ),
      ),

    obtenerZonas: () =>
      this.zonaService.getZonas().pipe(
        map((zonas) =>
          zonas.map(
            (zona) =>
              ({
                id: zona.id_zona,
                nombre: zona.nombre,
                valor: zona.id_zona,
              }) as OpcionFiltro,
          ),
        ),
      ),

    // 🎨 Filtros a mostrar (solo para productos)
    mostrarCategoria: true,
    mostrarMarca: true,
    mostrarZona: true,
    mostrarTipoPaquete: false, // No aplica para productos
    mostrarRangoPrecio: true, // SÍ para productos
    mostrarOrdenamiento: false, // Ahora está arriba a la derecha
    mostrarEstados: false, // No aplica para productos

    // 📋 Opciones de Ordenamiento para productos
    opcionesOrdenamiento: [
      { id: 1, nombre: 'Más recientes', valor: 'recientes' },
      { id: 2, nombre: 'A-Z', valor: 'a-z' },
      { id: 3, nombre: 'Z-A', valor: 'z-a' },
      { id: 4, nombre: 'Precio: Menor a Mayor', valor: 'precio-asc' },
      { id: 5, nombre: 'Precio: Mayor a Menor', valor: 'precio-desc' },
      { id: 6, nombre: 'Más stock', valor: 'mas-stock' },
    ],

    // 🎯 Textos personalizados
    tituloCategoria: 'Categorías',
    tituloMarca: 'Marcas',
    tituloZona: 'Zonas',
    tituloRangoPrecio: 'Rango de Precio',
    tituloOrdenamiento: 'Ordenar por',
  }));

  ngOnInit(): void {
    if (this.isBrowser) {
      this.isLoadingProductos.set(true);
      this.isLoadingZonas.set(true);
      this.isLoadingPaquetes.set(true);

      // Cargar catálogos iniciales en paralelo
      forkJoin({
        categorias: this.categoriaService.getCategorias().pipe(catchError(() => of([]))),
        marcas: this.marcaService.getMarcas().pipe(catchError(() => of([]))),
        zonas: this.zonaService.getZonas().pipe(catchError(() => of([]))),
        paquetes: this.paquetePublicadoService.getPaquetes().pipe(
          switchMap(paquetes => {
            const activos = paquetes.filter(p => p.estado?.nombre?.toLowerCase() === 'activo');
            return of(activos);
          }),
          catchError(() => of([]))
        )
      }).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (res) => {
          this.todasLasCategorias.set(res.categorias);
          this.todasLasMarcas.set(res.marcas);
          this.todasLasZonas.set(res.zonas);
          this.paquetesActivos.set(res.paquetes);

          this.isLoadingZonas.set(false);
          this.isLoadingPaquetes.set(false);

          // Suscribirse a los queryParams una vez listos los catálogos
          this.route.queryParams.pipe(
            takeUntilDestroyed(this.destroyRef)
          ).subscribe(params => {
            this.procesarQueryParams(params);
          });
        },
        error: (err) => {
          console.error('❌ Error cargando catálogos iniciales:', err);
          this.errorMessage.set('Error al inicializar la tienda.');
          this.isLoadingProductos.set(false);
          this.isLoadingZonas.set(false);
          this.isLoadingPaquetes.set(false);
        }
      });
    }
  }

  private procesarQueryParams(params: any): void {
    let page = parseInt(params['page'], 10);
    let limit = parseInt(params['limit'], 10);

    // Validación del Frontend
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 100) limit = 12;

    this.paginaActual.set(page);
    this.itemsPorPagina.set(limit);

    // Decodificar filtros amigables desde la URL a IDs
    const filtros: FiltrosAplicados = {
      categorias: [],
      marcas: [],
      zonas: [],
      tiposPaquete: [],
      ordenamiento: params['orden'] || 'recientes',
      rangoPrecio: {
        min: params['precioMin'] ? parseFloat(params['precioMin']) : null,
        max: params['precioMax'] ? parseFloat(params['precioMax']) : null
      },
      estados: []
    };

    if (params['categorias']) {
      const slugs = params['categorias'].split(',');
      slugs.forEach((slug: string) => {
        const cat = this.todasLasCategorias().find(c => slugify(c.nombre) === slug);
        if (cat) filtros.categorias.push(cat.id_categoria);
      });
    }

    if (params['marcas']) {
      const slugs = params['marcas'].split(',');
      slugs.forEach((slug: string) => {
        const m = this.todasLasMarcas().find(marca => slugify(marca.nombre) === slug);
        if (m) filtros.marcas.push(m.id_marca);
      });
    }

    if (params['zonas']) {
      const slugs = params['zonas'].split(',');
      slugs.forEach((slug: string) => {
        const z = this.todasLasZonas().find(zona => slugify(zona.nombre) === slug);
        if (z) filtros.zonas.push(z.id_zona);
      });
    }

    this.filtrosActuales.set(filtros);

    if (params['orden']) {
      this.ordenSeleccionado.set(params['orden']);
    }

    this.loadProductosPaginados();
  }

  private loadProductosPaginados(): void {
    this.isLoadingProductos.set(true);
    this.errorMessage.set('');

    this.productosService.getProductosPaginados(
      this.paginaActual(),
      this.itemsPorPagina(),
      this.filtrosActuales(),
      false
    ).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.productosOriginales.set(res.productos);
        this.totalProductos.set(res.total);
        this.isLoadingProductos.set(false);
      },
      error: (err) => {
        console.error('❌ Error cargando productos paginados:', err);
        this.isLoadingProductos.set(false);
        this.errorMessage.set('Error al cargar productos.');
        this.productosOriginales.set([]);
        this.totalProductos.set(0);
      }
    });
  }

  private actualizarUrl(page: number): void {
    const queryParams: any = {
      page: page.toString(),
      limit: this.itemsPorPagina().toString(),
      categorias: null,
      marcas: null,
      zonas: null,
      precioMin: null,
      precioMax: null,
      orden: null
    };

    const filtros = this.filtrosActuales();
    if (filtros) {
      if (filtros.categorias && filtros.categorias.length > 0) {
        const slugs = filtros.categorias
          .map(id => this.todasLasCategorias().find(c => c.id_categoria === id))
          .map(c => c ? slugify(c.nombre) : '')
          .filter(s => s !== '');
        if (slugs.length > 0) queryParams.categorias = slugs.join(',');
      }

      if (filtros.marcas && filtros.marcas.length > 0) {
        const slugs = filtros.marcas
          .map(id => this.todasLasMarcas().find(m => m.id_marca === id))
          .map(m => m ? slugify(m.nombre) : '')
          .filter(s => s !== '');
        if (slugs.length > 0) queryParams.marcas = slugs.join(',');
      }

      if (filtros.zonas && filtros.zonas.length > 0) {
        const slugs = filtros.zonas
          .map(id => this.todasLasZonas().find(z => z.id_zona === id))
          .map(z => z ? slugify(z.nombre) : '')
          .filter(s => s !== '');
        if (slugs.length > 0) queryParams.zonas = slugs.join(',');
      }

      if (filtros.rangoPrecio) {
        if (filtros.rangoPrecio.min !== null && filtros.rangoPrecio.min !== undefined) {
          queryParams.precioMin = filtros.rangoPrecio.min.toString();
        }
        if (filtros.rangoPrecio.max !== null && filtros.rangoPrecio.max !== undefined) {
          queryParams.precioMax = filtros.rangoPrecio.max.toString();
        }
      }
    }

    if (this.ordenSeleccionado()) {
      queryParams.orden = this.ordenSeleccionado();
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  private loadZonas(): void {
    this.isLoadingZonas.set(true);
    this.zonaService
      .getZonas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (zonas) => {
          this.todasLasZonas.set(zonas);
          this.isLoadingZonas.set(false);
        },
        error: (error) => {
          console.error('❌ Error cargando zonas:', error);
          this.isLoadingZonas.set(false);
        },
      });
  }

  private loadPaquetesActivos(): void {
    this.isLoadingPaquetes.set(true);
    this.paquetePublicadoService
      .getPaquetes()
      .pipe(
        switchMap((paquetes) => {
          const activos = paquetes.filter(
            (p) => p.estado?.nombre?.toLowerCase() === 'activo',
          );
          if (activos.length === 0) return of([]);

          const todosConProductos = activos.every(
            (p) =>
              p.paqueteBase?.productos && p.paqueteBase.productos.length > 0,
          );
          if (todosConProductos) return of(activos);

          return forkJoin(
            activos.map((p) =>
              this.paquetePublicadoService
                .getPaqueteById(p.id_paquete_publicado!)
                .pipe(catchError(() => of(p))),
            ),
          ).pipe(catchError(() => of(activos)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (paquetes) => {
          const activos = paquetes.filter(
            (p) => p.estado?.nombre?.toLowerCase() === 'activo',
          );
          this.paquetesActivos.set(activos);
          this.isLoadingPaquetes.set(false);
        },
        error: (error) => {
          console.error('❌ Error cargando paquetes publicados:', error);
          this.isLoadingPaquetes.set(false);
        },
      });
  }

  ordenSeleccionado = signal<string>('recientes');

  // 🎯 APLICAR FILTROS
  aplicarFiltros(filtros: FiltrosAplicados): void {
    this.filtrosActuales.set(filtros);
    this.actualizarUrl(1);
  }

  // Al cambiar el orden desde el select
  cambiarOrden(event: Event): void {
    const orden = (event.target as HTMLSelectElement).value;
    this.ordenSeleccionado.set(orden);
    this.actualizarUrl(1);
  }

  private ordenarProductos(productos: Producto[], orden: string): Producto[] {
    switch (orden) {
      case 'a-z':
        return [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre));
      case 'z-a':
        return [...productos].sort((a, b) => b.nombre.localeCompare(a.nombre));
      case 'precio-asc':
        return [...productos].sort((a, b) => a.precio - b.precio);
      case 'precio-desc':
        return [...productos].sort((a, b) => b.precio - a.precio);
      case 'recientes':
      default:
        return productos;
    }
  }

  limpiarFiltros(): void {
    this.filtrosActuales.set(null);
    this.actualizarUrl(1);
  }

  // 🔄 Recargar productos
  recargarProductos(): void {
    this.loadProductosPaginados();
  }

  // 🧭 NAVEGACIÓN
  navegarAProducto(id: number): void {
    if (!id) {
      console.error('❌ ID de producto inválido');
      return;
    }
    const producto = this.productosOriginales().find(
      (p) => (p.id_producto ?? p.id) === id,
    );
    if (producto) {
      const slugUrl = getProductSlugUrl(producto);
      this.router.navigate(['producto', slugUrl]);
    } else {
      this.router.navigate(['producto', id]);
    }
  }

  // 🎨 HELPERS VISUALES
  getCategoriaNombre(producto: Producto): string {
    return typeof producto.categoria === 'string'
      ? producto.categoria
      : (producto.categoria?.nombre ?? 'Sin categoría');
  }

  // 🆕 NUEVO: Helper para obtener el nombre de la marca
  getMarcaNombre(producto: Producto): string {
    return typeof producto.marca === 'string'
      ? producto.marca
      : (producto.marca?.nombre ?? 'Sin marca');
  }

  formatPrice(price?: number): string {
    if (!price) return '$0';

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  // 🖼️ MANEJO DE IMÁGENES
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target.src.includes('placeholder')) return;
    target.src = '/assets/images/placeholder-product.png';
  }

  // 📄 MÉTODOS DE PAGINACIÓN
  onPageChange(page: number): void {
    this.actualizarUrl(page);
  }

  onItemsPerPageChange(itemsPerPage: number): void {
    this.itemsPorPagina.set(itemsPerPage);
    this.actualizarUrl(1);
  }
}
