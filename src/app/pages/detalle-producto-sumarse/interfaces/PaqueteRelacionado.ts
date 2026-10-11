export interface PaqueteRelacionado {
    id: number;
    nombre: string;
    estado: string;
    participantes: number;
    maxParticipantes: number;
    faltanParaCerrar?: number;
    fechaCierre?: string;
    compradoresInvolucrados?: number;
    zona: string;
    imagen: string;
}