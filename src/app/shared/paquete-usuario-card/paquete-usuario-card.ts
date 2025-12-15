import { Component, Input, Output, EventEmitter, signal, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { TipoPaquete } from '@app/models/Enums';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

@Component({
  selector: 'app-paquete-usuario-card',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './paquete-usuario-card.html',
})
export class PaqueteUsuarioCardComponent implements OnInit {

  @Input() pedido!: any;

  @Input() marcas: any[] = [];
  @Input() categorias: any[] = [];

  @Output() toggleExpansion = new EventEmitter<void>();
  @Output() aumentarCantidad = new EventEmitter<any>();
  @Output() disminuirCantidad = new EventEmitter<any>();
  @Output() eliminarProducto = new EventEmitter<any>();
  @Output() salirDelPaquete = new EventEmitter<void>();
  @Output() finalizarCompra = new EventEmitter<void>();
  @Output() imageError = new EventEmitter<Event>();

  public readonly TipoPaquete = TipoPaquete;
  isActualizando = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  private readonly router = inject(Router);

  get paquete() {
    return this.pedido.paquetePublicado;
  }

  get productosEnPedido() {
    return this.pedido.productosSeleccionados;
  }

  ngOnInit(): void {
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

    this.router.navigate(['/productos-del-paquete', idPaquete]);
  }

  getTipoPaqueteIcono(tipo?: string | TipoPaquete) {
    if (!tipo) tipo = this.paquete?.tipoPaquete;

    const t = String(tipo).toLowerCase();

    if (t.includes('sin')) return TipoPaquete.SINERGICO;
    if (t.includes('ener')) return TipoPaquete.ENERGICO;

    return TipoPaquete.POR_DEFINIR;
  }

  obtenerTextoTipo(tipo?: string | TipoPaquete): string {
    if (!tipo) tipo = this.paquete?.tipoPaquete;

    const t = String(tipo).toLowerCase();

    if (t.includes('sin')) return 'Sinérgico';
    if (t.includes('ener')) return 'Energético';

    return 'Por definir';
  }

  get puedeEditarCantidades(): boolean {
    const estado = this.pedido?.estado?.nombre?.toLowerCase();
    return estado === 'pendiente';
  }

  getEstadoClass(estado?: string): string {
    if (!estado) return 'text-gray-600 bg-gray-100 border-gray-200';
    const e = estado.toLowerCase();

    const estilos = {
      'confirmado': 'text-blue-700 bg-blue-50 border-blue-200',
      'pendiente': 'text-yellow-700 bg-yellow-50 border-yellow-200',
      'pagado': 'text-green-700 bg-green-50 border-green-200',
      'enviado': 'text-purple-700 bg-purple-50 border-purple-200',
      'activo': 'text-green-700 bg-green-50 border-green-200'
    };

    return Object.entries(estilos).find(([k]) => e.includes(k))?.[1]
      ?? 'text-gray-700 bg-gray-50 border-gray-200';
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
    this.toggleExpansion.emit();
  }

  onAumentarCantidad(prod: any): void {
    if (!this.puedeEditarCantidades) return;

    const limpio = {
      ...prod,
      id_producto: prod.productoId ?? prod.id_producto
    };

    this.aumentarCantidad.emit(limpio);
  }

  onDisminuirCantidad(prod: any): void {
    if (!this.puedeEditarCantidades) return;

    const limpio = {
      ...prod,
      id_producto: prod.productoId ?? prod.id_producto
    };

    this.disminuirCantidad.emit(limpio);
  }

  get puedeSalirDelPaquete(): boolean {
    const estado = this.pedido?.estado?.nombre?.toLowerCase();
    return estado === 'pendiente'
      || estado === 'confirmado'
      || estado === 'pagado';
  }

  onSalirDelPaquete(): void {
    this.salirDelPaquete.emit();
  }

  onFinalizarCompra(): void {
    this.finalizarCompra.emit();
  }

  onEliminarProducto(prod: any): void {
    this.eliminarProducto.emit({
      id_producto: prod.productoId ?? prod.id_producto
    });
  }

  onImageError(ev: Event): void {
    this.imageError.emit(ev);
  }
}
