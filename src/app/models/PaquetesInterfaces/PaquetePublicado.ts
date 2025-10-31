import { TipoPaquete } from './../Enums';
import { PaqueteBase } from '@app/models/PaquetesInterfaces/PaqueteBase';
import { EstadoPaquetePublicado } from '@app/models/PaquetesInterfaces/EstadoPaquetePublicado';
import { Zona } from '@app/models/ZonasInterfaces/Zona';
import { Pedido } from '@app/models/PedidosInterfaces/Pedido';

export interface PaquetePublicado {

  id_paquete_publicado?: number; // opcional para creación
  paqueteBaseId: number;
  estadoId: number;
  zonaId: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  cant_productos?: number;
  cant_productos_reservados?: number;
  cant_usuarios_registrados?: number;
  monto_total?: number;
  imagen_url?: string;
  tipoPaquete?: TipoPaquete;

  // Relaciones
  paqueteBase?: PaqueteBase;
  estado?: EstadoPaquetePublicado;
  zona?: Zona;
  pedidos?: Pedido[];
}