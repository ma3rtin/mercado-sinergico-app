import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { VariantePedidoDetalle } from '@app/models/PedidosInterfaces/VariantePedidoDetalle';

export interface PedidoDetalle {
    id: number;
    pedidoId: number;
    productoId: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    variante?: VariantePedidoDetalle | null;
    producto: Producto;
}
