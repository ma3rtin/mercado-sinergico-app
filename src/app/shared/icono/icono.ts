import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, NgIconsModule } from '@ng-icons/core';
import { IconsService } from '@app/services/iconos/icons.service';

/**
 * Componente wrapper para usar iconos de ngicons de forma simplificada
 *
 * Ejemplo de uso:
 * <app-icon name="search" [size]="'24'" [strokeWidth]="'2'" />
 * <app-icon name="chevronRight" class="text-blue-500" />
 * <app-icon name="user" [size]="'32'" />
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule, NgIconComponent, NgIconsModule],
  template: `
  <ng-icon
    [name]="iconName()"
    [size]="size()"
    [strokeWidth]="strokeWidth()"
    [color]="color()"
    [class]="'flex items-center justify-center ' + cssClass()"
    style="display: inline-flex; line-height: 1;"
  />
`,
})
export class IconComponent {
  // 🎨 INPUTS
  name = input.required<string>();
  size = input<string>('24');
  strokeWidth = input<string>('2');
  cssClass = input<string>('');
  color = input<string>('currentColor');

  // 🔧 Inyectar servicio de iconos
  iconsService = new IconsService();

  // 📌 Computed: nombre del icono con prefijo de feather
  iconName = () => {
    const iconName = this.name();

    // Si ya tiene el prefijo, devolverlo así
    if (iconName.startsWith('feather')) {
      return iconName;
    }

    // Si no, agregamos el prefijo
    return `feather${iconName.charAt(0).toUpperCase()}${iconName.slice(1)}`;
  };
}
