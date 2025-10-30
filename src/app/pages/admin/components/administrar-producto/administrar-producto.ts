import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

// Models
import { Producto } from '@app/models/ProductosInterfaces/Producto';

// Services
import { ProductosService } from '@app/services/producto/producto.service';

// Components
import { ButtonComponent } from '@app/shared/botones-component/buttonComponent';
import { Router } from '@angular/router';

@Component({
  selector: 'app-administrar-productos',
  templateUrl: './administrar-producto.html',
  imports: [CommonModule, FormsModule, ButtonComponent],
  standalone: true
})
export class AdministrarProductosComponent implements OnInit {
  productos: Producto[] = [];
  filteredProductos: Producto[] = [];
  searchTerm: string = '';
  sortOrder: string = 'nombre-asc';
  isLoading: boolean = true;

  private toastr = inject(ToastrService);
  private productosService = inject(ProductosService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadProductos();
  }

  loadProductos(): void {
    this.isLoading = true;
    this.productosService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.filteredProductos = [...this.productos];
        this.applySorting();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.toastr.error('Error al cargar los productos');
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredProductos = [...this.productos];
    } else {
      this.filteredProductos = this.productos.filter(producto =>
        producto.nombre.toLowerCase().includes(term) ||
        producto.marca?.nombre?.toLowerCase().includes(term) ||
        producto.categoria?.nombre?.toLowerCase().includes(term)
      );
    }

    this.applySorting();
  }

  onSortChange(): void {
    this.applySorting();
  }

  private applySorting(): void {
    this.filteredProductos.sort((a, b) => {
      switch (this.sortOrder) {
        case 'nombre-asc':
          return a.nombre.localeCompare(b.nombre);
        case 'nombre-desc':
          return b.nombre.localeCompare(a.nombre);
        case 'precio-asc':
          return a.precio - b.precio;
        case 'precio-desc':
          return b.precio - a.precio;
        case 'marca-asc':
          return (a.marca?.nombre || '').localeCompare(b.marca?.nombre || '');
        case 'marca-desc':
          return (b.marca?.nombre || '').localeCompare(a.marca?.nombre || '');
        case 'stock-asc':
          return (a.stock || 0) - (b.stock || 0);
        case 'stock-desc':
          return (b.stock || 0) - (a.stock || 0);
        default:
          return 0;
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
    // Abrir modal de vista detallada o navegar a página de detalle
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
      text: `Se creará una copia de "${producto.nombre}"`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#71A8D9',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, duplicar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Crear copia del producto sin el ID
        const productoNuevo = {
          ...producto,
          id: undefined,
          nombre: `${producto.nombre} (Copia)`,
          imagenes: []
        };

        this.productosService.duplicateProduct(producto.id_producto!).subscribe({
          next: () => {
            this.toastr.success('Producto duplicado exitosamente');
            this.loadProductos();
          },
          error: (error) => {
            console.error('Error duplicando producto:', error);
            this.toastr.error(error.error?.message || 'Error al duplicar el producto');
          }
        });

      }
    });
  }

  deleteProducto(producto: Producto): void {
    Swal.fire({
      title: '¿Estás seguro?',
      html: `Se eliminará el producto <strong>"${producto.nombre}"</strong> permanentemente`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#AA3A3A',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productosService.deleteProducto(producto.id_producto!).subscribe({
          next: () => {
            this.toastr.success('Producto eliminado correctamente');
            this.productos = this.productos.filter(p => p.id_producto !== producto.id_producto);
            this.filteredProductos = this.filteredProductos.filter(p => p.id_producto !== producto.id_producto);
          },
          error: (error) => {
            console.error('Error eliminando producto:', error);
            this.toastr.error(error.error?.message || 'Error al eliminar el producto');
          }
        });
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  }

  getStockStatus(stock?: number): { class: string; text: string } {
    if (!stock || stock === 0) {
      return { class: 'text-red-600 bg-red-50', text: 'Sin stock' };
    } else if (stock < 10) {
      return { class: 'text-yellow-600 bg-yellow-50', text: 'Stock bajo' };
    } else {
      return { class: 'text-green-600 bg-green-50', text: 'En stock' };
    }
  }
}