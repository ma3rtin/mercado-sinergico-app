import { Categoria } from "../Producto-Paquete/Categoria";

export interface PaqueteBase {
  id_paquete_base?: number; // opcional para creación
  nombre: string;
  descripcion: string;
  imagen_url: string;
  categoria_id: number;
  marcaId?: number;

  productos?: number[];
  categoria: Categoria;
}
