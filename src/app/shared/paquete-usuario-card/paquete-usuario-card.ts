import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { TipoPaquete } from '@app/models/Enums';

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
  @Output() salirDelPaquete = new EventEmitter<void>();
  @Output() finalizarCompra = new EventEmitter<void>();
  @Output() imageError = new EventEmitter<Event>();

  public readonly TipoPaquete = TipoPaquete;
  isActualizando = signal(false);

  get paquete() {
    return this.pedido.paquetePublicado;
  }

  get productosEnPedido() {
    return this.pedido.productosSeleccionados;
  }

  ngOnInit(): void {
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

  esUrgente(): boolean {
    if (!this.paquete?.fecha_fin) return false;
    const hoy = new Date();
    const fin = new Date(this.paquete.fecha_fin);
    return (fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24) <= 2;
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

  onSalirDelPaquete(): void {
    this.salirDelPaquete.emit();
  }

  onFinalizarCompra(): void {
    this.finalizarCompra.emit();
  }

  onImageError(ev: Event): void {
    this.imageError.emit(ev);
  }
}
