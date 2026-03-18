export interface ProductoEnPedido {
    id_detalle: number;
    id_producto: number;
    nombre: string;
    precio: number;
    precioConDescuento?: number;
    imagen_url?: string;
    cantidad: number;
    variante?: string | null;
}
