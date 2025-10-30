import { Caracteristica } from "@app/models/PlantillaInterfaces/Caracteristica";

export interface Plantilla{
    id?: number;
    nombre: string;
    caracteristicas: Caracteristica[];
}