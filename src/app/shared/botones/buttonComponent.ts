import { Component, input, output, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@app/shared/icono/icono';

/**
 * Variantes de botón
 */
export type ButtonVariant =
  | 'primary'      // Amarillo - acción principal
  | 'secondary'    | 'tertiary'    | 'warning'      | 'danger'       | 'success'      | 'info'         | 'ghost';       // Otros

/**
 * Tamaños del botón
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Forma del botón
 */
export type ButtonShape = 'rounded' | 'square' | 'circle' | 'pill';

/**
 * Ancho del botón
 */
export type ButtonWidth = 'auto' | 'full' | 'half';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './buttonComponent.html',
})
export class ButtonComponent {

  // 🎯 INPUTS (Signal inputs - Angular 17+)
  variant = input<ButtonVariant>('primary');
  type = input<'button' | 'submit' | 'reset'>('button');
  size = input<ButtonSize>('md');
  shape = input<ButtonShape>('rounded');
  width = input<ButtonWidth>('auto');

  label = input<string | undefined>(undefined);
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  selected = input<boolean>(false);

  // 🎨 Iconos
  iconStart = input<string | undefined>(undefined);     // Icono antes del texto
  iconEnd = input<string | undefined>(undefined);       // Icono después del texto
  iconOnly = input<boolean>(false);                     // Solo icono, sin texto

  // 🎯 Comportamiento
  fullWidth = input<boolean>(false);
  uppercase = input<boolean>(false);

  // 🔔 Badges y notificaciones
  badge = input<number | undefined>(undefined);        // Número en badge
  badgeColor = input<string>('bg-red-500');

  // 🌐 Accesibilidad
  ariaLabel = input<string | undefined>(undefined);
  ariaDescribedBy = input<string | undefined>(undefined);

  // 📤 OUTPUTS
  buttonClick = output<void>();

  // 🎨 COMPUTED: Clases del botón
  buttonClasses = computed(() => {
    const base = 'inline-flex items-center justify-center font-semibold transition-all focus:outline-none cursor-pointer relative overflow-hidden group';

    // Tamaños
    const sizes: Record<ButtonSize, string> = {
      'xs': 'px-2 py-1 text-xs',
      'sm': 'px-3 py-1.5 text-sm',
      'md': 'px-4 py-2 text-base',
      'lg': 'px-6 py-3 text-lg',
      'xl': 'px-8 py-4 text-xl',
      '2xl': 'px-10 py-5 text-2xl',
    };

    // Formas
    const shapes: Record<ButtonShape, string> = {
      'rounded': 'rounded-lg',
      'square': 'rounded-none',
      'circle': 'rounded-full w-10 h-10 p-0',
      'pill': 'rounded-full',
    };

    // Ancho
    const widths: Record<ButtonWidth, string> = {
      'auto': '',
      'full': 'w-full',
      'half': 'w-1/2',
    };

    // Variantes (Adaptadas a tu paleta de colores)
    const variants: Record<ButtonVariant, string> = {
      'primary': 'bg-[#FFD562] text-gray-900 hover:bg-[#FFB800] active:bg-[#FF9D00] focus:ring-2 focus:ring-[#FFE899] shadow-md hover:shadow-lg active:shadow-sm font-semibold',
      'secondary': 'bg-[#71A8D9] text-white hover:bg-[#4b87bd] active:bg-[#2E608C] focus:ring-2 focus:ring-[#A8C5E0] shadow-md hover:shadow-lg active:shadow-sm',
      'tertiary': 'border-2 border-[#2E608C] text-[#2E608C] hover:bg-[#E6F0F8] active:bg-[#D9E9F6] focus:ring-2 focus:ring-[#71A8D9]',
      'warning': 'border-2 border-[#D28509] text-[#D28509] hover:bg-[#FEF3E6] active:bg-[#FEE5C8] focus:ring-2 focus:ring-[#E6BE6B]',
      'danger': 'bg-[#B92905] text-white hover:bg-[#8A1F03] active:bg-[#6B1702] focus:ring-2 focus:ring-[#D26B47] shadow-md hover:shadow-lg active:shadow-sm',
      'success': 'bg-[#4CAF50] text-white hover:bg-[#2E7D32] active:bg-[#1B5E20] focus:ring-2 focus:ring-[#81C784] shadow-md hover:shadow-lg active:shadow-sm',
      'info': 'bg-[#2E608C] text-white hover:bg-[#1B3A58] active:bg-[#0F2741] focus:ring-2 focus:ring-[#4E7FA8] shadow-md hover:shadow-lg active:shadow-sm',
      'ghost': 'text-[#2E608C] hover:bg-[#D9E9F6] active:bg-[#D9E9F6] focus:ring-2 focus:ring-[#71A8D9]',
    };

    // Estado disabled
    const disabledClasses = this.disabled()
      ? 'opacity-50 cursor-not-allowed pointer-events-none'
      : '';

    // Estado selected
    const selectedClasses = this.selected()
      ? 'ring-2 ring-offset-2 ring-blue-600 bg-blue-50'
      : '';

    // Full width
    const fullWidthClass = this.fullWidth() ? 'w-full' : '';

    // Uppercase
    const uppercaseClass = this.uppercase() ? 'uppercase tracking-wider' : '';

    const sizeClass = sizes[this.size()];
    const shapeClass = shapes[this.shape()];
    const widthClass = widths[this.width()];
    const variantClass = variants[this.variant()];

    return `${base} ${sizeClass} ${shapeClass} ${widthClass} ${variantClass} ${disabledClasses} ${selectedClasses} ${fullWidthClass} ${uppercaseClass}`.trim();
  });

  // 🎨 COMPUTED: Clases del icono
  iconClasses = computed(() => {
    const sizeMap: Record<ButtonSize, string> = {
      'xs': 'w-3 h-3',
      'sm': 'w-4 h-4',
      'md': 'w-5 h-5',
      'lg': 'w-6 h-6',
      'xl': 'w-7 h-7',
      '2xl': 'w-8 h-8',
    };

    return `${sizeMap[this.size()]} flex-shrink-0`;
  });

  // 🎨 COMPUTED: Espaciador entre icono y texto
  spacerClasses = computed(() => {
    const spacings: Record<ButtonSize, string> = {
      'xs': 'gap-1',
      'sm': 'gap-1.5',
      'md': 'gap-2',
      'lg': 'gap-2.5',
      'xl': 'gap-3',
      '2xl': 'gap-4',
    };

    return spacings[this.size()];
  });

  // 🎯 MÉTODOS

  onButtonClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.buttonClick.emit();
    }
  }

  // 🎨 Helper para accesibilidad
  getAriaLabel(): string {
    if (this.ariaLabel()) {
      return this.ariaLabel()!;
    }
    if (this.label()) {
      return this.label()!;
    }
    return 'Button';
  }

  // 🔢 Helper para badge
  shouldShowBadge = computed(() => {
    return this.badge() !== undefined && this.badge() !== null;
  });

  // 📊 Helper para loading spinner
  shouldShowLoadingSpinner = computed(() => {
    return this.loading() && !this.iconOnly();
  });

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}
