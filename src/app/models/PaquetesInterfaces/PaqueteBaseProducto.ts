import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { PaqueteBase } from '@app/models/PaquetesInterfaces/PaqueteBase';
export interface PaqueteBaseProducto {
    id: number;
    productoId: number;
    paqueteBaseId: number;

    // Relaciones
    producto?: Producto;
    paqueteBase?: PaqueteBase;
}