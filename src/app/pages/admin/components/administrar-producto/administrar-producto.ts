import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

// Models
import { Producto } from '@app/models/ProductosInterfaces/Producto';

// Services
import { ProductosService } from '@app/services/producto/producto.service';

// Components
import { ButtonComponent } from '@app/shared/botones-component/buttonComponent';

@Component({
  selector: 'app-administrar-productos',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './administrar-producto.html',
})
export class AdministrarProductosComponent {
  private productosService = inject(ProductosService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  productos = signal<Producto[]>([]);
  searchTerm = signal('');
  sortOrder = signal<'nombre-asc' | 'nombre-desc' | 'precio-asc' | 'precio-desc' | 'marca-asc' | 'marca-desc' | 'stock-asc' | 'stock-desc'>('nombre-asc');
  isLoading = signal(true);


  filteredProductos = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const sorted = [...this.productos()];

    // Filtro
    const filtered = term
      ? sorted.filter(p =>
          p.nombre.toLowerCase().includes(term) ||
          p.marca?.nombre?.toLowerCase().includes(term) ||
          p.categoria?.nombre?.toLowerCase().includes(term)
        )
      : sorted;

    // Ordenamiento
    const order = this.sortOrder();
    filtered.sort((a, b) => {
      switch (order) {
        case 'nombre-asc': return a.nombre.localeCompare(b.nombre);
        case 'nombre-desc': return b.nombre.localeCompare(a.nombre);
        case 'precio-asc': return a.precio - b.precio;
        case 'precio-desc': return b.precio - a.precio;
        case 'marca-asc': return (a.marca?.nombre || '').localeCompare(b.marca?.nombre || '');
        case 'marca-desc': return (b.marca?.nombre || '').localeCompare(a.marca?.nombre || '');
        case 'stock-asc': return (a.stock || 0) - (b.stock || 0);
        case 'stock-desc': return (b.stock || 0) - (a.stock || 0);
        default: return 0;
      }
    });

    return filtered;
  });

  constructor() {
    this.loadProductos();

    effect(() => {
      console.log('🔍 Buscando:', this.searchTerm(), '| Orden:', this.sortOrder());
    });
  }

  private loadProductos(): void {
    this.isLoading.set(true);
    this.productosService.getProductos().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.toastr.error('Error al cargar los productos');
        this.isLoading.set(false);
      }
    });
  }

  navigateToCreate(): void {
    this.router.navigate(['/crear-producto']);
  }

  editProducto(producto: Producto): void {
    this.router.navigate(['/editar-producto/', producto.id_producto]);
  }

  viewProducto(producto: Producto): void {
    Swal.fire({
      title: producto.nombre,
      html: `
        <div class="text-left space-y-2">
          <img src="${producto.imagen_url || '/assets/placeholder.png'}"
          alt="${producto.nombre}"
          class="w-full h-48 object-cover rounded-lg mb-4">
          <p><strong>Descripción:</strong> ${producto.descripcion || 'Sin descripción'}</p>
          <p><strong>Precio:</strong> $${producto.precio.toFixed(2)}</p>
          <p><strong>Marca:</strong> ${producto.marca?.nombre || 'N/A'}</p>
          <p><strong>Categoría:</strong> ${producto.categoria?.nombre || 'N/A'}</p>
          <p><strong>Stock:</strong> ${producto.stock || 0} unidades</p>
          ${producto.altura ? `<p><strong>Dimensiones:</strong> ${producto.altura}cm x ${producto.ancho}cm x ${producto.profundidad}cm</p>` : ''}
          ${producto.peso ? `<p><strong>Peso:</strong> ${producto.peso}kg</p>` : ''}
        </div>
      `,
      width: '600px',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#71A8D9'
    });
  }

duplicateProducto(producto: Producto): void {
  Swal.fire({
    title: '¿Duplicar producto?',
    text: `Se creará una copia de "${producto.nombre}".`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Duplicar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#71A8D9'
  }).then((result) => {
    if (result.isConfirmed) {
      this.productosService.duplicateProduct(producto.id_producto!).subscribe({
        next: (response) => {
          this.productos.update((prev) => [...prev, response]);
          this.toastr.success('Producto duplicado correctamente');
          this.loadProductos();
        },
        error: (error) => {
          console.error('Error duplicando producto:', error);
          this.toastr.error('No se pudo duplicar el producto');
        }
      });
    }
  });
}



  deleteProducto(producto: Producto): void {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: `Se eliminará "${producto.nombre}" permanentemente`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      confirmButtonColor: '#E53935',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (result.isConfirmed) {
        this.productosService.deleteProducto(producto.id_producto??0).subscribe({
          next: () => {
            this.toastr.success('Producto eliminado correctamente');
            this.loadProductos();
          },
          error: () => {
            this.toastr.error('Error al eliminar producto');
          }
        });
      }
    });
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }
}
