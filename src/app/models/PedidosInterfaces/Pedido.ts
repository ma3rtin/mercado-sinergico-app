import { Usuario } from '@app/models/UsuarioInterfaces/Usuario';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { EstadoPedido } from '@app/models/PedidosInterfaces/EstadoPedidos';
import { PedidoProducto } from '@app/models/PedidosInterfaces/PedidoProducto';
import { PedidoDetalle } from '@app/models/PedidosInterfaces/PedidoDetalle';

export interface Pedido {
  id_pedido?: number;
  usuarioId: number;
  paquetePublicadoId: number;
  estadoId: number;
  monto_total?: number;
  descuento_aplicado?: number | null;
  fecha?: Date;

  // Relaciones
  usuario?: Usuario;
  paquetePublicado?: PaquetePublicado;
  estado?: EstadoPedido;
  pedidoProductos?: PedidoProducto[];
  detalles?: PedidoDetalle[];
}