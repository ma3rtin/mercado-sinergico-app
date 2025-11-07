import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductosService } from '@app/services/producto/producto.service';
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { Router } from '@angular/router';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css'],
})
export class ProductosComponent implements OnInit {
  productos = signal<Producto[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    private productosService: ProductosService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.loadProductos();
  }

  private loadProductos(): void {
    console.log('🔄 Cargando productos...');
    this.isLoading.set(true);
    this;

    this.productosService.getProductos().subscribe({
      next: (productos) => {
        console.log('✅ Productos cargados:', productos.length);
        this.productos.set(productos);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Error cargando productos:', error);
        this.isLoading.set(false);

        if (error.name === 'TimeoutError') {
          this.errorMessage.set(
            'El servidor no respondió a tiempo. Por favor, intentá de nuevo.'
          );
        } else if (error.status === 0) {
          this.errorMessage.set(
            'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.'
          );
        } else {
          this.errorMessage.set(
            'Error al cargar los productos. Por favor, intentá de nuevo.'
          );
        }

        this.productos.set([]);
      },
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

  onImageError(event: any): void {
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
      maximumFractionDigits: 0,
    }).format(price);
  }
}
