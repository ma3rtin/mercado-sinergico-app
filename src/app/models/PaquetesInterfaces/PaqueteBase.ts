import { TipoPaquete } from '../Enums';
import { Categoria } from '../Producto-Paquete/Categoria';
import { Marca } from '../Producto-Paquete/Marca';
import { PaqueteBaseProducto } from './PaqueteBaseProducto';

export interface PaqueteBase {
  id_paquete_base?: number; // opcional para creación
  nombre: string;
  descripcion: string;
  imagen_url: string;
  categoria_id: number;
  marcaId?: number;
  marca?: Marca;
  categoria?: Categoria;
  tipo?: TipoPaquete;
  productos?: PaqueteBaseProducto[];
}
