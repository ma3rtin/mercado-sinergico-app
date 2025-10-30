
import { Producto } from "@app/models/ProductosInterfaces/Producto";
import { PaqueteBase } from "@app/models/PaquetesInterfaces/PaqueteBase";

export interface Marca {
    id_marca: number;
    nombre: string;

    // Relaciones
    productos?: Producto[];
    paquetes?: PaqueteBase[];
}