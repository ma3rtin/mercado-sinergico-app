import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { TipoPaquete } from '@app/models/Enums';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { PaqueteCard } from '../paquete-card/paquete-card';

interface ProductoEnPedido extends Producto {
  id_producto?: number;
  nombre: string;
  precio: number;
  imagen_url?: string;
  cantidad: number;
  variante?: string;
}

interface PaqueteDelUsuario extends PaquetePublicado {
  expandido?: boolean;
  productosEnPedido?: ProductoEnPedido[];
  precioSubtotal?: number;
  descuentoAplicado?: number;
  precioFinal?: number;
  tiempoRestante?: string;
}

@Component({
  selector: 'app-paquete-usuario-card',
  standalone: true,
  imports: [CommonModule, ButtonComponent, PaqueteCard],
  templateUrl: './paquete-usuario-card.html',
})
export class PaqueteUsuarioCardComponent implements OnInit {
  @Input() paquete!: PaqueteDelUsuario;
  @Input() marcas: any[] = [];
  @Input() categorias: any[] = [];

  // Outputs para acciones
  @Output() toggleExpansion = new EventEmitter<void>();
  @Output() aumentarCantidad = new EventEmitter<ProductoEnPedido>();
  @Output() disminuirCantidad = new EventEmitter<ProductoEnPedido>();
  @Output() actualizarPedido = new EventEmitter<void>();
  @Output() salirDelPaquete = new EventEmitter<void>();
  @Output() imageError = new EventEmitter<Event>();

  public readonly TipoPaquete = TipoPaquete;
  isActualizando = signal(false);

  ngOnInit(): void {
    console.log('📦 PaqueteUsuarioCard inicializado con:', this.paquete?.id_paquete_publicado);
  }

  // Métodos helper
  getMarcaNombre(idMarca: number | undefined): string {
    const marca = this.marcas.find(m => m.id_marca === idMarca);
    return marca ? marca.nombre : 'Desconocida';
  }

  getCategoriaNombre(idCategoria: number | undefined): string {
    const categoria = this.categorias.find(c => c.id_categoria === idCategoria);
    return categoria ? categoria.nombre : 'Desconocida';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  }

  getTipoPaqueteIcono(tipo?: string | TipoPaquete): TipoPaquete | '' {
    if (!tipo) return '';
    const t = String(tipo).toLowerCase();
    if (t.includes('sin')) return TipoPaquete.SINERGICO;
    if (t.includes('ener')) return TipoPaquete.ENERGICO;
    return TipoPaquete.POR_DEFINIR;
  }

  getEstadoClass(estado?: string): string {
    if (!estado) return 'text-gray-600 bg-gray-100 border-gray-200';
    const e = String(estado).toLowerCase();
    const clases: Record<string, string> = {
      'abierto': 'text-green-700 bg-green-50 border-green-200',
      'activo': 'text-green-700 bg-green-50 border-green-200',
      'pendiente': 'text-yellow-700 bg-yellow-50 border-yellow-200',
      'cerrado': 'text-red-700 bg-red-50 border-red-200',
      'finalizado': 'text-red-700 bg-red-50 border-red-200',
      'completo': 'text-blue-700 bg-blue-50 border-blue-200'
    };
    for (const [key, value] of Object.entries(clases)) {
      if (e.includes(key)) return value;
    }
    return 'text-gray-700 bg-gray-50 border-gray-200';
  }

  // Helpers para el card colapsado
  stockDisponible(): number {
    const total = this.paquete.cant_productos || 0;
    const reservado = this.paquete.cant_productos_reservados || 0;
    return Math.max(0, total - reservado);
  }

  porcentajeDisponible(): number {
    const total = this.paquete.cant_productos || 0;
    if (total === 0) return 0;
    return (this.stockDisponible() / total) * 100;
  }

  obtenerColorBarra(): string {
    const porcentaje = this.porcentajeDisponible();
    if (porcentaje > 50) return 'bg-green-500';
    if (porcentaje > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  obtenerImagenUrl(): string {
    return this.paquete.imagen_url || 
           this.paquete.paqueteBase?.imagen_url ||
           '/assets/images/placeholder-product.png';
  }

  esUrgente(): boolean {
    if (!this.paquete.fecha_fin) return false;
    const hoy = new Date();
    const cierre = new Date(this.paquete.fecha_fin);
    const diasDiferencia = (cierre.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    return diasDiferencia <= 2;
  }

  obtenerIconoTipo(): string {
    if (this.paquete.tipoPaquete === TipoPaquete.SINERGICO) return '⚡';
    if (this.paquete.tipoPaquete === TipoPaquete.ENERGICO) return '🔋';
    return '📦';
  }

  obtenerTextoTipo(): string {
    if (this.paquete.tipoPaquete === TipoPaquete.SINERGICO) return 'Sinérgico';
    if (this.paquete.tipoPaquete === TipoPaquete.ENERGICO) return 'Energético';
    return 'Por Definir';
  }

  // Event handlers
  onToggleExpansion(): void {
    this.toggleExpansion.emit();
  }

  onAumentarCantidad(producto: ProductoEnPedido): void {
    this.aumentarCantidad.emit(producto);
  }

  onDisminuirCantidad(producto: ProductoEnPedido): void {
    this.disminuirCantidad.emit(producto);
  }

  onActualizarPedido(): void {
    this.isActualizando.set(true);
    this.actualizarPedido.emit();
    setTimeout(() => this.isActualizando.set(false), 1500);
  }

  onSalirDelPaquete(): void {
    this.salirDelPaquete.emit();
  }

  onImageError(event: Event): void {
    this.imageError.emit(event);
  }
}