// ============================================
// PAQUETE CARD COMPONENT - TypeScript
// ============================================
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { TipoPaquete } from '@app/models/Enums';
import { IconComponent } from '@app/shared/icono/icono';
import { TipoPaqueteBadgeComponent } from '@app/shared/tipo-paquete-badge/tipo-paquete-badge';
import { InfoTooltipComponent } from '@app/shared/info-tooltip/info-tooltip';
import { BarraStock } from '@app/shared/barra-stock/barra-stock';

@Component({
  selector: 'app-paquete-card',
  standalone: true,
  imports: [CommonModule, IconComponent, TipoPaqueteBadgeComponent, InfoTooltipComponent, BarraStock],
  templateUrl: './paquete-card.html',
  styleUrl: './paquete-card.css',
})
export class PaqueteCard implements OnInit {
  // 📦 Input: Datos del paquete
  @Input() paquete!: PaquetePublicado;

  // 📤 Output: Emitir click de la card
  @Output() cardClick = new EventEmitter<number>();

  // Métodos y no computed(): paquete es un @Input comun, no una señal, asi que
  // un computed cachearia el primer valor y nunca se actualizaria al cambiar.
  stockDisponible(): number {
    const total = this.paquete.cant_productos || 0;
    const reservado = this.paquete.cant_productos_reservados || 0;
    return Math.max(0, total - reservado);
  }

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

  isEnergico(): boolean {
    return this.paquete.tipo === TipoPaquete.ENERGICO;
  }

  isSinergico(): boolean {
    return this.paquete.tipo === TipoPaquete.SINERGICO;
  }

  /** Colores del badge de descuento (Sigue la misma lógica que el icono derecho) */
  getDiscountBadgeClass(): string {
    if (this.isEnergico()) return 'text-secondary-dark border-secondary-dark';
    if (this.isSinergico()) return 'text-brand-primary border-brand-primary';
    return 'text-gray-700 border-gray-400';
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

  /**
   * Etiqueta completa del timer. Se arma acá y no en el template porque
   * getTiempoRestante() puede devolver un estado ('Finalizado', 'N/A') en vez
   * de una duración, y anteponerle "Finaliza en" daba "Finaliza en Finalizado".
   */
  getEtiquetaTiempo(): string {
    if (!this.paquete.fecha_fin) return 'Sin fecha de cierre';
    if (this.getHoursRemaining() <= 0) return 'Finalizado';
    return `Finaliza en ${this.getTiempoRestante(this.paquete.fecha_fin)}`;
  }

  /** Accessible tooltip for the timer */
  getTimerTooltip(): string {
    if (!this.paquete.fecha_fin) return 'Este paquete no tiene fecha de cierre';
    if (this.getHoursRemaining() <= 0) return 'Este paquete ya finalizó';
    return `Cierra en ${this.getTiempoRestante(this.paquete.fecha_fin)}`;
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
