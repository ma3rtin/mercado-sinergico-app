import { Component, input, output, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@app/shared/icono/icono';

/**
 * Variantes de botón
 */
export type ButtonVariant =
  | 'primary'      // Amarillo - acción principal
  | 'secondary' | 'tertiary' | 'warning' | 'danger' | 'success' | 'info' | 'ghost';       // Otros

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
  host: {
    '[class.w-full]': 'fullWidth()',
    '[class.h-full]': 'hFull()',
    'class': 'block'
  }
})
export class ButtonComponent {

  // 🎯 INPUTS (Signal inputs - Angular 17+)
  variant = input<ButtonVariant>('primary');
  type = input<'button' | 'submit' | 'reset'>('button');
  size = input<ButtonSize>('md');
  shape = input<ButtonShape>('rounded');
  width = input<ButtonWidth>('auto');
  direction = input<'row' | 'column'>('row');
  hFull = input<boolean>(false);

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

    // Variantes (Adaptadas usando variables CSS conectadas con styles.css)
    const variants: Record<ButtonVariant, string> = {
      'primary': 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] active:bg-[var(--btn-primary-active)] focus:ring-2 focus:ring-[var(--btn-primary-ring)] shadow-md hover:shadow-lg active:shadow-sm font-semibold',
      'secondary': 'bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-hover)] active:bg-[var(--btn-secondary-active)] focus:ring-2 focus:ring-[var(--btn-secondary-ring)] shadow-md hover:shadow-lg active:shadow-sm',
      'tertiary': 'bg-[var(--btn-tertiary-bg)] border-2 border-[var(--btn-tertiary-border)] text-[var(--btn-tertiary-text)] hover:bg-[var(--btn-tertiary-hover)] active:bg-[var(--btn-tertiary-active)] focus:ring-2 focus:ring-[var(--btn-tertiary-ring)]',
      'warning': 'bg-[var(--btn-warning-bg)] border-2 border-[var(--btn-warning-border)] text-[var(--btn-warning-text)] hover:bg-[var(--btn-warning-hover)] active:bg-[var(--btn-warning-active)] focus:ring-2 focus:ring-[var(--btn-warning-ring)]',
      'danger': 'bg-[var(--btn-danger-bg)] text-[var(--btn-danger-text)] hover:bg-[var(--btn-danger-hover)] active:bg-[var(--btn-danger-active)] focus:ring-2 focus:ring-[var(--btn-danger-ring)] shadow-md hover:shadow-lg active:shadow-sm',
      'success': 'bg-[var(--btn-success-bg)] text-[var(--btn-success-text)] hover:bg-[var(--btn-success-hover)] active:bg-[var(--btn-success-active)] focus:ring-2 focus:ring-[var(--btn-success-ring)] shadow-md hover:shadow-lg active:shadow-sm',
      'info': 'bg-[var(--btn-info-bg)] text-[var(--btn-info-text)] hover:bg-[var(--btn-info-hover)] active:bg-[var(--btn-info-active)] focus:ring-2 focus:ring-[var(--btn-info-ring)] shadow-md hover:shadow-lg active:shadow-sm',
      'ghost': 'bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] hover:bg-[var(--btn-ghost-hover)] active:bg-[var(--btn-ghost-active)] focus:ring-2 focus:ring-[var(--btn-ghost-ring)]',
    };

    // Estado disabled
    const disabledClasses = this.disabled()
      ? 'opacity-50 cursor-not-allowed pointer-events-none'
      : '';

    // Estado selected
    const selectedClasses = this.selected()
      ? 'ring-2 ring-offset-2 ring-blue-600 bg-blue-50'
      : '';

    // Full width y height
    const fullWidthClass = this.fullWidth() ? 'w-full' : '';
    const hFullClass = this.hFull() ? 'h-full' : '';

    // Uppercase
    const uppercaseClass = this.uppercase() ? 'uppercase tracking-wider' : '';

    const sizeClass = sizes[this.size()];
    const shapeClass = shapes[this.shape()];
    const widthClass = widths[this.width()];
    const variantClass = variants[this.variant()];

    return `${base} ${sizeClass} ${shapeClass} ${widthClass} ${variantClass} ${disabledClasses} ${selectedClasses} ${fullWidthClass} ${hFullClass} ${uppercaseClass}`.trim();
  });

  // 🎨 COMPUTED: Clases del icono
  iconClasses = computed(() => {
    if (this.direction() === 'column') return 'w-8 h-8 flex-shrink-0';

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
    if (this.direction() === 'column') return 'gap-2';

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
