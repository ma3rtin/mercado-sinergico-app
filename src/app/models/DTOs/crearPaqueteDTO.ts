export interface CreatePaqueteBaseDto {
    nombre: string;
    descripcion: string;
    imagen_url?: string;
    categoria_id: number;
    marcaId?: number;
}