// paginacion.ts
import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * 🎯 Componente de Paginación Reutilizable (CUSTOM)
 *
 * Este componente implementa paginación manual sin usar el pipe de ngx-pagination.
 * Esto nos da más control y evita problemas con el manejo de estado.
 *
 * @example
 * <app-pagination
 *   [totalItems]="productos.length"
 *   [itemsPerPage]="12"
 *   [currentPage]="paginaActual()"
 *   (pageChange)="onPageChange($event)"
 * />
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paginacion.html',
})
export class PaginationComponent {

  // 🎯 INPUTS (Signal inputs)
  totalItems = input.required<number>();
  itemsPerPage = input<number>(12);
  currentPage = input<number>(1);
  maxSize = input<number>(7);

  // 📝 Labels personalizables
  previousLabel = input<string>('Anterior');
  nextLabel = input<string>('Siguiente');

  // 🎨 Opciones de visualización
  showItemsPerPage = input<boolean>(false);
  itemsPerPageOptions = input<number[]>([12, 24, 36, 48]);

  // 🔧 Configuración
  responsive = input<boolean>(true);
  autoHide = input<boolean>(true);

  // 📤 OUTPUTS
  pageChange = output<number>();
  itemsPerPageChange = output<number>();

  // 📊 COMPUTED PROPERTIES
  totalPages = computed(() => {
    const total = this.totalItems();
    const perPage = this.itemsPerPage();
    if (total === 0 || perPage === 0) return 1;
    return Math.ceil(total / perPage);
  });

  shouldShow = computed(() => {
    if (!this.autoHide()) return true;
    return this.totalPages() > 1;
  });

  showingFrom = computed(() => {
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const total = this.totalItems();

    if (total === 0) return 0;
    return ((page - 1) * perPage) + 1;
  });

  showingTo = computed(() => {
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const total = this.totalItems();
    const to = page * perPage;
    return Math.min(to, total);
  });

  // 📊 COMPUTED: Números de página a mostrar
  getPageNumbers = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const maxSize = this.getMaxSizeResponsive();

    if (total <= maxSize) {
      // Si hay pocas páginas, mostrar todas
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number)[] = [];
    const half = Math.floor(maxSize / 2);

    let start = Math.max(1, current - half);
    let end = Math.min(total, current + half);

    // Ajustar si estamos cerca del inicio
    if (current <= half) {
      end = Math.min(maxSize, total);
    }

    // Ajustar si estamos cerca del final
    if (current >= total - half) {
      start = Math.max(1, total - maxSize + 1);
    }

    // Agregar primera página y ellipsis si es necesario
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push(100);
      }
    }

    // Agregar páginas del rango
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Agregar ellipsis y última página si es necesario
    if (end < total) {
      if (end < total - 1) {
        pages.push(100);
      }
      pages.push(total);
    }

    return pages;
  });

  // 🎯 MÉTODOS
  onPageChanged(page: number ): void {
    const total = this.totalPages();

    // Validar que la página esté en rango
    if (page < 1 || page > total || page === this.currentPage()) {
      return;
    }

    this.pageChange.emit(page);
    this.scrollToTop();
  }

  onItemsPerPageChanged(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newItemsPerPage = parseInt(select.value, 10);
    this.itemsPerPageChange.emit(newItemsPerPage);
    this.pageChange.emit(1); // Volver a la primera página
  }

  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // 🎨 Helper para estilos responsive
  getMaxSizeResponsive(): number {
    if (!this.responsive()) return this.maxSize();

    if (typeof window === 'undefined') return this.maxSize();

    // Mobile: mostrar menos números
    if (window.innerWidth < 640) {
      return 3;
    }
    // Tablet: mostrar cantidad media
    if (window.innerWidth < 1024) {
      return 5;
    }
    // Desktop: mostrar todos
    return this.maxSize();
  }

  // 🎨 Helper para clases de botones
  getButtonClass(isActive: boolean, isDisabled: boolean): string {
    const base = 'px-3 py-2 min-w-[2.5rem] text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2  focus:ring-offset-1';

    if (isDisabled) {
      return `${base} opacity-40 cursor-not-allowed bg-gray-200 text-gray-500 border border-gray-300`;
    }

    if (isActive) {
      return `${base} bg-secondary text-white border border-secondary shadow-md font-bold hover:bg-secondary-dark hover:border-secondary-dark transform scale-110`;
    }

    return `${base} border border-gray-300 bg-white text-gray-700 hover:bg-primary-light hover:border-primary hover:text-primary-dark hover:transform hover:scale-105 cursor-pointer`;
  }
}
