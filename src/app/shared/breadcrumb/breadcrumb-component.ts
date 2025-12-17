import { Component, computed, DestroyRef, inject, OnInit, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface BreadcrumbItem {
  label: string;
  url: string;
  isActive: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './breadcrumb-component.html',
})
export class BreadcrumbComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  // 🎯 Input para personalizar dinámicamente el último breadcrumb
  @Input() customLabel?: string;

  // 🎯 Signal para almacenar las migas de pan
  breadcrumbs = signal<BreadcrumbItem[]>([]);

  // 🎨 Computed para obtener las migas sin la última (activa)
  navigableBreadcrumbs = computed(() => {
    const items = this.breadcrumbs();
    return items.slice(0, -1);
  });

  // 🎨 Computed para obtener la última miga (activa)
  activeBreadcrumb = computed(() => {
    const items = this.breadcrumbs();
    const lastItem = items[items.length - 1] || null;
    
    // Si hay un customLabel, usarlo
    if (lastItem && this.customLabel) {
      return { ...lastItem, label: this.customLabel };
    }
    
    return lastItem;
  });

  ngOnInit(): void {
    // Generar breadcrumbs en la inicialización
    this.updateBreadcrumbs();

    // Escuchar cambios de navegación
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.updateBreadcrumbs();
      });
  }

  /**
   * 🔄 Actualiza las migas de pan basándose en la ruta actual
   */
  private updateBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbItem[] = [];
    let currentRoute = this.activatedRoute.root;
    let url = '';

    // Siempre agregar el home como primer elemento
    breadcrumbs.push({
      label: 'Volver',
      url: '/',
      isActive: false
    });

    // Recorrer el árbol de rutas
    while (currentRoute.children.length > 0) {
      currentRoute = currentRoute.children[0];

      // Obtener el segmento de la URL
      if (currentRoute.snapshot.url.length > 0) {
        const urlSegment = currentRoute.snapshot.url.map(segment => segment.path).join('/');
        url += `/${urlSegment}`;

        // Obtener el label desde el data de la ruta o generar uno
        const label = currentRoute.snapshot.data['breadcrumb'] || this.formatLabel(urlSegment);

        // Solo agregar si no está vacío
        if (label) {
          breadcrumbs.push({
            label,
            url,
            isActive: false
          });
        }
      }
    }

    // Marcar el último como activo
    if (breadcrumbs.length > 0) {
      breadcrumbs[breadcrumbs.length - 1].isActive = true;
    }

    // Actualizar el signal
    this.breadcrumbs.set(breadcrumbs);
  }

  /**
   * 🎨 Formatea el label de la URL
   * Convierte 'crear-producto' en 'Crear Producto'
   */
  private formatLabel(segment: string): string {
    // Si es un número (ID), no mostrarlo
    if (/^\d+$/.test(segment)) {
      return '';
    }

    // Casos especiales
    const specialCases: Record<string, string> = {
      'paquetes': 'Paquetes',
      'productos': 'Productos',
      'paquetes-publicados': 'Paquetes Publicados',
      'detalleSeleccionProducto': 'Detalle del Producto',
      'detalleProductoSumarse': 'Sumarse al Paquete',
      'mis-pedidos': 'Mis pedidos',
      'perfil': 'Perfil',
      'admin': 'Administración',
      'crear-producto': 'Crear Producto',
      'crear-paquete': 'Crear Paquete',
      'publicar-paquete': 'Publicar Paquete',
      'editar-producto': 'Editar Producto',
      'administrar-productos': 'Administrar Productos',
      'administrar-plantillas': 'Administrar Plantillas'
    };

    if (specialCases[segment]) {
      return specialCases[segment];
    }

    // Si no es un caso especial, formatear automáticamente
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * 🧭 Navega a una ruta específica
   */
  navigateTo(url: string): void {
    this.router.navigate([url]);
  }

  /**
   * 🔙 Navega hacia atrás en el historial
   */
  goBack(): void {
    window.history.back();
  }
}