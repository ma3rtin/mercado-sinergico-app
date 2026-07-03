import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  DestroyRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

// Interfaces
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import {
  ConfigFiltros,
  FiltrosAplicados,
  OpcionFiltro,
} from '@app/shared/filtros/filtros';
import { TipoPaquete } from '@app/models/Enums';

// Services
import { ProductosService } from '@app/services/producto/producto.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { PaqueteBaseService } from '@app/services/paquete/paquete-base.service';

// Components
import { FiltrosComponent } from '@app/shared/filtros/filtros';
import { ProductoCard } from '@app/shared/producto-card/producto-card';
import { PaqueteBannerComponent } from '@app/shared/paquete-banner/paquete-banner';
import { PaginationComponent } from '@app/shared/paginacion/paginacion'; // ✅ IMPORTAR
import { LoaderComponent } from '@app/shared/loader/loader';

@Component({
  selector: 'app-productos-del-paquete',
  standalone: true,
  imports: [
    CommonModule,
    FiltrosComponent,
    ProductoCard,
    PaqueteBannerComponent,
    PaginationComponent, // ✅ AGREGAR AQUÍ
    LoaderComponent
  ],
  templateUrl: './productos-del-paquete.html',
  styleUrl: './productos-del-paquete.css',
})
export class ProductosDelPaquete implements OnInit {
  private isBrowser: boolean;

  // 📦 Signals
  paquete = signal<PaquetePublicado | null>(null);
  productosOriginales = signal<Producto[]>([]);
  productosFiltrados = signal<Producto[]>([]);
  productoSeleccionado = signal<Producto | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  idPaquete = signal<number>(0);
  paqueteIdActual = signal<number | null>(null);

  // 📄 SIGNALS DE PAGINACIÓN
  paginaActual = signal<number>(1);
  itemsPorPagina = signal<number>(12); // 12 productos por página (óptimo)

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

  // 🎯 CONFIGURACIÓN DE FILTROS PARA PRODUCTOS DEL PAQUETE
  configFiltrosProductos = computed<ConfigFiltros>(() => ({
    obtenerCategorias: () =>
      this.categoriaService.getCategorias().pipe(
        map((categorias) =>
          categorias.map(
            (cat) =>
              ({
                id: cat.id_categoria,
                nombre: cat.nombre,
                valor: cat.id_categoria,
              } as OpcionFiltro)
          )
        )
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
              } as OpcionFiltro)
          )
        )
      ),

    mostrarCategoria: true,
    mostrarMarca: true,
    mostrarTipoPaquete: false,
    mostrarRangoPrecio: true,
    mostrarOrdenamiento: false,
    mostrarEstados: false,

    opcionesOrdenamiento: [
      { id: 1, nombre: 'A-Z', valor: 'a-z' },
      { id: 2, nombre: 'Z-A', valor: 'z-a' },
      { id: 3, nombre: 'Precio: Menor a Mayor', valor: 'precio-asc' },
      { id: 4, nombre: 'Precio: Mayor a Menor', valor: 'precio-desc' },
    ],

    tituloCategoria: 'Categorías',
    tituloMarca: 'Marcas',
    tituloRangoPrecio: 'Rango de Precio',
    tituloOrdenamiento: 'Ordenar por',
  }));

  // 📊 Computed: Estadísticas
  totalProductos = computed(() => this.productosOriginales().length);
  productosMostrados = computed(() => {
    const seleccionado = this.productoSeleccionado();
    if (seleccionado) return 1;
    return this.productosFiltrados().length;
  });

  // 📊 Computed: Descuento según tipo de paquete
  descuentoPaquete = computed(() => {
    const p = this.paquete();
    if (!p) return null;

    let porcentaje = 0;
    if (p.tipo === TipoPaquete.SINERGICO) porcentaje = 3;
    if (p.tipo === TipoPaquete.ENERGICO) porcentaje = 8;

    return {
      porcentaje,
      aplicado: false,
      nombrePaquete: p.paqueteBase?.nombre || 'Paquete',
    };
  });

  // 📊 Computed: Tipo de paquete
  tipoPaquete = computed(() => {
    return this.paquete()?.tipo || null;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productosService: ProductosService,
    private paquetePublicadoService: PaquetePublicadoService,
    private categoriaService: CategoriaService,
    private marcaService: MarcaService,
    private paqueteBaseService: PaqueteBaseService,
    private destroyRef: DestroyRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const paqueteId = Number(params.get('paqueteId'));

        console.log('🔄 Cambio de ruta detectado, paquete ID:', paqueteId);

        if (!paqueteId || isNaN(paqueteId)) {
          this.errorMessage.set('No se proporcionó un ID de paquete válido');
          this.isLoading.set(false);
          return;
        }

        this.paqueteIdActual.set(paqueteId);
        this.idPaquete.set(paqueteId);

        this.cargarPaquete(paqueteId);
      });
  }

  // 📥 Cargar paquete publicado
  private cargarPaquete(id: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.paquete.set(null);
    this.productosOriginales.set([]);
    this.productosFiltrados.set([]);
    this.paginaActual.set(1); // ✅ Resetear página al cargar nuevo paquete

    this.paquetePublicadoService
      .getPaquetes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paquetes) => {
          const encontrado = paquetes.find(
            (p) => p.id_paquete_publicado === id
          );

          if (!encontrado) {
            this.errorMessage.set('Paquete no encontrado');
            this.isLoading.set(false);
            return;
          }

          this.paquete.set(encontrado);
          console.log('✅ Paquete cargado:', encontrado);

          this.cargarProductosDelPaquete();
        },
        error: () => {
          this.errorMessage.set('Error al cargar el paquete');
          this.isLoading.set(false);
        },
      });
  }

  // 📥 Cargar productos DEL PAQUETE BASE
  private cargarProductosDelPaquete(): void {
    const paqueteBaseId = this.paquete()?.paqueteBase?.id_paquete_base;

    if (!paqueteBaseId) {
      this.errorMessage.set('No se pudo obtener el paquete base');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.paqueteBaseService
      .getProductosByPaqueteBase(paqueteBaseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (productos) => {
          console.log('✅ Productos del paquete:', productos);
          this.productosOriginales.set(productos);
          this.productosFiltrados.set(productos);
          this.paginaActual.set(1); // ✅ Resetear a página 1
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Error al cargar productos del paquete');
          this.productosOriginales.set([]);
          this.productosFiltrados.set([]);
          this.isLoading.set(false);
        },
      });
  }

  ordenSeleccionado = signal<string>('recientes');

  // 🎯 APLICAR FILTROS
  aplicarFiltros(filtros: FiltrosAplicados): void {
    console.log('🎯 Filtros recibidos:', filtros);
    this.filtrosActuales = filtros;
    this.procesarFiltrosYOrden();
  }

  private filtrosActuales: FiltrosAplicados | null = null;

  private procesarFiltrosYOrden(): void {
    let resultado = [...this.productosOriginales()];
    const filtros = this.filtrosActuales;

    if (filtros) {
      if (filtros.categorias.length > 0) {
        resultado = resultado.filter((p) =>
          filtros.categorias.includes(p.categoria_id)
        );
      }

      if (filtros.marcas.length > 0) {
        resultado = resultado.filter((p) => filtros.marcas.includes(p.marca_id));
      }

      if (filtros.rangoPrecio.min !== null) {
        resultado = resultado.filter((p) => p.precio >= filtros.rangoPrecio.min!);
      }
      if (filtros.rangoPrecio.max !== null) {
        resultado = resultado.filter((p) => p.precio <= filtros.rangoPrecio.max!);
      }
    }

    if (this.ordenSeleccionado()) {
      resultado = this.ordenarProductos(resultado, this.ordenSeleccionado());
    }

    this.productosFiltrados.set(resultado);
    this.paginaActual.set(1); // ✅ Resetear a página 1 al filtrar
  }

  // Al cambiar el orden desde el select
  cambiarOrden(event: Event): void {
    const orden = (event.target as HTMLSelectElement).value;
    this.ordenSeleccionado.set(orden);
    this.procesarFiltrosYOrden();
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
      default:
        return productos;
    }
  }

  limpiarFiltros(): void {
    this.productosFiltrados.set(this.productosOriginales());
    this.paginaActual.set(1); // ✅ Resetear a página 1 al limpiar
  }

  recargarProductos(): void {
    const paqueteId = this.paqueteIdActual();

    if (!paqueteId) {
      console.error('❌ No hay paqueteId para recargar');
      return;
    }

    console.log('🔄 Recargando productos del paquete:', paqueteId);
    this.productoSeleccionado.set(null);
    this.paginaActual.set(1); // ✅ Resetear página
    this.cargarPaquete(paqueteId);
  }

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

  volverAPaquetes(): void {
    this.router.navigate(['/paquetes']);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.includes('placeholder')) {
      target.src = '/assets/images/placeholder-product.png';
    }
  }
}
