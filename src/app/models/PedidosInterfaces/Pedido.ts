import { Usuario } from "@app/models/UsuarioInterfaces/Usuario";
import { PaquetePublicado } from "@app/models/PaquetesInterfaces/PaquetePublicado";
import { EstadoPedido } from "@app/models/PedidosInterfaces/EstadoPedidos";

export interface Pedido {
  id_pedido?: number; // opcional para creación
  usuarioId: number;
  paquetePublicadoId: number;
  estadoId: number;
  monto_total?: number;
  fecha?: Date; // opcional porque tiene default en la DB
  
  // Relaciones
  usuario?: Usuario;
  paquetePublicado?: PaquetePublicado;
  estado?: EstadoPedido;
}