import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { IconComponent } from '@app/shared/icono/icono';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { ToastService } from '@app/services/toast/toast.service';

@Component({
  selector: 'app-admin-paquete-card',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  templateUrl: './admin-paquete-card.html',
})
export class AdminPaqueteCard {
  @Input({ required: true }) paquete!: PaquetePublicado;
  
  // 📤 Outputs para acciones
  @Output() finalize = new EventEmitter<PaquetePublicado>();
  @Output() refund = new EventEmitter<PaquetePublicado>();
  @Output() notify = new EventEmitter<PaquetePublicado>();
  @Output() duplicate = new EventEmitter<PaquetePublicado>();

  private toast = inject(ToastService);

  // --- Helpers de UI ---
  
  getDiasRestantes(): number {
    if (!this.paquete.fecha_fin) return 0;
    const hoy = new Date();
    const cierre = new Date(this.paquete.fecha_fin);
    const diff = cierre.getTime() - hoy.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return isNaN(dias) ? 0 : dias;
  }

  getStockPercentage(): number {
    if (!this.paquete?.cant_productos) return 0;
    const porcentaje = ((this.paquete.cant_productos_reservados ?? 0) / this.paquete.cant_productos) * 100;
    return isNaN(porcentaje) ? 0 : porcentaje;
  }

  getStatusColor(): string {
    const estado = this.paquete.estado?.nombre?.toLowerCase() || '';
    if (estado.includes('activo') || estado.includes('abierto')) return 'text-green-600';
    if (estado.includes('próximamente')) return 'text-blue-600';
    if (estado.includes('completo')) return 'text-secondary';
    if (estado.includes('pend')) return 'text-yellow-600';
    if (estado.includes('cerr')) return 'text-red-600';
    return 'text-gray-600';
  }

  getStatusBgColor(): string {
    const estado = this.paquete.estado?.nombre?.toLowerCase() || '';
    if (estado.includes('activo') || estado.includes('abierto')) return 'bg-green-100';
    if (estado.includes('próximamente')) return 'bg-blue-100';
    if (estado.includes('completo')) return 'bg-secondary/10';
    if (estado.includes('pend')) return 'bg-yellow-100';
    if (estado.includes('cerr')) return 'bg-red-100';
    return 'bg-gray-100';
  }

  getUrgenciaColor(): string {
    const dias = this.getDiasRestantes();
    if (dias <= 2) return 'text-red-600';
    if (dias <= 5) return 'text-blue-600';
    return 'text-gray-600';
  }

  getUrgenciaBg(): string {
    const dias = this.getDiasRestantes();
    if (dias <= 2) return 'bg-red-100';
    if (dias <= 5) return 'bg-blue-100';
    return 'bg-gray-100';
  }

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString();
  }

  // --- Acciones ---

  onNotify(event?: Event): void {
    event?.stopPropagation();
    this.toast.info('Notificación enviada a los usuarios (Simulado)', 'Campanita');
    this.notify.emit(this.paquete);
  }

  onFinalize(event?: Event): void {
    event?.stopPropagation();
    this.finalize.emit(this.paquete);
  }

  onRefund(event?: Event): void {
    event?.stopPropagation();
    this.refund.emit(this.paquete);
  }

  onDuplicate(event?: Event): void {
    event?.stopPropagation();
    this.duplicate.emit(this.paquete);
  }
}
