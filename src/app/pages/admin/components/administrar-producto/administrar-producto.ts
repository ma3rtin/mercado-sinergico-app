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
import { PaginationComponent } from '@app/shared/paginacion/paginacion';

@Component({
  selector: 'app-administrar-productos',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent, AdminBackButtonComponent, PaginationComponent],
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
  currentPage = signal(1);
  itemsPerPage = signal(10);


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

  paginatedProductos = computed(() => {
    const all = this.filteredProductos();
    const page = this.currentPage();
    const limit = this.itemsPerPage();
    const start = (page - 1) * limit;
    return all.slice(start, start + limit);
  });

  constructor() {
    this.loadProductos();

    effect(() => {
      console.log('🔍 Buscando:', this.searchTerm(), '| Orden:', this.sortOrder());
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
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
        this.productosService.deleteProducto(producto.id_producto ?? 0).subscribe({
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

  mostrarGuiaSimbolos(): void {
    console.log('💡 Abriendo guía de símbolos...');
    Swal.fire({
      title: 'Guía de Símbolos',
      html: `
      <div class="text-left py-2 space-y-5">
        <!-- Sección: Acciones Rápidas -->
        <div class="space-y-3">
          <h4 class="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] px-1 opacity-70">Control de Producto</h4>
          
          <div class="space-y-2">
            <!-- Item: Duplicar -->
            <div class="flex items-center gap-4 p-4 bg-gray-50/80 rounded-[22px] border border-gray-100/50 shadow-sm active:scale-95 transition-all">
              <div class="w-12 h-12 flex items-center justify-center bg-white text-gray-400 rounded-2xl shadow-sm shrink-0 border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-black text-gray-900 uppercase tracking-tight leading-none mb-1">Duplicar</p>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Clonar producto</p>
              </div>
            </div>

            <!-- Item: Variantes -->
            <div class="flex items-center gap-4 p-4 bg-brand-primary/5 rounded-[22px] border border-brand-primary/10 shadow-sm active:scale-95 transition-all">
              <div class="w-12 h-12 flex items-center justify-center bg-brand-primary text-white rounded-2xl shadow-brand-primary/20 shadow-lg shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-black text-brand-primary uppercase tracking-tight leading-none mb-1">Variantes</p>
                <p class="text-[10px] font-bold text-brand-primary/60 uppercase tracking-widest leading-tight">Stock y Atributos</p>
              </div>
            </div>

            <!-- Item: Vista/Detalles -->
            <div class="flex items-center gap-4 p-4 bg-gray-50/80 rounded-[22px] border border-gray-100/50 shadow-sm active:scale-95 transition-all">
              <div class="w-12 h-12 flex items-center justify-center bg-white text-brand-secondary rounded-2xl shadow-sm shrink-0 border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-black text-gray-900 uppercase tracking-tight leading-none mb-1">Ver Ficha</p>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Detalle técnico</p>
              </div>
            </div>

            <!-- Item: Editar -->
            <div class="flex items-center gap-4 p-4 bg-gray-50/80 rounded-[22px] border border-gray-100/50 shadow-sm active:scale-95 transition-all">
              <div class="w-12 h-12 flex items-center justify-center bg-white text-orange-500 rounded-2xl shadow-sm shrink-0 border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-black text-gray-900 uppercase tracking-tight leading-none mb-1">Editar</p>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Modificar datos</p>
              </div>
            </div>

            <!-- Item: Eliminar -->
            <div class="flex items-center gap-4 p-4 bg-red-50 rounded-[22px] border border-red-100 shadow-sm active:scale-95 transition-all">
              <div class="w-12 h-12 flex items-center justify-center bg-white text-red-500 rounded-2xl shadow-sm shrink-0 border border-red-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-black text-red-700 uppercase tracking-tight leading-none mb-1">Eliminar</p>
                <p class="text-[10px] font-bold text-red-400 uppercase tracking-widest leading-tight">Borrar definitivo</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sección: Estados -->
        <div class="space-y-3 pt-2">
          <h4 class="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] px-1 opacity-70">Leyenda de Estados</h4>
          <div class="flex flex-wrap gap-2">
            <span class="px-4 py-2.5 rounded-2xl bg-blue-50 text-blue-600 text-[10px] font-black border border-blue-100 uppercase tracking-widest flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              Variantes (VAR)
            </span>
            <span class="px-4 py-2.5 rounded-2xl bg-brand-primary/10 text-brand-primary text-[10px] font-black border border-brand-primary/10 uppercase tracking-widest flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
              Precio Base
            </span>
          </div>
        </div>
      </div>
    `,
      showConfirmButton: true,
      confirmButtonText: 'ENTENDIDO',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-[32px] p-6 border-none shadow-2xl mx-4',
        title: 'font-display font-black text-xl text-text-primary uppercase tracking-tight text-left mb-0',
        confirmButton: 'w-full py-5 mt-6 bg-brand-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-[24px] hover:bg-brand-primary-dark transition-all active:scale-95 shadow-xl shadow-brand-primary/20'
      }
    });
  }
}
