import { Marca } from "@app/models/Producto-Paquete/Marca";
import { Categoria } from "@app/models/Producto-Paquete/Categoria";
import { PaqueteBaseProducto } from "@app/models/PaquetesInterfaces/PaqueteBaseProducto";
import { Plantilla } from "@app/models/PlantillaInterfaces/Plantilla";
import { Imagen } from "@app/models/ProductosInterfaces/Imagenes_producto";
export interface Producto {
    id_producto?: number; // opcional para creación
    nombre: string;
    descripcion: string;
    precio: number;
    imagen_url?: string;
    marca_id: number;
    altura?: number;
    ancho?: number;
    profundidad?: number;
    peso?: number;
    stock?: number;
    plantillaId?: number;
    categoria_id: number;

    // Relaciones
    marca: Marca;
    categoria?: Categoria;
    plantilla?: Plantilla;
    paquetes?: PaqueteBaseProducto[];
    imagenes: Imagen[];
}