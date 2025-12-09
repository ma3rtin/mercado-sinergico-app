import { Producto } from "@app/models/ProductosInterfaces/Producto";

export interface PedidoProducto {
    id_pedido_producto?: number;
    pedidoId: number;
    productoId: number;
    cantidad: number;
    variante?: string;

    producto?: Producto;
}
