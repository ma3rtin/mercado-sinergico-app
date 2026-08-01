import { Component, computed, effect, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

// Models
import { Producto } from '@app/models/ProductosInterfaces/Producto';

// Services
import { ProductosService } from '@app/services/producto/producto.service';

// Components
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { ToastService } from '@app/services/toast/toast.service';
import { IconComponent } from '@app/shared/icono/icono';
import { BackButtonComponent } from '@app/shared/back-button/back-button';
import { PaginationComponent } from '@app/shared/paginacion/paginacion';
import { TipoBadgeComponent } from '@app/tipo-badge/tipo-badge';
import { LoaderComponent } from '@app/shared/loader/loader';

@Component({
  selector: 'app-administrar-productos',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    IconComponent,
    BackButtonComponent,
    PaginationComponent,
    TipoBadgeComponent,
    LoaderComponent,
  ],
  templateUrl: './administrar-producto.html',
})
export class AdministrarProductosComponent {
  @ViewChild('guiaSimbolosTemplate') guiaSimbolosTemplate!: TemplateRef<any>;

  private productosService = inject(ProductosService);
  private toast = inject(ToastService);
  private router = inject(Router);

  productos = signal<Producto[]>([]);
  searchTerm = signal('');
  sortOrder = signal<'nombre-asc' | 'nombre-desc' | 'precio-asc' | 'precio-desc' | 'marca-asc' | 'marca-desc' | 'stock-asc' | 'stock-desc'>('nombre-asc');
  isLoading = signal(true);
  currentPage = signal(1);
  itemsPerPage = signal(10);
  isDuplicating = signal<number | null>(null);
  isArchiving = signal<number | null>(null);
  mostrarArchivados = signal(false);


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
    effect(() => {
      this.mostrarArchivados();
      this.loadProductos();
    }, { allowSignalWrites: true });

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
    this.productosService.getProductos(this.mostrarArchivados()).subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.isLoading.set(false);
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

    if (!producto.plantillaId && !producto.plantilla) {
      this.toast.warning('Este producto no tiene una plantilla de variantes asignada');
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
        ${(producto.plantillaId || producto.plantilla) ? '<p><strong>Tiene variantes:</strong> Sí (' + (producto.cantidadVariantes || 0) + ')</p>' : ''}
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
    if (this.isDuplicating() !== null || this.isArchiving() !== null) return;

    Swal.fire({
      title: '¿Duplicar producto?',
      text: `Se creará una copia de "${producto.nombre}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Duplicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2E608C',
      cancelButtonColor: '#9ca3af',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          this.isDuplicating.set(producto.id_producto!);
          const response = await firstValueFrom(this.productosService.duplicateProduct(producto.id_producto!));
          return response;
        } catch (error: any) {
          console.error('Error duplicando producto:', error);
          Swal.showValidationMessage(`No se pudo duplicar el producto: ${error.error?.message || error.message || 'Error desconocido'}`);
          throw error;
        } finally {
          this.isDuplicating.set(null);
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.productos.update((prev) => [...prev, result.value]);
        this.toast.success('Producto duplicado correctamente');
        this.loadProductos();
      }
    });
  }

  archivarProducto(producto: Producto): void {
    if (this.isDuplicating() !== null || this.isArchiving() !== null) return;

    const nuevoEstado = !producto.archivado;
    const accion = nuevoEstado ? 'archivar' : 'desarchivar';

    Swal.fire({
      title: `¿${nuevoEstado ? 'Archivar' : 'Desarchivar'} producto?`,
      text: `Se cambiará el estado de "${producto.nombre}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: nuevoEstado ? 'Archivar' : 'Desarchivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2E608C',
      cancelButtonColor: '#9ca3af',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          this.isArchiving.set(producto.id_producto!);
          await firstValueFrom(this.productosService.archivarProducto(producto.id_producto!, nuevoEstado));
          return true;
        } catch (error: any) {
          console.error(`Error al ${accion} producto:`, error);
          Swal.showValidationMessage(`No se pudo ${accion} el producto: ${error.error?.message || error.message || 'Error desconocido'}`);
          throw error;
        } finally {
          this.isArchiving.set(null);
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        this.toast.success(`Producto ${nuevoEstado ? 'archivado' : 'desarchivado'} correctamente`);
        this.loadProductos();
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
    
    // Crear el contenedor dinámico en base al template
    const container = document.createElement('div');
    const view = this.guiaSimbolosTemplate.createEmbeddedView(null);
    view.rootNodes.forEach(node => container.appendChild(node));

    Swal.fire({
      title: 'Guía de Símbolos',
      html: container,
      showConfirmButton: true,
      confirmButtonText: 'ENTENDIDO',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-[32px] p-6 border-none shadow-2xl mx-4',
        title: 'font-display font-black text-xl text-text-primary uppercase tracking-tight text-left mb-0',
        confirmButton: 'w-full py-5 mt-6 bg-brand-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-[24px] hover:bg-brand-primary-dark transition-all active:scale-95 shadow-xl shadow-brand-primary/20'
      }
    }).then(() => {
      view.destroy(); // Evitar fugas de memoria
    });
  }
}
