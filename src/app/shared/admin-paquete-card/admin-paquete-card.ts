import { Component, Input, Output, EventEmitter, inject, HostListener, OnInit, OnDestroy, signal } from '@angular/core';
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
export class AdminPaqueteCard implements OnInit, OnDestroy {
  @Input({ required: true }) paquete!: PaquetePublicado;

  // 📤 Outputs para acciones
  @Output() confirm    = new EventEmitter<PaquetePublicado>(); // Completo → Confirmado
  @Output() refund     = new EventEmitter<PaquetePublicado>(); // Activo/Completo → Cancelado
  @Output() notify     = new EventEmitter<PaquetePublicado>(); // Notificar compradores
  @Output() duplicate  = new EventEmitter<PaquetePublicado>(); // Duplicar
  @Output() viewDetail = new EventEmitter<PaquetePublicado>(); // Ver detalle

  private toast = inject(ToastService);

  /** Controla si el menú desplegable está abierto */
  menuAbierto = false;

  /** Señal para el tiempo restante formateado (ej: 2d 14h 30m 10s) */
  tiempoRestante = signal<string>('');

  /** Intervalo para actualizar el contador real-time */
  private timerInterval: any;

  ngOnInit() {
    this.actualizarContador();
    if (this.esActivo) {
      if (this.tiempoRestante() !== 'Vencido') {
        this.timerInterval = setInterval(() => this.actualizarContador(), 1000);
      }
    }
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

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

  // ── Helpers de estado ──────────────────────────────────────────

  get estadoNombre(): string {
    return this.paquete.estado?.nombre?.trim() ?? '';
  }

  get esActivo(): boolean {
    return this.estadoNombre.toLowerCase() === EstadoPaqueteNombre.Activo.toLowerCase();
  }

  get esCompleto(): boolean {
    return this.estadoNombre.toLowerCase() === EstadoPaqueteNombre.Completo.toLowerCase();
  }

  get esConfirmado(): boolean {
    return this.estadoNombre.toLowerCase() === EstadoPaqueteNombre.Confirmado.toLowerCase();
  }

  get esEntregado(): boolean {
    return this.estadoNombre.toLowerCase() === EstadoPaqueteNombre.Entregado.toLowerCase();
  }

  get esCancelado(): boolean {
    return this.estadoNombre.toLowerCase() === EstadoPaqueteNombre.Cancelado.toLowerCase();
  }

  // ── Acciones válidas por estado ────────────────────────────────
  /** Notificar a compradores: solo cuando está activo */
  get canNotify(): boolean    { return this.esActivo; }
  /** Confirmar con fabricante: desde Completo */
  get canConfirm(): boolean   { return this.esCompleto; }
  /** Cancelar y reembolsar: desde Activo o Completo */
  get canCancel(): boolean    { return this.esActivo || this.esCompleto; }
  /** Duplicar: desde cualquier estado */
  get canDuplicate(): boolean { return true; }
  /** Si hay al menos una acción posible en el menú */
  get hayAcciones(): boolean  { return this.canNotify || this.canConfirm || this.canCancel || this.canDuplicate; }

  // ── Helpers de UI ──────────────────────────────────────────────

  getDiasRestantes(): number {
    if (!this.paquete.fecha_fin) return 0;
    const diff = new Date(this.paquete.fecha_fin).getTime() - Date.now();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return isNaN(dias) ? 0 : dias;
  }

  actualizarContador(): void {
    if (!this.paquete.fecha_fin) {
      this.tiempoRestante.set('N/A');
      return;
    }
    const diff = new Date(this.paquete.fecha_fin).getTime() - Date.now();

    if (diff <= 0) {
      this.tiempoRestante.set('Vencido');
      if (this.timerInterval) clearInterval(this.timerInterval);
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    let format = '';
    if (d > 0) format += `${d}d `;
    if (h > 0 || d > 0) format += `${h}h `;
    if (m > 0 || h > 0 || d > 0) format += `${m}m `;
    format += `${s}s`;

    this.tiempoRestante.set(format.trim());
  }

  getStockPercentage(): number {
    if (!this.paquete?.cant_productos) return 0;
    const pct = ((this.paquete.cant_productos_reservados ?? 0) / this.paquete.cant_productos) * 100;
    return isNaN(pct) ? 0 : Math.min(100, pct);
  }

  getStatusColor(): string {
    const e = this.estadoNombre.toLowerCase();
    if (e === 'activo')     return 'text-status-active-text';
    if (e === 'completo')   return 'text-success';
    if (e === 'confirmado') return 'text-brand-secondary';
    if (e === 'entregado')  return 'text-success';
    if (e === 'cancelado')  return 'text-error';
    return 'text-text-secondary';
  }

  getStatusBgColor(): string {
    const e = this.estadoNombre.toLowerCase();
    if (e === 'activo')     return 'bg-status-active-bg';
    if (e === 'completo')   return 'bg-success-light';
    if (e === 'confirmado') return 'bg-status-neutral-bg';
    if (e === 'entregado')  return 'bg-success-light';
    if (e === 'cancelado')  return 'bg-error-light';
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
    this.notify.emit(this.paquete);
  }

  onConfirm(event?: Event): void {
    event?.stopPropagation();
    this.cerrarMenu();
    this.confirm.emit(this.paquete);
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

  onViewDetail(event?: Event): void {
    event?.stopPropagation();
    this.cerrarMenu();
    this.viewDetail.emit(this.paquete);
  }
}
