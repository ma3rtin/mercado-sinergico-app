import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

export interface EstadoPaquetePublicado {
    id_estado: number;
    nombre: string;

    // Relaciones
    paquetes?: PaquetePublicado[];
}

/** Nombres canónicos de estado de paquete — usá esto en lugar de strings mágicos */
export enum EstadoPaqueteNombre {
    Activo     = 'Activo',
    Completo   = 'Completo',
    Confirmado = 'Confirmado',
    Entregado  = 'Entregado',
    Cancelado  = 'Cancelado',
}
