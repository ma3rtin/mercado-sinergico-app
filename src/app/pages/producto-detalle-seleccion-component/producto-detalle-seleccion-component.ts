import { Component, inject, OnInit, signal, computed, DestroyRef, PLATFORM_ID } from '@angular/core';
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
import { BreadcrumbComponent } from '@app/shared/breadcrumb-component/breadcrumb-component';
import { ProductoCard } from '@app/shared/producto-card/producto-card';
import { PaqueteCard } from '@app/shared/paquete-card/paquete-card';
import { ButtonComponent } from '@app/shared/botones-component/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';

@Component({
  selector: 'app-producto-detalle-seleccion',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    ProductoCard,
    PaqueteCard,
    ButtonComponent,
    IconComponent
],
  templateUrl: './producto-detalle-seleccion-component.html',
})
export class ProductoDetalleSeleccionComponent implements OnInit {
  // 🔧 Services
  private readonly productosService = inject(ProductosService);
  private readonly paquetePublicadoService = inject(PaquetePublicadoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  // 🌐 Platform check
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // 🚀 Signals
  productoSeleccionado = signal<Producto | null>(null);
  todosLosPaquetes = signal<PaquetePublicado[]>([]);
  isLoadingProducto = signal(true);
  isLoadingPaquetes = signal(true);
  errorMessage = signal('');

  // 📊 Computed Signals
  paquetesDelProducto = computed(() => this.todosLosPaquetes());

  // Loading general
  isLoading = computed(() =>
    this.isLoadingProducto() || this.isLoadingPaquetes()
  );

  // Hay paquetes disponibles
  hayPaquetesDisponibles = computed(() =>
    this.paquetesDelProducto().length > 0
  );

  // Nombre del producto para breadcrumb
  nombreProductoBreadcrumb = computed(() =>
    this.productoSeleccionado()?.nombre || 'Producto'
  );

  ngOnInit(): void {
    if (this.isBrowser) {
      this.cargarDatos();
    }
  }

  // 📥 CARGA DE DATOS
  private cargarDatos(): void {
    // Obtener el ID del producto de la URL
    const productoId = Number(this.route.snapshot.paramMap.get('id'));

    console.log('🚀 Cargando datos para producto ID:', productoId);

    if (!productoId || isNaN(productoId)) {
      console.error('❌ ID de producto inválido:', productoId);
      this.errorMessage.set('ID de producto inválido');
      this.isLoadingProducto.set(false);
      this.isLoadingPaquetes.set(false);
      return;
    }

    // Cargar producto
    this.cargarProducto(productoId);

    // Cargar paquetes
    this.cargarPaquetes();
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
        }
      });
  }

  // 🎁 Cargar todos los paquetes
  private cargarPaquetes(): void {
    this.isLoadingPaquetes.set(true);

    this.paquetePublicadoService
      .getPaquetes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paquetes) => {
          console.log('✅ Paquetes cargados:', paquetes.length);
          this.todosLosPaquetes.set(paquetes);
          this.isLoadingPaquetes.set(false);
        },
        error: (error) => {
          console.error('❌ Error cargando paquetes:', error);
          this.isLoadingPaquetes.set(false);

          let mensaje = 'Error al cargar los paquetes.';

          if (error.status === 0) {
            mensaje = 'No se pudo conectar con el servidor.';
          } else if (error.status === 404) {
            mensaje = 'No se encontraron paquetes.';
          }

          this.errorMessage.set(mensaje);
          this.todosLosPaquetes.set([]);
        }
      });
  }

  // 🔄 Recargar datos
  recargarDatos(): void {
    console.log('🔄 Recargando datos...');
    this.errorMessage.set('');
    this.cargarDatos();
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

    console.log('🧭 Navegando a sumarse:', { productoId, paqueteId });

    // Navegar a la vista de "sumarse" con ambos IDs
    this.router.navigate(['detalleProductoSumarse/', productoId, paqueteId], {
      queryParams: { productoId, paqueteId },
    });
  }

  /**
   * Volver a la vista de productos
   */
  volverAProductos(): void {
    this.router.navigate(['/productos']);
  }

  /**
   * Ver detalle completo del producto
   */
  verDetalleProducto(productoId: number): void {
    if (!productoId) {
      console.error('❌ ID de producto inválido');
      return;
    }
    this.router.navigate(['/producto', productoId]);
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
