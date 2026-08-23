import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TipoPaquete } from '@app/models/Enums';
import { IconComponent } from '@app/shared/icono/icono';
import { NgIconComponent } from '@ng-icons/core';
import { InfoTooltipComponent, TooltipPosition } from '@app/shared/info-tooltip/info-tooltip';

/**
 * Badge visual para el tipo de producto/paquete con tooltip explicativo.
 *
 * Modos:
 *   mode="icon"  → solo círculo con ícono (plegado)
 *   mode="full"  → círculo con ícono + texto (desplegado)
 *
 * Uso:
 *   <app-tipo-badge [tipo]="producto.tipo" />                  <!-- full por defecto -->
 *   <app-tipo-badge [tipo]="producto.tipo" mode="icon" />      <!-- solo ícono -->
 *   <app-tipo-badge [tipo]="paquete.tipo"  mode="full" />      <!-- ícono + texto -->
 */
@Component({
  selector: 'app-tipo-badge',
  standalone: true,
  imports: [CommonModule, IconComponent, NgIconComponent, InfoTooltipComponent],
  template: `
@if (tipoNormalizado()) {
  @if (showTooltip()) {
    <app-info-tooltip
      [customTrigger]="true"
      [tooltipTitle]="tooltipTitle()"
      [titleClass]="titleClass()"
      [description]="description()"
      [position]="position()">
      @if (mode() === 'icon') {
        <span [class]="circleClasses()" [attr.aria-label]="label()">
          <app-icon [name]="iconName()" size="14" />
        </span>
      } @else {
        <span [class]="pillClasses()">
          <ng-icon [name]="ngIconName()" size="14" [class]="iconClasses()" />
          <span class="text-xs font-semibold tracking-wide">{{ label() }}</span>
        </span>
      }
    </app-info-tooltip>
  } @else {
    @if (mode() === 'icon') {
      <span [class]="circleClasses()" [attr.title]="label()" [attr.aria-label]="label()">
        <app-icon [name]="iconName()" size="14" />
      </span>
    } @else {
      <span [class]="pillClasses()" [attr.title]="label()">
        <ng-icon [name]="ngIconName()" size="14" [class]="iconClasses()" />
        <span class="text-xs font-semibold tracking-wide">{{ label() }}</span>
      </span>
    }
  }
}
`,
})
export class TipoBadgeComponent {
  tipo = input<string | TipoPaquete | null | undefined>(undefined);
  mode = input<'icon' | 'full'>('full');
  position = input<TooltipPosition>('bottom-left');
  showTooltip = input<boolean>(true);
  entityType = input<'producto' | 'paquete'>('producto');

  ngIconName = computed(() =>
    this.tipoNormalizado() === 'SINERGICO' ? 'featherUsers' : 'featherZap'
  );

  tipoNormalizado = computed(() => {
    const raw = this.tipo();
    if (!raw) return null;
    const upper = raw.toString().toUpperCase().trim();
    if (upper === 'SINERGICO' || upper === 'SINÉRGICO') return 'SINERGICO';
    if (upper === 'ENERGICO' || upper === 'ENÉRGICO' || upper === 'ENERGÉTICO') return 'ENERGICO';
    return null;
  });

  label = computed(() =>
    this.tipoNormalizado() === 'SINERGICO' ? 'Sinérgico' : 'Enérgico'
  );

  tooltipTitle = computed(() => {
    const t = this.tipoNormalizado();
    const prefix = this.entityType() === 'paquete' ? 'Paquete' : 'Producto';
    if (t === 'SINERGICO') return `${prefix} Sinérgico`;
    if (t === 'ENERGICO') return `${prefix} Enérgico`;
    return 'Estándar';
  });

  titleClass = computed(() => {
    const t = this.tipoNormalizado();
    if (t === 'SINERGICO') return 'text-brand-primary-light font-bold';
    if (t === 'ENERGICO') return 'text-amber-400 font-bold';
    return 'text-gray-400 font-bold';
  });

  description = computed(() => {
    const t = this.tipoNormalizado();
    const isPaquete = this.entityType() === 'paquete';
    if (t === 'SINERGICO') {
      return isPaquete
        ? 'Comprá en conjunto con otros usuarios para obtener mejores precios por volumen.'
        : 'Comprá este producto en conjunto con otros usuarios para obtener precios preferenciales por volumen.';
    }
    if (t === 'ENERGICO') {
      return isPaquete
        ? 'Compra rápida individual con beneficios y envío prioritario.'
        : 'Producto individual con disponibilidad inmediata y envío prioritario.';
    }
    return 'Producto o paquete estándar.';
  });

  iconName = computed(() =>
    this.tipoNormalizado() === 'SINERGICO' ? 'users' : 'zap'
  );

  // Círculo — solo en modo icon
  circleClasses = computed(() => {
    const base = 'w-7 h-7 rounded-full flex items-center justify-center cursor-default border-2 shadow-sm backdrop-blur-sm bg-white flex-shrink-0';
    if (this.tipoNormalizado() === 'SINERGICO') {
      return `${base} text-brand-primary `;
    }
    return `${base} text-secondary-dark `;
  });

  // Ícono simple — solo en modo full (sin círculo)
  iconClasses = computed(() => {
    if (this.tipoNormalizado() === 'SINERGICO') {
      return 'text-brand-primary flex-shrink-0';
    }
    return 'text-secondary-dark flex-shrink-0';
  });

  pillClasses = computed(() => {
    const base = 'inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 shadow-sm backdrop-blur-sm bg-white cursor-default';
    if (this.tipoNormalizado() === 'SINERGICO') {
      return `${base} border-brand-primary text-brand-primary`;
    }
    return `${base} border-secondary-dark text-secondary-dark`;
  });
}