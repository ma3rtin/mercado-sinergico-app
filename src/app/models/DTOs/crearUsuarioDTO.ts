export interface CrearUsuarioDTO {
    email: string;
    nombre: string;
    contraseña: string;
    telefono: string;
    fecha_nac?: Date;
    imagen_url?: string;
    rolId: number;
}