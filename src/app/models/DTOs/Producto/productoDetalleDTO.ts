import { Producto } from '@app/models/ProductosInterfaces/Producto';

export interface ProductoDetalleDTO {
  producto: Producto;
  cantPaquetes: number;
}
