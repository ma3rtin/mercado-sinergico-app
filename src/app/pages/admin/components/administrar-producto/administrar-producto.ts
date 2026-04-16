import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// Models
import { Producto } from '@app/models/ProductosInterfaces/Producto';

// Services
import { ProductosService } from '@app/services/producto/producto.service';

// Components
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { ToastService } from '@app/services/toast/toast.service';
import { IconComponent } from '@app/shared/icono/icono';
import { AdminBackButtonComponent } from '@app/shared/admin-back-button/admin-back-button';

@Component({
  selector: 'app-administrar-productos',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent, AdminBackButtonComponent],
  templateUrl: './administrar-producto.html',
})
export class AdministrarProductosComponent {
  private productosService = inject(ProductosService);
  private toast = inject(ToastService);
  private router = inject(Router);

  productos = signal<Producto[]>([]);
  searchTerm = signal('');
  sortOrder = signal<'nombre-asc' | 'nombre-desc' | 'precio-asc' | 'precio-desc' | 'marca-asc' | 'marca-desc' | 'stock-asc' | 'stock-desc'>('nombre-asc');
  isLoading = signal(true);


filteredProductos = computed(() => {
  const term = this.searchTerm().toLowerCase().trim();
  const sorted = [...this.productos()];

  const getMarcaNombre = (p: Producto) =>
    typeof p.marca === 'string'
      ? p.marca
      : p.marca?.nombre || '';

  const getCategoriaNombre = (p: Producto) =>
    typeof p.categoria === 'string'
      ? p.categoria
      : p.categoria?.nombre || '';

  const filtered = term
    ? sorted.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        getMarcaNombre(p).toLowerCase().includes(term) ||
        getCategoriaNombre(p).toLowerCase().includes(term)
      )
    : sorted;

  const order = this.sortOrder();
  filtered.sort((a, b) => {
    switch (order) {
      case 'nombre-asc': return a.nombre.localeCompare(b.nombre);
      case 'nombre-desc': return b.nombre.localeCompare(a.nombre);
      case 'precio-asc': return a.precio - b.precio;
      case 'precio-desc': return b.precio - a.precio;
      case 'marca-asc': return getMarcaNombre(a).localeCompare(getMarcaNombre(b));
      case 'marca-desc': return getMarcaNombre(b).localeCompare(getMarcaNombre(a));
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
        for (const producto of productos) {
          console.log('La marca del producto es:', producto.marca);
          console.log('La imagen del producto es:', producto.imagen_url);
          console.log('La variante del producto es:', producto.plantilla);
        }
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.toast.error('Error al cargar los productos');
        this.isLoading.set(false);
      }
    });
  }

  navigateToCreate(): void {
    this.router.navigate(['admin/crear-producto']);
  }

  editProducto(producto: Producto): void {
    this.router.navigate(['admin/editar-producto/', producto.id_producto]);
  }

  gestionarVariantes(producto: Producto): void {
  if (!producto.id_producto) {
    this.toast.error('Producto inválido');
    return;
  }

  this.router.navigate([
    '/admin/gestionar-variantes',
    producto.id_producto
  ]);
}

  viewProducto(producto: Producto): void {
  Swal.fire({
    title: producto.nombre,
    html: `
      <div class="text-left space-y-2">
        <img src="${this.getImagenUrl(producto)}"
        alt="${producto.nombre}"
        class="w-full h-48 object-cover rounded-lg mb-4"
        onerror="this.src='/assets/placeholder.png'">
        <p><strong>Descripción:</strong> ${producto.descripcion || 'Sin descripción'}</p>
        <p><strong>Precio:</strong> $${producto.precio.toFixed(2)}</p>
        <p><strong>Marca:</strong> ${this.getMarcaNombre(producto)}</p>
        <p><strong>Categoría:</strong> ${this.getCategoriaNombre(producto)}</p>
        <p><strong>Stock:</strong> ${producto.stock !== null && producto.stock !== undefined ? producto.stock + ' unidades' : 'Sin stock definido'}</p>
        <p><strong>Tipo:</strong> ${producto.tipo || 'Por definir'}</p>
        ${producto.tieneVariantes ? '<p><strong>Tiene variantes:</strong> Sí (' + (producto.cantidadVariantes || 0) + ')</p>' : ''}
        ${producto.altura ? `<p><strong>Dimensiones:</strong> ${producto.altura}cm x ${producto.ancho}cm x ${producto.profundidad}cm</p>` : ''}
        ${producto.peso ? `<p><strong>Peso:</strong> ${producto.peso}kg</p>` : ''}
      </div>
    `,
    width: '600px',
    confirmButtonText: 'Cerrar',
    confirmButtonColor: '#2E608C'
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
    confirmButtonColor: '#2E608C',
    cancelButtonColor: '#9ca3af'
  }).then((result) => {
    if (result.isConfirmed) {
      this.productosService.duplicateProduct(producto.id_producto!).subscribe({
        next: (response) => {
          this.productos.update((prev) => [...prev, response]);
          this.toast.success('Producto duplicado correctamente');
          this.loadProductos();
        },
        error: (error) => {
          console.error('Error duplicando producto:', error);
          this.toast.error('No se pudo duplicar el producto');
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
      confirmButtonColor: '#B92905',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#9ca3af'
    }).then(result => {
      if (result.isConfirmed) {
        this.productosService.deleteProducto(producto.id_producto??0).subscribe({
          next: () => {
            this.toast.success('Producto eliminado correctamente');
            this.loadProductos();
          },
          error: () => {
            this.toast.error('Error al eliminar producto');
          }
        });
      }
    });
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  // ============================================
// HELPERS PARA MANEJAR MARCA Y CATEGORÍA
// ============================================

public getMarcaNombre(producto: Producto): string {
  if (!producto.marca) return 'N/A';

  if (typeof producto.marca === 'string') {
    return producto.marca;
  }

  if (typeof producto.marca === 'object' && producto.marca.nombre) {
    return producto.marca.nombre;
  }

  return 'N/A';
}

private getCategoriaNombre(producto: Producto): string {
  if (!producto.categoria) return 'N/A';

  if (typeof producto.categoria === 'string') {
    return producto.categoria;
  }

  if (typeof producto.categoria === 'object' && producto.categoria.nombre) {
    return producto.categoria.nombre;
  }

  return 'N/A';
}

private getMarcaId(producto: Producto): number | undefined {
  if (typeof producto.marca === 'object' && producto.marca.id_marca) {
    return producto.marca.id_marca;
  }
  return producto.marca_id;
}

private getCategoriaId(producto: Producto): number | undefined {
  if (typeof producto.categoria === 'object' && producto.categoria.id_categoria) {
    return producto.categoria.id_categoria;
  }
  return producto.categoria_id;
}

public getImagenUrl(producto: Producto): string {
  return producto.imagen_url || producto.imagen || '/assets/placeholder.png';
}
}
