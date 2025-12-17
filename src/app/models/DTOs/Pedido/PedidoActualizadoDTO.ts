export interface PedidoActualizado {
    pedidoProductos: {
        id_producto: number;
        cantidad: number;
        variante?: string | null;
    }[];
}
