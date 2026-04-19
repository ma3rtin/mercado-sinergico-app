import { Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { IconComponent } from '@app/shared/icono/icono';

/**
 * Botón de "Volver" reutilizable para todas las vistas del admin.
 * Usa Location.back() para navegar a la vista anterior sin necesidad
 * de conocer la ruta destino.
 *
 * Uso:
 * <app-admin-back-button />
 * <app-admin-back-button label="Volver al listado" />
 */
@Component({
  selector: 'app-admin-back-button',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './admin-back-button.html',
})
export class AdminBackButtonComponent {
  label = input<string>('Volver');

  private location = inject(Location);

  goBack(): void {
    this.location.back();
  }
}
