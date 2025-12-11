export interface ProductoEnPedido {
    id_producto: number;
    nombre: string;
    precio: number;
    imagen_url?: string;
    cantidad: number;
    variante?: string | null;
}
