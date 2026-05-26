import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TipoPaquete } from '@app/models/Enums';
import { InfoTooltipComponent, TooltipPosition } from '@app/shared/info-tooltip/info-tooltip';

@Component({
  selector: 'app-tipo-paquete-badge',
  standalone: true,
  imports: [CommonModule, InfoTooltipComponent],
  templateUrl: './tipo-paquete-badge.html',
})
export class TipoPaqueteBadgeComponent {
  // 🎯 INPUTS
  tipo = input.required<TipoPaquete | undefined | null>();
  position = input<TooltipPosition>('bottom-right');
  iconSize = input<string>('16');

  // 📊 COMPUTED PROPERTIES

  // Safe fallback to POR_DEFINIR
  tipoSafe = computed(() => {
    return this.tipo();
  });

  // Icon name by package type
  iconName = computed(() => {
    const t = this.tipoSafe();
    if (t === TipoPaquete.SINERGICO) return 'users';
    if (t === TipoPaquete.ENERGICO) return 'zap';
    return 'package';
  });

  // Icon styling matching the premium designs in the requested images
  iconClass = computed(() => {
    const t = this.tipoSafe();
    if (t === TipoPaquete.SINERGICO) {
      return 'text-brand-primary border-brand-primary bg-white/95';
    }
    if (t === TipoPaquete.ENERGICO) {
      return 'text-secondary-dark border-secondary-dark bg-white/95';
    }
    return 'text-gray-500 border-gray-400 bg-white/95';
  });

  // Tooltip title
  title = computed(() => {
    const t = this.tipoSafe();
    if (t === TipoPaquete.SINERGICO) return 'Paquete Sinérgico';
    if (t === TipoPaquete.ENERGICO) return 'Paquete Enérgico';
    return 'Paquete Estándar';
  });

  // Tooltip title classes matching high-contrast design
  titleClass = computed(() => {
    const t = this.tipoSafe();
    if (t === TipoPaquete.SINERGICO) return 'text-brand-primary-light';
    if (t === TipoPaquete.ENERGICO) return 'text-amber-400';
    return 'text-gray-400';
  });

  // Tooltip descriptions
  description = computed(() => {
    const t = this.tipoSafe();
    if (t === TipoPaquete.SINERGICO) {
      return 'Comprá en conjunto con otros usuarios para obtener mejores precios por volumen.';
    }
    if (t === TipoPaquete.ENERGICO) {
      return 'Compra rápida individual con beneficios y envío prioritario.';
    }
    return 'Paquete estándar.';
  });
}
