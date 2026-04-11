import { Pedido } from '@app/models/PedidosInterfaces/Pedido';

export interface EstadoPedido {
    id_estado: number;
    nombre: string;

    // Relaciones
    pedidos?: Pedido[];
}

/** Nombres canónicos de estado de pedido — usá esto en lugar de strings mágicos */
export enum EstadoPedidoNombre {
    Pendiente     = 'Pendiente',
    Pagado        = 'Pagado',
    Reembolsado   = 'Reembolsado',
    EnPreparacion = 'En preparación',
    EnCamino      = 'En camino',
    Recibido      = 'Recibido',
}
