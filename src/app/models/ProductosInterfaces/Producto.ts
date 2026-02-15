import { PaqueteBaseProducto } from '@app/models/PaquetesInterfaces/PaqueteBaseProducto';
import { Plantilla } from '@app/models/PlantillaInterfaces/Plantilla';
import { Imagen } from '@app/models/ProductosInterfaces/Imagenes_producto';
import { TipoPaquete } from '../Enums';
export interface Producto {
    id_producto?: number; // opcional para creación
    id?: number; // Backend compatibility fallback
    nombre: string;
    descripcion: string;
    precio: number;
    imagen_url?: string;
    imagen?: string;
    marca_id: number;
    altura?: number;
    ancho?: number;
    profundidad?: number;
    peso?: number;
    stock?: number;
    plantillaId?: number;
    categoria_id: number;
    tieneVariantes?: boolean;
  cantidadVariantes?: number;
  tipo: TipoPaquete;

    // Relaciones
    marca?: string | { id_marca?: number; nombre: string };
     categoria?: string | { id_categoria?: number; nombre: string };
    plantilla?: Plantilla;
    paquetes?: PaqueteBaseProducto[];
    imagenes: Imagen[];
}
