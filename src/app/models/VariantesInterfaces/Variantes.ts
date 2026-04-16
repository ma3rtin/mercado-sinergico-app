import { TipoPaquete } from '@app/models/Enums';
import { Plantilla } from '@app/models/PlantillaInterfaces/Plantilla';
/**
 * Información básica de un paquete donde está disponible la variante
 */
export interface PaqueteDisponible {
  id: number;
  nombre: string;
}

export interface VarianteOpcion {
  caracteristica: string;
  opcion: string;
  caracteristicaId: number;
  opcionId: number;
}

/**
 * Variante completa de un producto
 */
export interface ProductoVariante {
  id: number;
  sku?: string;
  stockFisico: number | null; // null = sinérgico, número = enérgico
  precioExtra?: number;
  activo: boolean;
  opciones: VarianteOpcion[];
  paquetesActivos?: PaqueteDisponible[];
}

/**
 * Producto con su información básica y tipo
 */
export interface ProductoVarianteInfo {
  id: number;
  nombre: string;
  tipo: TipoPaquete;
  plantilla?: Plantilla;
}

/**
 * Response completo al obtener variantes de un producto
 */
export interface ProductoVariantesResponse {
  producto: ProductoVarianteInfo;
  variantes: ProductoVariante[];
}

/**
 * DTO para generar variantes automáticamente
 */
export interface GenerarVariantesDTO {
  productoId: number;
  opcionesDisponibles: Record<string, number[]>;
}

/**
 * DTO para actualizar stock de una variante individual
 */
export interface ActualizarStockVarianteDTO {
  id: number;
  stockFisico: number;
}

/**
 * DTO para actualizar stock en bulk
 */
export interface ActualizarStockVariantesDTO {
  variantes: ActualizarStockVarianteDTO[];
}

/**
 * DTO para actualizar cualquier campo de una variante
 */
export interface ActualizarVarianteDTO {
  sku?: string;
  stockFisico?: number | null;
  precioExtra?: number;
  activo?: boolean;
}

/**
 * Distribución del stock de una variante
 */
export interface DistribucionStockVariante {
  variante: string;
  stockFisico: number | null;
  paquetesActivos: PaqueteDisponible[];
}

/**
 * Response del stock global de un producto
 */
export interface StockGlobalResponse {
  nombre: string;
  descripcion: string;
  precio: number;
  marca_id: number;
  categoria_id: number;
  stockTotal: number | null; // null si es producto POR_DEFINIR
  distribucion: DistribucionStockVariante[];
}
