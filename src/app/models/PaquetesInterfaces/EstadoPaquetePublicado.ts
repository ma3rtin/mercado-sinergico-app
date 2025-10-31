import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
export interface EstadoPaquetePublicado {
    id_estado: number;
    nombre: string;

    // Relaciones
    paquetes?: PaquetePublicado[];
}