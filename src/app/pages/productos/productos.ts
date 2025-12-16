import { Component, computed, inject, OnInit, signal, DestroyRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { map } from 'rxjs';

// Services
import { ProductosService } from '@app/services/producto/producto.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { MarcaService } from '@app/services/producto/marca.service';

// Interfaces
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { ConfigFiltros, FiltrosAplicados, OpcionFiltro } from '@app/shared/filtros/filtros';

// Components
import { BreadcrumbComponent } from '@app/shared/breadcrumb/breadcrumb-component';
import { FiltrosComponent } from '@app/shared/filtros/filtros';
import { ProductoCard } from '@app/shared/producto-card/producto-card';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    FiltrosComponent,
    ProductoCard
  ],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css'],
})
export class ProductosComponent implements OnInit {
  // 🔧 Services
  private readonly productosService = inject(ProductosService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly marcaService = inject(MarcaService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  // 🚀 Signals
  productosOriginales = signal<Producto[]>([]);
  productosFiltrados = signal<Producto[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

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

    // 🎨 Filtros a mostrar (solo para productos)
    mostrarCategoria: true,
    mostrarMarca: true,
    mostrarTipoPaquete: false, // No aplica para productos
    mostrarRangoPrecio: true,  // SÍ para productos
    mostrarOrdenamiento: true,
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
    tituloRangoPrecio: 'Rango de Precio',
    tituloOrdenamiento: 'Ordenar por',
  }));

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadProductos();
    }
  }

  // 📥 CARGA DE DATOS
  private loadProductos(): void {
    console.log('🔄 Cargando productos...');
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.productosService.getProductos()
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

          // Manejo de errores específicos
          if (error.name === 'TimeoutError') {
            this.errorMessage.set('El servidor no respondió a tiempo. Por favor, intentá de nuevo.');
          } else if (error.status === 0) {
            this.errorMessage.set('No se pudo conectar con el servidor. Verificá tu conexión.');
          } else if (error.status === 404) {
            this.errorMessage.set('No se encontraron productos.');
          } else {
            this.errorMessage.set('Error al cargar los productos. Por favor, intentá de nuevo.');
          }

          this.productosOriginales.set([]);
          this.productosFiltrados.set([]);
        }
      });
  }

  // 🎯 APLICAR FILTROS
  aplicarFiltros(filtros: FiltrosAplicados): void {
    console.log('🎯 Filtros recibidos:', filtros);

    let resultado = [...this.productosOriginales()];

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

    // Ordenar
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
      case 'mas-stock':
        return [...productos].sort((a, b) => (b.stock || 0) - (a.stock || 0));
      case 'recientes':
      default:
        return [...productos].sort((a, b) =>
          (b.id_producto || 0) - (a.id_producto || 0)
        );
    }
  }

  limpiarFiltros(): void {
    this.productosFiltrados.set(this.productosOriginales());
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
    this.router.navigate(['detalleSeleccionProducto', id]);
  }

  // 🎨 HELPERS VISUALES
  getCategoriaNombre(producto: Producto): string {
    return producto.categoria?.nombre || 'Sin categoría';
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
}
