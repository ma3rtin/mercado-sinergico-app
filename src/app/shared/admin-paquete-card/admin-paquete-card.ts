import { Component, Input, Output, EventEmitter, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { EstadoPaqueteNombre } from '@app/models/PaquetesInterfaces/EstadoPaquetePublicado';
import { IconComponent } from '@app/shared/icono/icono';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { ToastService } from '@app/services/toast/toast.service';

@Component({
  selector: 'app-admin-paquete-card',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  templateUrl:'./admin-paquete-card.html',
})
export class AdminPaqueteCard {
  @Input({ required: true }) paquete!: PaquetePublicado;

  // 📤 Outputs para acciones
  @Output() finalize  = new EventEmitter<PaquetePublicado>(); // Activo → En Preparación → Finalizado
  @Output() close     = new EventEmitter<PaquetePublicado>(); // Activo → En Preparación
  @Output() prepare   = new EventEmitter<PaquetePublicado>(); // En Preparación → Finalizado
  @Output() refund    = new EventEmitter<PaquetePublicado>(); // Activo → Cancelado
  @Output() notify    = new EventEmitter<PaquetePublicado>();
  @Output() duplicate = new EventEmitter<PaquetePublicado>();

  private toast = inject(ToastService);

  /** Controla si el menú desplegable está abierto */
  menuAbierto = false;

  /** Cierra el menú al hacer click fuera del componente */
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-menu-container')) {
      this.menuAbierto = false;
    }
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.menuAbierto = !this.menuAbierto;
  }

  // ── Helpers de estado ─────────────────────────────────────────

  get estadoNombre(): string {
    return this.paquete.estado?.nombre?.trim() ?? '';
  }

  get esActivo(): boolean {
    return this.estadoNombre.toLowerCase() === EstadoPaqueteNombre.Activo.toLowerCase();
  }

  get esPendiente(): boolean {
    return this.estadoNombre.toLowerCase() === EstadoPaqueteNombre.Pendiente.toLowerCase();
  }

  get esEnPreparacion(): boolean {
    return this.estadoNombre.toLowerCase() === EstadoPaqueteNombre.EnPreparacion.toLowerCase();
  }

  get esFinalizado(): boolean {
    return this.estadoNombre.toLowerCase() === EstadoPaqueteNombre.Finalizado.toLowerCase();
  }

  get esCancelado(): boolean {
    return this.estadoNombre.toLowerCase() === EstadoPaqueteNombre.Cancelado.toLowerCase();
  }

  // ── Acciones válidas por estado ───────────────────────────────
  /** Notificar a compradores: solo cuando está activo */
  get canNotify(): boolean    { return this.esActivo; }
  /** Cerrar anticipadamente (→ En Preparación): solo desde Activo */
  get canClose(): boolean     { return this.esActivo; }
  /** Cancelar y reembolsar: solo desde Activo */
  get canCancel(): boolean    { return this.esActivo; }
  /** Confirmar despacho (→ Finalizado): solo desde En Preparación */
  get canFinalize(): boolean  { return this.esEnPreparacion; }
  /** Duplicar: desde cualquier estado */
  get canDuplicate(): boolean { return true; }
  /** Si hay al menos una acción posible en el menú */
  get hayAcciones(): boolean  { return this.canNotify || this.canClose || this.canCancel || this.canFinalize || this.canDuplicate; }

  // ── Helpers de UI ─────────────────────────────────────────────

  getDiasRestantes(): number {
    if (!this.paquete.fecha_fin) return 0;
    const diff = new Date(this.paquete.fecha_fin).getTime() - Date.now();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return isNaN(dias) ? 0 : dias;
  }

  getStockPercentage(): number {
    if (!this.paquete?.cant_productos) return 0;
    const pct = ((this.paquete.cant_productos_reservados ?? 0) / this.paquete.cant_productos) * 100;
    return isNaN(pct) ? 0 : Math.min(100, pct);
  }

  getStatusColor(): string {
    const e = this.estadoNombre.toLowerCase();
    if (e === 'activo')           return 'text-status-active-text';
    if (e === 'pendiente')        return 'text-status-pending-text';
    if (e === 'en preparación')   return 'text-status-info-text';
    if (e === 'finalizado')       return 'text-brand-secondary';
    if (e === 'cancelado')        return 'text-error';
    return 'text-text-secondary';
  }

  getStatusBgColor(): string {
    const e = this.estadoNombre.toLowerCase();
    if (e === 'activo')           return 'bg-status-active-bg';
    if (e === 'pendiente')        return 'bg-status-pending-bg';
    if (e === 'en preparación')   return 'bg-status-info-bg';
    if (e === 'finalizado')       return 'bg-status-neutral-bg';
    if (e === 'cancelado')        return 'bg-error-light';
    return 'bg-status-neutral-bg';
  }

  getUrgenciaColor(): string {
    const dias = this.getDiasRestantes();
    if (dias <= 2) return 'text-error';
    if (dias <= 5) return 'text-warning';
    return 'text-text-muted';
  }

  getUrgenciaBg(): string {
    const dias = this.getDiasRestantes();
    if (dias <= 2) return 'bg-error-light';
    if (dias <= 5) return 'bg-warning-light';
    return 'bg-status-neutral-bg';
  }

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // ── Acciones ──────────────────────────────────────────────────

  private cerrarMenu() {
    this.menuAbierto = false;
  }

  onNotify(event?: Event): void {
    event?.stopPropagation();
    this.cerrarMenu();
    this.toast.info('Notificación enviada a los compradores (simulado)', 'Notificación');
    this.notify.emit(this.paquete);
  }

  onClose(event?: Event): void {
    event?.stopPropagation();
    this.cerrarMenu();
    this.close.emit(this.paquete);
  }

  onFinalize(event?: Event): void {
    event?.stopPropagation();
    this.cerrarMenu();
    this.prepare.emit(this.paquete);
  }

  onRefund(event?: Event): void {
    event?.stopPropagation();
    this.cerrarMenu();
    this.refund.emit(this.paquete);
  }

  onDuplicate(event?: Event): void {
    event?.stopPropagation();
    this.cerrarMenu();
    this.duplicate.emit(this.paquete);
  }
}
