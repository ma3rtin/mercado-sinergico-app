import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

export interface EstadoPaquetePublicado {
    id_estado: number;
    nombre: string;

    // Relaciones
    paquetes?: PaquetePublicado[];
}

/** Nombres canónicos de estado — usá esto en lugar de strings mágicos */
export enum EstadoPaqueteNombre {
    Pendiente     = 'Pendiente',
    Activo        = 'Activo',
    EnPreparacion = 'En Preparación',
    Finalizado    = 'Finalizado',
    Cancelado     = 'Cancelado',
    Eliminado     = 'Eliminado',
}
