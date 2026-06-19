import { Producto } from '@app/models/ProductosInterfaces/Producto';

export interface PedidoProducto {
    id?: number;
    id_pedido_producto?: number;
    pedidoId: number;
    productoId: number;
    cantidad: number;
    precio_unitario?: number;
    subtotal?: number;
    variante?: string;
    sku?: string;

    producto?: Producto;
}