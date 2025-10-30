import { Opcion } from "@app/models/PlantillaInterfaces/Opcion";

export interface Caracteristica {
    id?: number;
    nombre: string;
    plantillaId?: number;
    //relaciones
    opciones: Opcion[];
}