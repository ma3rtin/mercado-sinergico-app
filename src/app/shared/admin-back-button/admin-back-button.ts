import { Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '@app/shared/icono/icono';

/**
 * Botón de "Volver" reutilizable para todas las vistas del admin.
 * Usa Router para navegar a una ruta específica, o Location.back()
 * como fallback si no se provee ruta.
 *
 * Uso:
 * <app-admin-back-button route="/admin/panel" />
 * <app-admin-back-button label="Volver al listado" route="/admin/productos" />
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

  private location = inject(Location);
  private router = inject(Router);

  goBack(): void {
    const routeTo = this.route();
    if (routeTo) {
      this.router.navigateByUrl(routeTo);
    } else {
      this.location.back();
    }
  }
}
