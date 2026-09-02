import {
  Component,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { getProductSlugUrl } from '@app/shared/utils/obfuscator';

// Interfaces
import { Producto } from '@app/models/ProductosInterfaces/Producto';

// Components
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '../icono/icono';
import { TipoBadgeComponent } from '@app/tipo-badge/tipo-badge';
import { InfoTooltipComponent } from '@app/shared/info-tooltip/info-tooltip';

/**
 * Contexto de uso del ProductoCard
 * Define el comportamiento y texto del botón CTA
 */
export type ProductoCardContexto =
  | 'productos'           // Vista de todos los productos
  | 'paquete-detalle'     // Productos dentro de un paquete específico
  | 'seleccion'          // Selección de productos para armar paquete

/**
 * Tipo de navegación esperada
 */
export type ProductoCardNavegacion =
  | 'detalle-seleccion'        // Va a /producto/:id (usuario elige paquete)
  | 'detalle-sumarse';         // Va a /paquete/:paqueteId/producto/:productoId (usuario se suma)

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
  imports: [CommonModule, ButtonComponent, IconComponent, TipoBadgeComponent, InfoTooltipComponent],
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
  paqueteId = input<number | string | null>(null);
  navegacion = input<ProductoCardNavegacion>('detalle-seleccion');
  tipoProducto = input<string | null>(null);

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

  // 🆕 CORREGIDO: Nombre de la categoría (maneja string u objeto)
  categoriaNombre = computed(() => {
    const categoria = this.producto().categoria;
    return typeof categoria === 'string'
      ? categoria
      : categoria?.nombre ?? 'Sin categoría';
  });

  // 🆕 CORREGIDO: Nombre de la marca (maneja string u objeto)
  marcaNombre = computed(() => {
    const marca = this.producto().marca;
    return typeof marca === 'string'
      ? marca
      : marca?.nombre ?? 'Sin marca';
  });

  // Imagen URL con fallback
imagenUrl = computed(() => {
  const producto = this.producto();

  // Log para ver qué devuelve el backend
  console.log('🖼️ Imagen del producto:', {
    imagen_url: producto.imagen_url,
    imagenes: producto.imagenes
  });

  // Prioridad 1: imagen_url
  if (producto.imagen_url) return producto.imagen_url;

  // Prioridad 2: primer elemento de imagenes[]
  if (producto.imagenes?.length > 0) {
    return producto.imagenes[0].url;
  }

  // Fallback
  return '/assets/images/placeholder-product.png';
});


  // Texto del botón según contexto
  textoBoton = computed(() => {
    const ctx = this.contexto();

    if (ctx === 'productos' && this.sinPaquetes()) {
      return 'Próximamente disponible';
    }

    const textos: Record<ProductoCardContexto, string> = {
      'productos': 'Ver paquetes',
      'paquete-detalle': 'Ver detalles',
      'seleccion': 'Seleccionar',
    };

    return textos[ctx] || 'Ver más';
  });

  // Sin paquetes activos (solo aplica a la vista general de productos)
  sinPaquetes = computed(() => {
    return this.contexto() === 'productos' && (this.producto()?.cantPaquetes ?? 0) === 0;
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

    // Producto sin paquetes activos: no hay detalle accionable, no navegar.
    // (El detalle /producto/:slug sigue manejando el caso vacío por otras vías.)
    if (this.sinPaquetes()) {
      return;
    }

    const nav = this.navegacion();

    // ✅ TIPO 1: Ir a detalle-seleccion (usuario elige paquete)
    if (nav === 'detalle-seleccion') {
      const slugUrl = getProductSlugUrl(this.producto());
      console.log('🧭 Navegando a detalle-seleccion:', slugUrl);
      this.router.navigate(['/producto', slugUrl]);
    }
    // ✅ TIPO 2: Ir a detalle-sumarse (usuario se suma a paquete)
    else if (nav === 'detalle-sumarse') {
      const paqId = this.paqueteId();
      if (!paqId) {
        console.warn('⚠️ PaqueteId requerido para detalle-sumarse');
        return;
      }
      const slugProducto = getProductSlugUrl(this.producto());
      console.log('🧭 Navegando a detalle-sumarse:', {
        paqueteId: paqId,
        productoId: productoId,
        url: `/paquete/${paqId}/producto/${slugProducto}`
      });
      this.router.navigate(['/paquete', paqId, 'producto', slugProducto]);
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
      return 'text-error';
    }

    if (stock < 10) {
      return 'text-warning';
    }

    return 'text-success';
  }

  // Obtener texto de stock
  getStockTexto(): string {
    const stock = this.producto().stock;

    if (stock === null || stock === undefined) {
      return 'Disponibilidad flexible';
    }

    if (stock === 0) {
      return 'Agotado';
    }

    if (stock < 10) {
      return `Pocas unidades (${stock})`;
    }

    return 'Disponible';
  }
}
