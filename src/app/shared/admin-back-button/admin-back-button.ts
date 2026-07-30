import { Component, inject, input, output } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '@app/shared/icono/icono';

/**
 * Botón de "Volver" reutilizable para todas las vistas del admin.
 * Usa Router para navegar a una ruta específica, o Location.back()
 * como fallback si no se provee ruta.
 * Puede ser interceptado usando el output (backClick).
 *
 * Uso:
 * <app-admin-back-button route="/admin/panel" />
 * <app-admin-back-button label="Volver al listado" route="/admin/productos" />
 * <app-admin-back-button label="Descartar" (backClick)="onDescartar()" />
 */
@Component({
  selector: 'app-admin-back-button',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './admin-back-button.html',
})
export class AdminBackButtonComponent {
  label = input<string>('Volver');
  route = input<string | null>(null);
  
  // Indica si la acción de volver se delega completamente al componente padre
  customHandler = input<boolean>(false);
  
  // Evento opcional para interceptar el click
  backClick = output<void>();

  private location = inject(Location);
  private router = inject(Router);

  goBack(): void {
    if (this.customHandler()) {
      this.backClick.emit();
      return;
    }

    const routeTo = this.route();
    if (routeTo) {
      this.router.navigateByUrl(routeTo);
    } else {
      this.location.back();
    }
  }
}
