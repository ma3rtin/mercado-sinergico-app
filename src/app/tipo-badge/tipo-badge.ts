import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TipoPaquete } from '@app/models/Enums';
import { IconComponent } from '@app/shared/icono/icono';
import { NgIconComponent } from '@ng-icons/core';



// Computed:

/**
 * Badge visual para el tipo de producto/paquete.
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
  imports: [CommonModule, IconComponent, NgIconComponent],
template: `
@if (tipoNormalizado()) {
  @if (mode() === 'icon') {
    <span [class]="circleClasses()" [attr.title]="label()" [attr.aria-label]="label()">
      <app-icon [name]="iconName()" size="14" />
    </span>
  } @else {
    <span [class]="pillClasses()">
      <ng-icon [name]="ngIconName()" size="14" [class]="iconClasses()" />
      <span class="text-xs font-semibold tracking-wide">{{ label() }}</span>
    </span>
  }
}
`,
})
export class TipoBadgeComponent {
  tipo = input<string | TipoPaquete | null | undefined>(undefined);
  mode = input<'icon' | 'full'>('full');
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
  const base = 'inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 shadow-sm backdrop-blur-sm bg-white';
  if (this.tipoNormalizado() === 'SINERGICO') {
    return `${base} border-brand-primary text-brand-primary`;
  }
  return `${base} border-secondary-dark text-secondary-dark`;
});
}