import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ProductosService } from '@app/services/producto/producto.service';
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { Router } from '@angular/router';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  private isBrowser: boolean;

  constructor(
    private productosService: ProductosService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Solo ejecutar en el navegador, NO en SSR
    if (this.isBrowser) {
      this.loadProductos();
    }
  }

  private loadProductos(): void {
    console.log('🔄 Cargando productos...');
    this.isLoading = true;
    this.errorMessage = '';

    this.productosService.getProductos().subscribe({
      next: (productos) => {
        console.log('✅ Productos cargados:', productos.length);
        this.productos = productos;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando productos:', error);
        this.isLoading = false;
        
        if (error.name === 'TimeoutError') {
          this.errorMessage = 'El servidor no respondió a tiempo. Por favor, intentá de nuevo.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.';
        } else {
          this.errorMessage = 'Error al cargar los productos. Por favor, intentá de nuevo.';
        }
        
        this.productos = [];
      }
    });
  }

  recargarProductos(): void {
    this.loadProductos();
  }

  navegarAProducto(id: number): void {
    if (!id) {
      console.error('ID de producto inválido');
      return;
    }
    this.router.navigate(['/detalleSeleccionProducto', id]);
  }

  onImageError(event: any, producto: Producto): void {
    const target = event.target as HTMLImageElement;
    if (target.src.includes('placeholder')) return;
    target.src = '/assets/images/placeholder-product.png';
  }

  getCategoriaNombre(producto: Producto): string {
    return producto.categoria?.nombre || 'Sin categoría';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }
}