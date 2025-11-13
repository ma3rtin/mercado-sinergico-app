import { Component, computed, inject, OnInit, signal, DestroyRef,PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser} from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ProductosService } from '@app/services/producto/producto.service';
import { Producto } from '@app/models/ProductosInterfaces/Producto';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css'],
})
export class ProductosComponent implements OnInit {
  // 🔧 Services
  private readonly productosService = inject(ProductosService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef); // ✅ DestroyRef agregado
  
  // 🚀 Signals
  productos = signal<Producto[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  
  // 🌐 Platform check
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  
  // 🧩 Computed signals
  hasProductos = computed(() => this.productos().length > 0);

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
      .pipe(takeUntilDestroyed(this.destroyRef)) // ✅ Limpieza automática
      .subscribe({
        next: (productos) => {
          console.log('✅ Productos cargados:', productos.length);
          this.productos.set(productos);
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
          
          this.productos.set([]);
        }
      });
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