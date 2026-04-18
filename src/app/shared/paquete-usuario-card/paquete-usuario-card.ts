import { Component, Input, Output, EventEmitter, signal, OnInit, DestroyRef, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';
import { TipoPaquete } from '@app/models/Enums';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ProductoEnPedido } from '@app/models/PedidosInterfaces/ProductoEnPedido';

@Component({
  selector: 'app-paquete-usuario-card',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent],
  templateUrl: './paquete-usuario-card.html',
})
export class PaqueteUsuarioCardComponent implements OnInit {

  @Input() pedido!: any;

  @Input() marcas: any[] = [];
  @Input() categorias: any[] = [];

  @Output() toggleExpansion = new EventEmitter<void>();
  @Output() aumentarCantidad = new EventEmitter<any>();
  @Output() disminuirCantidad = new EventEmitter<any>();
  @Output() setCantidadManual = new EventEmitter<any>();
  @Output() eliminarProducto = new EventEmitter<ProductoEnPedido>();
  @Output() salirDelPaquete = new EventEmitter<void>();
  @Output() finalizarCompra = new EventEmitter<void>();
  @Output() solicitarReembolso = new EventEmitter<void>();
  @Output() imageError = new EventEmitter<Event>();

  public readonly TipoPaquete = TipoPaquete;
  isActualizando = signal(false);
  isMobile = signal(window.innerWidth < 768);
  isModalOpen = signal(false);

  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(window.innerWidth < 768);
  }

  private readonly destroyRef = inject(DestroyRef);

  private readonly router = inject(Router);

  get paquete() {
    return this.pedido.paquetePublicado;
  }

  get productosEnPedido() {
    return this.pedido.productosSeleccionados;
  }

  ngOnInit(): void {
    console.log('PAQUETE COMPLETO:', this.paquete);

    interval(60000) // cada 1 minuto
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // forzamos reevaluación del getter
      });
  }

  getMarcaNombre(): string {
    return this.paquete?.paqueteBase?.marca?.nombre ?? 'Desconocida';
  }

  getCategoriaNombre(): string {
    return this.paquete?.paqueteBase?.categoria?.nombre ?? 'Desconocida';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  }

  get porcentajeReservado(): number {
    const total = this.paquete?.cant_productos ?? 0;
    const reservados = this.paquete?.cant_productos_reservados ?? 0;
    if (total === 0) return 0;
    return Math.round((reservados / total) * 100);
  }

  get cantidadProductosUsuario(): number {
    if (!this.productosEnPedido?.length) return 0;

    return this.productosEnPedido.reduce(
      (total: number, p: any) => total + (p.cantidad ?? 0),
      0
    );
  }

  get tiempoRestante(): string {
    if (!this.paquete?.fecha_fin) return '—';

    const ahora = new Date().getTime();
    const fin = new Date(this.paquete.fecha_fin).getTime();

    const diffMs = fin - ahora;

    if (diffMs <= 0) return 'Cerrado';

    const minutos = Math.floor(diffMs / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 0) return `${dias} día${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `${horas} h`;
    return `${minutos} min`;
  }

  verProductosDisponibles(): void {
    const idPaquete = this.paquete?.id_paquete_publicado;

    if (!idPaquete) return;

    console.log('🧭 Navegando a paquete:', idPaquete);

    this.router.navigate(['/paquete', idPaquete, 'productos']);
  }

  getTipoPaqueteIcono(tipo?: string | TipoPaquete) {
    if (!tipo) tipo = this.paquete?.tipo;

    const t = String(tipo).toLowerCase();

    if (t.includes('sin')) return TipoPaquete.SINERGICO;
    if (t.includes('ener')) return TipoPaquete.ENERGICO;

    return TipoPaquete.POR_DEFINIR;
  }

  obtenerTextoTipo(tipo?: string | TipoPaquete): string {
    if (!tipo) tipo = this.paquete?.tipo;

    const t = String(tipo).toLowerCase();

    if (t.includes('sin')) return 'Sinérgico';
    if (t.includes('ener')) return 'Enérgico';

    return 'Por definir';
  }

  get puedeEditarCantidades(): boolean {
    const estado = this.pedido?.estado?.nombre?.toLowerCase();
    return estado === 'pendiente';
  }

  getEstadoClass(estado?: string): string {
    if (!estado) return 'text-status-neutral-text bg-status-neutral-bg border-border-default';
    const e = estado.toLowerCase();

    const estilos: Record<string, string> = {
      'pendiente':      'text-status-pending-text bg-status-pending-bg border-warning',
      'pagado':         'text-status-active-text bg-status-active-bg border-success',
      'reembolsado':    'text-text-secondary bg-status-neutral-bg border-border-default',
      'en preparación': 'text-blue-700 bg-blue-50 border-blue-200',
      'en camino':      'text-purple-700 bg-purple-50 border-purple-200',
      'recibido':       'text-green-700 bg-green-50 border-green-200',
    };

    return Object.entries(estilos).find(([k]) => e === k)?.[1]
      ?? 'text-status-neutral-text bg-status-neutral-bg border-border-default';
  }

  getIconoEstado(estado?: string): string {
    if (!estado) return 'Clock';
    const e = estado.toLowerCase();

    if (e === 'pagado')         return 'CheckCircle';
    if (e === 'en preparación') return 'Package';
    if (e === 'en camino')      return 'Truck';
    if (e === 'recibido')       return 'CheckCircle';
    if (e === 'reembolsado')    return 'RefreshCcw';
    if (e === 'cancelado')      return 'XCircle';

    return 'Clock'; // Pendiente u otros
  }

  obtenerImagenUrl(): string {
    return (
      this.paquete?.imagen_url ||
      this.paquete?.paqueteBase?.imagen_url ||
      '/assets/images/placeholder-product.png'
    );
  }

  get esUrgente(): boolean {
    if (!this.paquete?.fecha_fin) return false;

    const ahora = Date.now();
    const fin = new Date(this.paquete.fecha_fin).getTime();

    const horasRestantes = (fin - ahora) / (1000 * 60 * 60);
    return horasRestantes <= 24;
  }


  onToggleExpansion(): void {
    if (this.isMobile()) {
      this.isModalOpen.set(!this.isModalOpen());
    } else {
      this.toggleExpansion.emit();
    }
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onAumentarCantidad(prod: any): void {
    if (!this.puedeEditarCantidades) return;

    const limpio = {
      ...prod,
      id_producto: prod.productoId ?? prod.id_producto,
      id_detalle: prod.id_detalle ?? prod.id // por si viene directo del backend
    };

    this.aumentarCantidad.emit(limpio);
  }

  onDisminuirCantidad(prod: any): void {
    if (!this.puedeEditarCantidades) return;

    const limpio = {
      ...prod,
      id_producto: prod.productoId ?? prod.id_producto,
      id_detalle: prod.id_detalle ?? prod.id
    };

    this.disminuirCantidad.emit(limpio);
  }

  onCambiarCantidadManual(prod: any, event: Event): void {
    if (!this.puedeEditarCantidades) return;
    const input = event.target as HTMLInputElement;
    let valor = parseInt(input.value, 10);
    
    if (isNaN(valor) || valor < 1) {
      input.value = '1';
      valor = 1;
    }

    const limpio = {
      ...prod,
      id_producto: prod.productoId ?? prod.id_producto,
      id_detalle: prod.id_detalle ?? prod.id,
      nuevaCantidad: valor
    };
    
    this.setCantidadManual.emit(limpio);
  }

  get puedeSalirDelPaquete(): boolean {
    const estado = this.pedido?.estado?.nombre?.toLowerCase();
    return estado === 'pendiente';
  }

  /** El usuario puede solicitar reembolso solo si el pedido está Pagado y el paquete está Activo */
  get puedeReembolsar(): boolean {
    const estadoPedido = this.pedido?.estado?.nombre?.toLowerCase();
    const estadoPaquete = this.paquete?.estado?.nombre?.toLowerCase();
    return estadoPedido === 'pagado' && estadoPaquete === 'activo';
  }

  onSalirDelPaquete(): void {
    this.salirDelPaquete.emit();
  }

  onFinalizarCompra(): void {
    this.finalizarCompra.emit();
  }

  onSolicitarReembolso(): void {
    this.solicitarReembolso.emit();
  }

  onEliminarProducto(prod: ProductoEnPedido): void {
    this.eliminarProducto.emit({
      ...prod,
      id_producto: prod.id_producto ?? prod.id_producto,
      id_detalle: (prod as any).id_detalle ?? (prod as any).id
    } as any);
  }

  formatVariante(variante: any): string {
    if (!variante) return '';
    if (typeof variante === 'string') return variante;

    // Tu caso real
    if (Array.isArray(variante.opciones)) {
      return variante.opciones
        .map((o: any) => {
          const nombreCaracteristica = o.caracteristica?.nombre ?? '';
          const nombreOpcion = o.opcion?.nombre ?? '';
          return `${nombreCaracteristica}: ${nombreOpcion}`;
        })
        .join(', ');
    }

    return '';
  }

  onImageError(ev: Event): void {
    this.imageError.emit(ev);
  }
}
