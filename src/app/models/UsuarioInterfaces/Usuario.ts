import { Direccion } from "@app/models/ZonasInterfaces/Direccion";
import { Pedido } from "@app/models/PedidosInterfaces/Pedido";
import { Rol } from "@app/models/UsuarioInterfaces/Rol";
export interface Usuario {
  id?: number; // opcional para creación
  email: string;
  nombre: string;
  contraseña?: string; // opcional - nunca debería venir del backend por seguridad
  telefono: string;
  fecha_nac?: Date;
  imagen_url?: string;
  rolId: number;

  // Relaciones
  rol?: Rol;
  direccion?: Direccion;
  pedidos?: Pedido[];
}