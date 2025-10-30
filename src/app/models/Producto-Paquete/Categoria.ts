import { PaqueteBase } from "@app/models/PaquetesInterfaces/PaqueteBase";
import { Producto } from '@app/models/ProductosInterfaces/Producto';

export interface Categoria {
    id_categoria?: number;
    nombre: string;

    // Relaciones
    productos?: Producto[];
    paquetes?: PaqueteBase[];
}
