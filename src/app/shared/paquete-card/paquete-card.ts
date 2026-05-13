// ============================================
// PAQUETE CARD COMPONENT - TypeScript
// ============================================
import { Component, Input, OnInit, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { TipoPaquete } from '@app/models/Enums';
import { IconComponent } from '@app/shared/icono/icono';
import { InfoTooltipComponent } from '@app/shared/info-tooltip/info-tooltip';

@Component({
  selector: 'app-paquete-card',
  standalone: true,
  imports: [CommonModule, IconComponent, InfoTooltipComponent],
  templateUrl: './paquete-card.html',
  styleUrl: './paquete-card.css',
})
export class PaqueteCard implements OnInit {
  // 📦 Input: Datos del paquete
  @Input() paquete!: PaquetePublicado;

  // 📤 Output: Emitir click de la card
  @Output() cardClick = new EventEmitter<number>();

  // 📊 Computed
  stockDisponible = computed(() => {
    const total = this.paquete.cant_productos || 0;
    const reservado = this.paquete.cant_productos_reservados || 0;
    return Math.max(0, total - reservado);
  });

  porcentajeReservado = computed(() => {
    const total = this.paquete.cant_productos || 0;
    const reservados = this.paquete.cant_productos_reservados || 0;
    if (total === 0) return 0;
    return (reservados / total) * 100;
  });

  constructor(private router: Router) { }

  ngOnInit(): void {
    if (!this.paquete) {
      console.warn('⚠️ PaqueteCard: paquete no fue proporcionado');
    }
  }

  // 🔗 Click en la card
  onCardClick(): void {
    if (this.paquete?.id_paquete_publicado) {
      this.cardClick.emit(this.paquete.id_paquete_publicado);
    }
  }

  // ──── Helpers de tipo ────

  private isEnergico(): boolean {
    return this.paquete.tipo === TipoPaquete.ENERGICO;
  }

  isSinergico(): boolean {
    return this.paquete.tipo === TipoPaquete.SINERGICO;
  }

  /** Nombre del ícono según el tipo de paquete */
  getTypeIconName(): string {
    if (this.isEnergico()) return 'zap'; // Asumiendo 'zap' (rayo) para Enérgico
    if (this.isSinergico()) return 'users'; // Asumiendo 'users' para Sinérgico
    return 'package';
  }

  /** Colores del ícono circular superior derecho */
  getTypeIconClass(): string {
    if (this.isEnergico()) return 'text-secondary-dark border-secondary-dark';
    if (this.isSinergico()) return 'text-brand-primary border-brand-primary';
    return 'text-gray-500 border-gray-400';
  }

  /** Colores del badge de descuento (Sigue la misma lógica que el icono derecho) */
  getDiscountBadgeClass(): string {
    if (this.isEnergico()) return 'text-secondary-dark border-secondary-dark';
    if (this.isSinergico()) return 'text-brand-primary border-brand-primary';
    return 'text-gray-700 border-gray-400';
  }

  /** Nombre formateado para el tooltip */
  getPackageTypeName(): string {
    return this.isSinergico() ? 'Paquete Sinérgico' : 'Paquete Enérgico';
  }

  /** Descripción para el tooltip */
  getPackageTypeDescription(): string {
    if (this.isSinergico()) return 'Comprá en conjunto con otros usuarios para obtener mejores precios por volumen.';
    if (this.isEnergico()) return 'Compra rápida individual con beneficios y envío prioritario.';
    return 'Paquete estándar.';
  }

  /** Left border color by type */
  getBorderColorClass(): string {
    if (this.isEnergico()) return 'border-l-secondary-dark';
    if (this.isSinergico()) return 'border-l-brand-primary';
    return 'border-l-border-default';
  }

  /** Title hover color by type */
  getTitleHoverClass(): string {
    if (this.isSinergico()) return 'group-hover:text-brand-primary';
    return 'group-hover:text-brand-cta-hover';
  }

  // ──── Footer ────

  /** Footer "Ver detalles" con color de acento */
  getFooterClass(): string {
    if (this.isEnergico()) {
      return 'text-secondary-dark bg-amber-50/60 group-hover:bg-amber-100/80 group-hover:text-amber-900';
    }
    if (this.isSinergico()) {
      return 'text-brand-secondary bg-blue-50/60 group-hover:bg-blue-100/80 group-hover:text-blue-900';
    }
    return 'text-text-secondary bg-bg-app group-hover:bg-bg-raised';
  }

  // ──── Progress bar ────

  /** Texto del porcentaje de progreso */
  getPercentageTextClass(): string {
    const p = this.porcentajeReservado();
    if (p >= 86) return 'text-error';
    if (p >= 61) return 'text-warning';
    if (p >= 31) return 'text-attention-dark';
    return 'text-success';
  }

  /** Color de la barra de progreso */
  obtenerColorBarra(): string {
    const p = this.porcentajeReservado();
    if (p >= 86) return 'bg-error';
    if (p >= 61) return 'bg-warning';
    if (p >= 31) return 'bg-attention';
    return 'bg-success';
  }

  // ──── Timer (urgency-colored) ────

  /** Hours remaining (used for urgency thresholds) */
  getHoursRemaining(): number {
    if (!this.paquete.fecha_fin) return Infinity;
    const fechaStr = this.paquete.fecha_fin.toString();
    const fecha = fechaStr.endsWith('Z') || fechaStr.includes('+')
      ? new Date(fechaStr)
      : new Date(fechaStr + 'Z');
    const diff = fecha.getTime() - Date.now();
    return diff > 0 ? diff / (1000 * 60 * 60) : 0;
  }

  /** Timer text color based on urgency */
  getTimerTextClass(): string {
    const hours = this.getHoursRemaining();
    if (hours <= 0) return 'text-red-800 font-medium';
    if (hours < 24) return 'text-red-800 font-medium';
    if (hours < 48) return 'text-amber-800';
    return 'text-text-muted';
  }

  /** Accessible tooltip for the timer */
  getTimerTooltip(): string {
    const remaining = this.getTiempoRestante(this.paquete.fecha_fin);
    return `Cierra en ${remaining}`;
  }

  /** Tiempo restante formateado */
  getTiempoRestante(fechaFin?: Date): string {
    if (!fechaFin) return 'N/A';

    const fechaStr = fechaFin.toString();
    const fecha = fechaStr.endsWith('Z') || fechaStr.includes('+')
      ? new Date(fechaStr)
      : new Date(fechaStr + 'Z');

    const diferencia = fecha.getTime() - Date.now();
    if (diferencia <= 0) return 'Finalizado';

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dias > 0) return `${dias}d ${horas}h`;
    return `${horas}h`;
  }

  // ──── Image ────

  obtenerImagenUrl(): string {
    return (
      this.paquete.paqueteBase?.imagen_url ??
      '/assets/images/placeholder-product.png'
    );
  }
}
