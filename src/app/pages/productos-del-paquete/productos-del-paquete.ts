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
import { Observable, map } from 'rxjs';

// Interfaces
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { OpcionSelect, ConfigBuscador } from '@app/shared/buscador/buscador';
import { ConfigFiltros, FiltrosAplicados, OpcionFiltro } from '@app/shared/filtros/filtros';
import { TipoPaquete } from '@app/models/Enums';

// Services
import { ProductosService } from '@app/services/producto/producto.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { MarcaService } from '@app/services/producto/marca.service';

// Components
import { BuscadorComponent } from '@app/shared/buscador/buscador';
import { FiltrosComponent } from '@app/shared/filtros/filtros';
import { ProductoCard } from '@app/shared/producto-card/producto-card';
import { BreadcrumbComponent } from '@app/shared/breadcrumb-component/breadcrumb-component';

@Component({
  selector: 'app-productos-del-paquete',
  standalone: true,
  imports: [
    CommonModule,
    BuscadorComponent,
    FiltrosComponent,
    ProductoCard,
    BreadcrumbComponent
  ],
  templateUrl: './productos-del-paquete.html',
  styleUrl: './productos-del-paquete.css'
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
  idPaquete = signal<number>(0); // ✅ Inicializado en 0

  // 🔍 Configuración del buscador
  configBuscador = computed<ConfigBuscador<Producto>>(() => ({
    obtenerDatos: (): Observable<Producto[]> => {
      return this.productosService.getProductos();
    },
    
    filtrar: (datos: Producto[], termino: string): Producto[] => {
      const terminoLower = termino.toLowerCase();
      return datos.filter((producto) => {
        const nombre = producto.nombre?.toLowerCase() || '';
        const descripcion = producto.descripcion?.toLowerCase() || '';
        const marcaNombre = producto.marca?.nombre?.toLowerCase() || '';
        const categoriaNombre = producto.categoria?.nombre?.toLowerCase() || '';

        return (
          nombre.includes(terminoLower) ||
          descripcion.includes(terminoLower) ||
          marcaNombre.includes(terminoLower) ||
          categoriaNombre.includes(terminoLower)
        );
      });
    },

    mapear: (producto: Producto): OpcionSelect => ({
      id: producto.id_producto || 0,
      etiqueta: producto.nombre || 'Producto sin nombre',
      grupo: producto.categoria?.nombre || 'Sin categoría',
    }),

    campoTexto: 'nombre',
    debounceMs: 300,
  }));

  // 🎯 CONFIGURACIÓN DE FILTROS PARA PRODUCTOS DEL PAQUETE
  configFiltrosProductos = computed<ConfigFiltros<Producto>>(() => ({
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
    
    mostrarCategoria: true,
    mostrarMarca: true,
    mostrarTipoPaquete: false,
    mostrarRangoPrecio: true,
    mostrarOrdenamiento: true,
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
    if (p.tipoPaquete === TipoPaquete.SINERGICO) porcentaje = 3;
    if (p.tipoPaquete === TipoPaquete.ENERGICO) porcentaje = 8;
    
    return {
      porcentaje,
      aplicado: false,
      nombrePaquete: p.paqueteBase?.nombre || 'Paquete'
    };
  });

  // 📊 Computed: Tipo de paquete
  tipoPaquete = computed(() => {
    return this.paquete()?.tipoPaquete || null;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productosService: ProductosService,
    private paquetePublicadoService: PaquetePublicadoService,
    private categoriaService: CategoriaService,
    private marcaService: MarcaService,
    private destroyRef: DestroyRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // ✅ Obtener ID del paquete desde la ruta: /productos-del-paquete/:paqueteId
      const id = this.route.snapshot.paramMap.get('paqueteId');
      if (id) {
        const paqueteId = Number(id);
        this.idPaquete.set(paqueteId);
        this.cargarPaquete(paqueteId);
        this.cargarProductos();
      } else {
        this.errorMessage.set('No se proporcionó un ID de paquete válido');
        this.isLoading.set(false);
      }
    }
  }

  // 📥 Cargar información del paquete
  private cargarPaquete(id: number): void {
    this.paquetePublicadoService
      .getPaquetes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paquetes) => {
          const paqueteEncontrado = paquetes.find(p => p.id_paquete_publicado === id);
          if (paqueteEncontrado) {
            this.paquete.set(paqueteEncontrado);
            console.log('✅ Paquete cargado:', paqueteEncontrado);
          } else {
            this.errorMessage.set('Paquete no encontrado');
          }
        },
        error: (error) => {
          console.error('❌ Error cargando paquete:', error);
          this.errorMessage.set('Error al cargar el paquete');
        },
      });
  }

  // 📥 Cargar productos del paquete
  private cargarProductos(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.productosService
      .getProductos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (productos) => {
          console.log('✅ Productos cargados:', productos.length);
          this.productosOriginales.set(productos);
          this.productosFiltrados.set(productos);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('❌ Error cargando productos:', error);
          this.isLoading.set(false);

          let mensaje = 'Error al cargar los productos. Por favor, intentá nuevamente.';
          
          if (error.name === 'TimeoutError') {
            mensaje = 'El servidor tardó demasiado en responder.';
          } else if (error.status === 0) {
            mensaje = 'No se pudo conectar con el servidor.';
          } else if (error.status === 404) {
            mensaje = 'No se encontraron productos para este paquete.';
          }

          this.errorMessage.set(mensaje);
          this.productosOriginales.set([]);
          this.productosFiltrados.set([]);
        },
      });
  }

  // 🎯 APLICAR FILTROS
  aplicarFiltros(filtros: FiltrosAplicados): void {
    console.log('🎯 Filtros recibidos:', filtros);
    
    let resultado = [...this.productosOriginales()];
    
    if (filtros.categorias.length > 0) {
      resultado = resultado.filter(p => 
        filtros.categorias.includes(p.categoria_id)
      );
    }
    
    if (filtros.marcas.length > 0) {
      resultado = resultado.filter(p => 
        filtros.marcas.includes(p.marca_id)
      );
    }
    
    if (filtros.rangoPrecio.min !== null) {
      resultado = resultado.filter(p => p.precio >= filtros.rangoPrecio.min!);
    }
    if (filtros.rangoPrecio.max !== null) {
      resultado = resultado.filter(p => p.precio <= filtros.rangoPrecio.max!);
    }
    
    if (filtros.ordenamiento) {
      resultado = this.ordenarProductos(resultado, filtros.ordenamiento);
    }
    
    this.productosFiltrados.set(resultado);
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
  }

  recargarProductos(): void {
    this.productoSeleccionado.set(null);
    this.cargarProductos();
  }

  alSeleccionarProducto(producto: Producto): void {
    console.log('🔍 Producto seleccionado:', producto);
    this.productoSeleccionado.set(producto);
  }

  limpiarBusqueda(): void {
    this.productoSeleccionado.set(null);
  }

  // 🧭 Navegar al detalle del producto para sumarse
  // ✅ Nota: El ProductoCard ahora se encarga de la navegación
  navegarAProductoDetalleSumarse(idProducto: number): void {
    console.log('🧭 ProductoCard emitió click:', idProducto);
    // Ya no necesitamos hacer nada aquí porque ProductoCard se encarga
  }

  volverAPaquetes(): void {
    this.router.navigate(['/paquetes-publicados']);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.includes('placeholder')) {
      target.src = '/assets/images/placeholder-product.png';
    }
  }
}