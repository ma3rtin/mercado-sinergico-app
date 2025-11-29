import { Categoria } from "../Producto-Paquete/Categoria";
import { Marca } from "../Producto-Paquete/Marca";

export interface PaqueteBase {
  id_paquete_base?: number; // opcional para creación
  nombre: string;
  descripcion: string;
  imagen_url: string;
  categoria_id: number;
  marcaId?: number;
  marca: Marca;
  categoria: Categoria;
  productos?: number[];
}
