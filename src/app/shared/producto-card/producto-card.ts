import {
  Component,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Interfaces
import { Producto } from '@app/models/ProductosInterfaces/Producto';

// Components
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '../icono/icono';

/**
 * Contexto de uso del ProductoCard
 * Define el comportamiento y texto del botón CTA
 */
export type ProductoCardContexto = 
  | 'productos'           // Vista de todos los productos
  | 'paquete-detalle'     // Productos dentro de un paquete específico
  | 'seleccion';          // Selección de productos para armar paquete

/**
 * Tipo de navegación esperada
 */
export type ProductoCardNavegacion = 
  | 'detalle-seleccion'        // Va a /detalleSeleccionProducto/:id (usuario elige paquete)
  | 'detalle-sumarse';         // Va a /detalleProductoSumarse/:productoId/:paqueteId (usuario se suma)

/**
 * Configuración de descuento para el producto
 */
export interface DescuentoProducto {
  porcentaje: number;       // % de descuento (ej: 15)
  aplicado: boolean;        // Si ya está aplicado al precio mostrado
  nombrePaquete?: string;   // Nombre del paquete que da el descuento
}

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent],
  templateUrl: './producto-card.html',
})
export class ProductoCard {
  
  // 🎯 INPUTS (Signal Inputs)
  producto = input.required<Producto>();
  contexto = input<ProductoCardContexto>('productos');
  descuento = input<DescuentoProducto | null>(null);
  mostrarDescripcion = input<boolean>(true);
  longitudMaximaDescripcion = input<number>(120);
  tipoPaquete = input<string | null>(null);
  paqueteId = input<number | null>(null);
  navegacion = input<ProductoCardNavegacion>('detalle-seleccion'); // ✅ NUEVO
  
  // 📤 OUTPUTS
  cardClick = output<number>();
  
  // 📊 COMPUTED PROPERTIES
  
  // Precio formateado
  precioBase = computed(() => {
    const precio = this.producto().precio;
    return this.formatearPrecio(precio);
  });
  
  // Precio con descuento
  precioConDescuento = computed(() => {
    const desc = this.descuento();
    if (!desc || desc.aplicado) return null;
    
    const precio = this.producto().precio;
    const descuentoMonto = precio * (desc.porcentaje / 100);
    const precioFinal = precio - descuentoMonto;
    
    return this.formatearPrecio(precioFinal);
  });
  
  // Tiene descuento activo
  tieneDescuento = computed(() => {
    const desc = this.descuento();
    return desc !== null && desc.porcentaje > 0;
  });
  
  // Descripción truncada
  descripcionTruncada = computed(() => {
    const producto = this.producto();
    if (!producto.descripcion || !this.mostrarDescripcion()) return '';
    
    const maxLength = this.longitudMaximaDescripcion();
    if (producto.descripcion.length <= maxLength) {
      return producto.descripcion;
    }
    
    return producto.descripcion.substring(0, maxLength) + '...';
  });
  
  // Nombre de la categoría
  categoriaNombre = computed(() => {
    return this.producto().categoria?.nombre || 'Sin categoría';
  });
  
  // Nombre de la marca
  marcaNombre = computed(() => {
    return this.producto().marca?.nombre || 'Sin marca';
  });
  
  // Imagen URL con fallback
  imagenUrl = computed(() => {
    return this.producto().imagen_url || '/assets/images/placeholder-product.png';
  });
  
  // Texto del botón según contexto
  textoBoton = computed(() => {
    const ctx = this.contexto();
    
    const textos: Record<ProductoCardContexto, string> = {
      'productos': 'Ver paquetes',
      'paquete-detalle': 'Ver detalles',
      'seleccion': 'Seleccionar',
    };
    
    return textos[ctx] || 'Ver más';
  });
  
  // Tiene stock disponible
  tieneStock = computed(() => {
    const stock = this.producto().stock;
    return stock === null || stock === undefined || stock > 0;
  });

  // 🚀 COMPUTED: ¿DEBE MOSTRAR STOCK?
  debeMostrarStock = computed(() => {
    const tipo = this.tipoPaquete();
    const stock = this.producto().stock;

    if (!tipo) {
      return stock !== null && stock !== undefined;
    }

    if (tipo === 'SINERGICO') {
      return false;
    }

    if (tipo === 'ENERGICO') {
      return stock !== null && stock !== undefined;
    }

    return stock !== null && stock !== undefined;
  });
  
  constructor(private router: Router) {}
  
  // 🎯 MÉTODOS
  
  // Manejar click en la card
  onCardClick(): void {
    const productoId = this.producto().id_producto;
    if (!productoId) {
      console.warn('⚠️ Producto sin ID');
      return;
    }
    
    this.cardClick.emit(productoId);
    
    const nav = this.navegacion();
    
    // ✅ TIPO 1: Ir a detalle-seleccion (usuario elige paquete)
    if (nav === 'detalle-seleccion') {
      this.router.navigate(['/detalleSeleccionProducto', productoId]);
    }
    // ✅ TIPO 2: Ir a detalle-sumarse (usuario se suma a paquete)
    else if (nav === 'detalle-sumarse') {
      const paqId = this.paqueteId();
      if (!paqId) {
        console.warn('⚠️ PaqueteId requerido para detalle-sumarse');
        return;
      }
      this.router.navigate(['/detalleProductoSumarse', productoId, paqId]);
    }
  }
  
  // Formatear precio
  private formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio);
  }
  
  // Manejar error de imagen
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (!target.src.includes('placeholder')) {
      target.src = '/assets/images/placeholder-product.png';
    }
  }
  
  // Obtener clase de stock
  getStockClass(): string {
    const stock = this.producto().stock;
    
    if (stock === null || stock === undefined) {
      return 'text-gray-500';
    }
    
    if (stock === 0) {
      return 'text-red-600';
    }
    
    if (stock < 10) {
      return 'text-yellow-600';
    }
    
    return 'text-green-600';
  }
  
  // Obtener texto de stock
  getStockTexto(): string {
    const stock = this.producto().stock;
    
    if (stock === null || stock === undefined) {
      return 'Stock ilimitado';
    }
    
    if (stock === 0) {
      return 'Sin stock';
    }
    
    if (stock < 10) {
      return `¡Últimas ${stock} unidades!`;
    }

    return `${stock} disponibles`;
  }
}