import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TipoPaquete } from '@app/models/Enums';

/**
 * Badge visual para el tipo de producto/paquete.
 *
 * Uso:
 * <app-tipo-badge [tipo]="producto.tipo" />
 * <app-tipo-badge [tipo]="'SINERGICO'" />
 * <app-tipo-badge [tipo]="'ENERGICO'" [size]="'sm'" />
 */
@Component({
  selector: 'app-tipo-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (tipoNormalizado()) {
      <span [class]="badgeClasses()">
        <span [class]="dotClasses()"></span>
        {{ label() }}
      </span>
    }
  `,
})
export class TipoBadgeComponent {
  tipo  = input<string | TipoPaquete | null | undefined>(undefined);
  size  = input<'xs' | 'sm' | 'md'>('sm');

  tipoNormalizado = computed(() => {
    const raw = this.tipo();
    if (!raw) return null;
    const upper = raw.toString().toUpperCase().trim();
    if (upper === 'SINERGICO' || upper === 'SINÉRGICO') return 'SINERGICO';
    if (upper === 'ENERGICO'  || upper === 'ENÉRGICO' || upper === 'ENERGÉTICO') return 'ENERGICO';
    return null;
  });

  label = computed(() =>
    this.tipoNormalizado() === 'SINERGICO' ? 'Sinérgico' : 'Enérgico'
  );

  badgeClasses = computed(() => {
    const tipo = this.tipoNormalizado();
    const sizes: Record<string, string> = {
      xs: 'px-2 py-0.5 text-[10px] gap-1',
      sm: 'px-3 py-1 text-xs gap-1.5',
      md: 'px-3.5 py-1.5 text-sm gap-2',
    };

    const base = `inline-flex items-center font-semibold rounded-full border bg-white ${sizes[this.size()]}`;

    if (tipo === 'SINERGICO') {
      return `${base} text-[#2E608C] border-[#71A8D9]`;
    }
    return `${base} text-[#D28509] border-[#D28509]`;
  });

  dotClasses = computed(() => {
    const tipo = this.tipoNormalizado();
    const sizes: Record<string, string> = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
    };
    const base = `rounded-full flex-shrink-0 ${sizes[this.size()]}`;

    if (tipo === 'SINERGICO') return `${base} bg-[#71A8D9]`;
    return `${base} bg-[#D28509]`;
  });
}