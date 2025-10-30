export interface CrearProductoDTO {
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
}