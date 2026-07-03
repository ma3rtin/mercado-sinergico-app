import { Component, computed, inject, OnInit, signal, DestroyRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { forkJoin, map, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

// Services
import { ProductosService } from '@app/services/producto/producto.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { ZonaService } from '@app/services/zona/zona.service';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';

// Interfaces
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { ConfigFiltros, FiltrosAplicados, OpcionFiltro } from '@app/shared/filtros/filtros';
import { Zona } from '@app/models/ZonasInterfaces/Zona';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

// Components
import { FiltrosComponent } from '@app/shared/filtros/filtros';
import { ProductoCard } from '@app/shared/producto-card/producto-card';
import { PaginationComponent } from '@app/shared/paginacion/paginacion';
import { CatalogoWrapperComponent } from '@app/shared/catalogo-wrapper/catalogo-wrapper';
import { DelayedSkeleton } from '@app/shared/skeleton/delayed-skeleton';
import { ErrorState } from '@app/shared/error-state/error-state';
import { IconComponent } from "@app/shared/icono/icono";

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
    IconComponent
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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  // 🚀 Signals
  productosOriginales = signal<Producto[]>([]);
  productoSeleccionado = signal<Producto | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');
  todasLasZonas = signal<Zona[]>([]);
  paquetesActivos = signal<PaquetePublicado[]>([]);
  filtrosActuales = signal<FiltrosAplicados | null>(null);

  // 📄 SIGNALS DE PAGINACIÓN
  paginaActual = signal<number>(1);
  itemsPorPagina = signal<number>(12); // 12 productos por página (óptimo)

  // 📊 COMPUTED: Filtros iniciales basados en perfil del usuario
  valoresFiltrosIniciales = computed<Partial<FiltrosAplicados>>(() => {
    const perfil = this.usuarioService.perfilUsuario();
    const zonas = perfil?.direccion?.localidad?.zonas || [];
    if (zonas.length > 0 && zonas[0].id_zona) {
      return {
        zonas: [zonas[0].id_zona]
      };
    }
    return {};
  });

  // 📊 COMPUTED: Zonas seleccionadas activas
  zonasSeleccionadasActivas = computed(() => {
    const filtros = this.filtrosActuales();
    if (filtros?.zonas) {
      return filtros.zonas;
    }
    return this.valoresFiltrosIniciales().zonas || [];
  });

  // 📊 COMPUTED: Productos filtrados reactivamente
  productosFiltrados = computed(() => {
    let resultado = [...this.productosOriginales()];
    let filtros = this.filtrosActuales();

    if (!filtros) {
      const init = this.valoresFiltrosIniciales();
      if (init && Object.keys(init).length > 0) {
        filtros = {
          categorias: init.categorias || [],
          marcas: init.marcas || [],
          tiposPaquete: init.tiposPaquete || [],
          ordenamiento: init.ordenamiento || '',
          rangoPrecio: init.rangoPrecio || { min: null, max: null },
          estados: init.estados || [],
          zonas: init.zonas || []
        };
      }
    }

    // 🔒 BASE FILTER: Always restrict to products in active packages (regardless of zone)
    const activePackages = this.paquetesActivos();
    const productIdsPermitidos = new Set<number>();
    activePackages.forEach(paq => {
      const prods = paq.paqueteBase?.productos || [];
      prods.forEach(bp => {
        const pid = Number(bp.productoId || 0);
        if (pid > 0) productIdsPermitidos.add(pid);
      });
    });

    if (productIdsPermitidos.size > 0) {
      resultado = resultado.filter(p =>
        productIdsPermitidos.has(Number(p.id_producto || p.id || 0))
      );
    } else {
      return [];
    }

    if (filtros) {
      // Filtrar por categorías
      if (filtros.categorias.length > 0) {
        resultado = resultado.filter(p =>
          filtros.categorias.includes(p.categoria_id)
        );
      }

      // Filtrar por marcas
      if (filtros.marcas.length > 0) {
        resultado = resultado.filter(p =>
          filtros.marcas.includes(p.marca_id)
        );
      }

      // Filtrar por rango de precio
      if (filtros.rangoPrecio.min !== null) {
        resultado = resultado.filter(p => p.precio >= filtros.rangoPrecio.min!);
      }
      if (filtros.rangoPrecio.max !== null) {
        resultado = resultado.filter(p => p.precio <= filtros.rangoPrecio.max!);
      }

      // 🗺️ ZONE FILTER: Additional constraint within already-permitted products
      const zonasParaFiltrar = filtros.zonas?.length > 0
        ? filtros.zonas
        : this.valoresFiltrosIniciales().zonas || [];

      if (zonasParaFiltrar.length > 0) {
        const paquetesEnZonas = activePackages.filter(paq =>
          zonasParaFiltrar.includes(Number(paq.zonaId) || 0)
        );

        const zonaProductIds = new Set<number>();
        paquetesEnZonas.forEach(paq => {
          const prods = paq.paqueteBase?.productos || [];
          prods.forEach(bp => {
            const pid = Number(bp.productoId || 0);
            if (pid > 0) zonaProductIds.add(pid);
          });
        });

        if (zonaProductIds.size > 0) {
          resultado = resultado.filter(p =>
            zonaProductIds.has(Number(p.id_producto || p.id || 0))
          );
        } else {
          return [];
        }
      }
    }

    // Ordenar con el orden seleccionado
    if (this.ordenSeleccionado()) {
      resultado = this.ordenarProductos(resultado, this.ordenSeleccionado());
    }

    return resultado;
  });

  // 📊 COMPUTED: Productos paginados
  productosPaginados = computed(() => {
    const seleccionado = this.productoSeleccionado();

    // Si hay un producto seleccionado, mostrar solo ese
    if (seleccionado) {
      return [seleccionado];
    }

    // Si no, paginar los filtrados
    const page = this.paginaActual();
    const perPage = this.itemsPorPagina();
    const filtrados = this.productosFiltrados();

    const start = (page - 1) * perPage;
    const end = start + perPage;

    return filtrados.slice(start, end);
  });

  // 📊 COMPUTED: Total de items para la paginación
  totalItemsPaginacion = computed(() => {
    const seleccionado = this.productoSeleccionado();
    if (seleccionado) return 1;
    return this.productosFiltrados().length;
  });

  // 🌐 Platform check
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // 🧩 Computed signals
  hasProductos = computed(() => this.productosOriginales().length > 0);

  // 🎯 CONFIGURACIÓN DE FILTROS PARA PRODUCTOS
  configFiltrosProductos = computed<ConfigFiltros>(() => ({
    // 📊 Servicios para obtener datos
    obtenerCategorias: () => this.categoriaService.getCategorias().pipe(
      map(categorias => categorias.map(cat => ({
        id: cat.id_categoria,
        nombre: cat.nombre,
        valor: cat.id_categoria
      } as OpcionFiltro)))
    ),

    obtenerMarcas: () => this.marcaService.getMarcas().pipe(
      map(marcas => marcas.map(marca => ({
        id: marca.id_marca,
        nombre: marca.nombre,
        valor: marca.id_marca
      } as OpcionFiltro)))
    ),

    obtenerZonas: () => this.zonaService.getZonas().pipe(
      map(zonas => zonas.map(zona => ({
        id: zona.id_zona,
        nombre: zona.nombre,
        valor: zona.id_zona
      } as OpcionFiltro)))
    ),

    // 🎨 Filtros a mostrar (solo para productos)
    mostrarCategoria: true,
    mostrarMarca: true,
    mostrarZona: true,
    mostrarTipoPaquete: false, // No aplica para productos
    mostrarRangoPrecio: true,  // SÍ para productos
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
      this.loadProductos();
      this.loadZonas();
      this.loadPaquetesActivos();
    }
  }

  // 📥 CARGA DE DATOS
  private loadProductos(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.productosService.getProductos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (productos) => {
          const productosOrdenados = this.ordenarProductos(productos, 'recientes');

          this.productosOriginales.set(productosOrdenados);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('❌ Error cargando productos:', error);
          this.isLoading.set(false);

          // Manejo de errores específicos
          if (error.name === 'TimeoutError') {
            this.errorMessage.set('El servidor no respondió a tiempo. Por favor, intentá de nuevo.');
          }
          else if (error.status === 0) {
            this.errorMessage.set('No se pudo conectar con el servidor. Verificá tu conexión.');
          }
          else if (error.status >= 500) {
            this.errorMessage.set('Error interno del servidor. Intentá más tarde.');
          }
          else {
            this.errorMessage.set('Ocurrió un error inesperado.');
          }

          this.productosOriginales.set([]);
        }
      });
  }

  private loadZonas(): void {
    this.zonaService.getZonas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (zonas) => {
          this.todasLasZonas.set(zonas);
        },
        error: (error) => {
          console.error('❌ Error cargando zonas:', error);
        }
      });
  }

  private loadPaquetesActivos(): void {
    this.paquetePublicadoService.getPaquetes()
      .pipe(
        switchMap(paquetes => {
          const activos = paquetes.filter(p =>
            p.estado?.nombre?.toLowerCase() === 'activo'
          );
          if (activos.length === 0) return of([]);

          const todosConProductos = activos.every(p =>
            p.paqueteBase?.productos && p.paqueteBase.productos.length > 0
          );
          if (todosConProductos) return of(activos);

          return forkJoin(
            activos.map(p =>
              this.paquetePublicadoService.getPaqueteById(p.id_paquete_publicado!).pipe(
                catchError(() => of(p))
              )
            )
          ).pipe(catchError(() => of(activos)));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (paquetes) => {
          this.paquetesActivos.set(paquetes);
        },
        error: (error) => {
          console.error('❌ Error cargando paquetes publicados:', error);
        }
      });
  }

  ordenSeleccionado = signal<string>('recientes');

  // 🎯 APLICAR FILTROS
  aplicarFiltros(filtros: FiltrosAplicados): void {
    this.filtrosActuales.set(filtros);
  }

  // Al cambiar el orden desde el select
  cambiarOrden(event: Event): void {
    const orden = (event.target as HTMLSelectElement).value;
    this.ordenSeleccionado.set(orden);
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
        // Mantener el orden original en el que vienen del backend
        return productos;
    }
  }

  limpiarFiltros(): void {
    const init = this.valoresFiltrosIniciales();
    if (init && Object.keys(init).length > 0) {
      this.filtrosActuales.set({
        categorias: init.categorias || [],
        marcas: init.marcas || [],
        tiposPaquete: init.tiposPaquete || [],
        ordenamiento: init.ordenamiento || '',
        rangoPrecio: init.rangoPrecio || { min: null, max: null },
        estados: init.estados || [],
        zonas: init.zonas || []
      });
    } else {
      this.filtrosActuales.set(null);
    }
  }

  // 🔄 Recargar productos
  recargarProductos(): void {
    this.loadProductos();
  }

  // 🧭 NAVEGACIÓN
  navegarAProducto(id: number): void {
    if (!id) {
      console.error('❌ ID de producto inválido');
      return;
    }
    this.router.navigate(['producto', id]);
  }

  // 🎨 HELPERS VISUALES
  getCategoriaNombre(producto: Producto): string {
    return typeof producto.categoria === 'string'
      ? producto.categoria
      : producto.categoria?.nombre ?? 'Sin categoría';
  }

  // 🆕 NUEVO: Helper para obtener el nombre de la marca
  getMarcaNombre(producto: Producto): string {
    return typeof producto.marca === 'string'
      ? producto.marca
      : producto.marca?.nombre ?? 'Sin marca';
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
    this.paginaActual.set(page);
  }

  onItemsPerPageChange(itemsPerPage: number): void {
    this.itemsPorPagina.set(itemsPerPage);
    this.paginaActual.set(1); // Resetear a página 1
  }
}
