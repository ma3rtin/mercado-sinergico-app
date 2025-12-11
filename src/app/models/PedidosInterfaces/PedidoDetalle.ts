import { Producto } from '@app/models/ProductosInterfaces/Producto';

export interface PedidoDetalle {
    id: number;
    pedidoId: number;
    productoId: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    variante?: string;
    producto: Producto;
}
