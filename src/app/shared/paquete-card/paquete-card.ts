// ============================================
// PAQUETE CARD COMPONENT - TypeScript
// ============================================
import { Component, Input, OnInit, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { TipoPaquete } from '@app/models/Enums';
import { IconComponent } from '@app/shared/icono/icono';

@Component({
  selector: 'app-paquete-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './paquete-card.html',
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

  porcentajeDisponible = computed(() => {
    const total = this.paquete.cant_productos || 0;
    if (total === 0) return 0;
    return (this.stockDisponible() / total) * 100;
  });

  descuentoCalculado = computed(() => {
    if (this.paquete.tipo === TipoPaquete.ENERGICO) {
      return 8;
    }
    if (this.paquete.tipo === TipoPaquete.SINERGICO) {
      return 3;
    }
    return 0;
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
      // Opcional: navega automáticamente
      // this.router.navigate(['/paquete-detalle', this.paquete.id_paquete_publicado]);
    }
  }

  // 🎨 Métodos helper
  obtenerColorBarra(): string {
    const porcentaje = this.porcentajeReservado();

    if (porcentaje < 50) return 'bg-success';
    if (porcentaje < 80) return 'bg-warning';
    return 'bg-error';
  }

  obtenerBadgeEstado(): { clase: string; emoji: string } {
    const estado = this.paquete.estado?.nombre || '';

    const mapEstados: { [key: string]: { clase: string; emoji: string } } = {
      'Abierto': { clase: 'bg-green-100 text-green-800', emoji: '🟢' },
      'Cerrado': { clase: 'bg-red-100 text-red-800', emoji: '🔴' },
      'Pendiente': { clase: 'bg-yellow-100 text-yellow-800', emoji: '🟡' },
      'Activo': { clase: 'bg-blue-100 text-blue-800', emoji: '✨' },
    };

    return mapEstados[estado] || { clase: 'bg-gray-100 text-gray-800', emoji: '❓' };
  }

  obtenerIconoTipo(): string {
    if (this.paquete.tipo === TipoPaquete.SINERGICO) return '⚡';
    if (this.paquete.tipo === TipoPaquete.ENERGICO) return '🔋';
    return '📦';
  }

  obtenerTextoTipo(): string {
    if (this.paquete.tipo === TipoPaquete.SINERGICO) return 'Sinérgico';
    if (this.paquete.tipo === TipoPaquete.ENERGICO) return 'Energético';
    return 'Por Definir';
  }

  obtenerFechaCierre(): string {
    if (!this.paquete.fecha_fin) return 'N/A';
    const fecha = new Date(this.paquete.fecha_fin);
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  obtenerImagenUrl(): string {
    return (
      this.paquete.paqueteBase?.imagen_url ??
      '/assets/images/placeholder-product.png'
    );
  }

  // 🔴 Urgencia: muestra si falta poco para cerrar
  esUrgente(): boolean {
    if (!this.paquete.fecha_fin) return false;
    const hoy = new Date();
    const cierre = new Date(this.paquete.fecha_fin);
    const diasDiferencia = (cierre.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    return diasDiferencia <= 2;
  }

  // 🟠 Aviso: muestra si falta mediano tiempo para cerrar
  esAviso(): boolean {
    if (!this.paquete.fecha_fin) return false;
    const hoy = new Date();
    const cierre = new Date(this.paquete.fecha_fin);
    const diasDiferencia = (cierre.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    return diasDiferencia > 2 && diasDiferencia <= 4;
  }

  // ⏰ Tiempo restante formateado (ej: "2d 20h")
  getTiempoRestante(fechaFin?: Date): string {
    if (!fechaFin) return 'N/A';
    const ahora = new Date();
    const fecha = new Date(fechaFin);
    const diferencia = fecha.getTime() - ahora.getTime();

    if (diferencia <= 0) return 'Finalizado';

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dias > 0) {
      return `${dias}d ${horas}h`;
    }
    return `${horas}h`;
  }

  // 🎨 Clase CSS para el estado
  getEstadoClass(estado?: string): string {
    if (!estado) return 'bg-status-neutral-bg text-status-neutral-text border-border-default';

    const e = String(estado).toLowerCase();
    if (e.includes('activo') || e.includes('abierto')) {
      return 'bg-status-active-bg text-status-active-text border-success';
    }
    if (e.includes('pend')) {
      return 'bg-status-pending-bg text-status-pending-text border-warning';
    }
    if (e.includes('cerr')) {
      return 'bg-status-closed-bg text-status-closed-text border-error';
    }
    return 'bg-status-neutral-bg text-status-neutral-text border-border-default';
  }
}
