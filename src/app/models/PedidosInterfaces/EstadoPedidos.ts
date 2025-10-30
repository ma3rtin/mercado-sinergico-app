import { Pedido } from "@app/models/PedidosInterfaces/Pedido";
export interface EstadoPedido {
    id_estado: number;
    nombre: string;

    // Relaciones
    pedidos?: Pedido[];
}