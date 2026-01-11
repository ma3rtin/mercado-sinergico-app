// pagination.component.ts
import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';

/**
 * 🎯 Componente de Paginación Reutilizable
 *
 * Wrapper personalizado sobre ngx-pagination con estilos de tu paleta
 *
 * @example
 * <app-pagination
 *   [totalItems]="productos.length"
 *   [itemsPerPage]="12"
 *   [(currentPage)]="paginaActual"
 *   (pageChange)="onPageChange($event)"
 * />
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule],
  templateUrl: './paginacion.html',
})
export class PaginationComponent {

  // 🎯 INPUTS (Signal inputs)
  totalItems = input.required<number>();
  itemsPerPage = input<number>(12); // 12 items por defecto (óptimo para e-commerce)
  currentPage = input<number>(1);
  maxSize = input<number>(7); // Máximo de números de página visibles

  // 📝 Labels personalizables
  previousLabel = input<string>('Anterior');
  nextLabel = input<string>('Siguiente');
  firstLabel = input<string>('Primera');
  lastLabel = input<string>('Última');

  // 🎨 Opciones de visualización
  showFirstLast = input<boolean>(true); // Mostrar botones "Primera" y "Última"
  showItemsPerPage = input<boolean>(false); // Mostrar selector de items por página
  itemsPerPageOptions = input<number[]>([12, 24, 36, 48]); // Opciones de items

  // 🔧 Configuración
  responsive = input<boolean>(true); // Diseño responsive
  autoHide = input<boolean>(true); // Ocultar si hay una sola página
  directionLinks = input<boolean>(true); // Mostrar flechas prev/next

  // 📤 OUTPUTS
  pageChange = output<number>();
  itemsPerPageChange = output<number>();

  // 📊 COMPUTED PROPERTIES
  totalPages = computed(() => {
    return Math.ceil(this.totalItems() / this.itemsPerPage());
  });

  shouldShow = computed(() => {
    if (!this.autoHide()) return true;
    return this.totalPages() > 1;
  });

  showingFrom = computed(() => {
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    return ((page - 1) * perPage) + 1;
  });

  showingTo = computed(() => {
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const total = this.totalItems();
    const to = page * perPage;
    return Math.min(to, total);
  });

  // 🎯 MÉTODOS
  onPageChanged(page: number): void {
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
}
