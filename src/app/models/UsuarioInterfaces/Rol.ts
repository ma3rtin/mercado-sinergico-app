import { Usuario } from "@app/models/UsuarioInterfaces/Usuario";

export interface Rol {
    id: number;
    nombre: string;
    usuarios?: Usuario[];
}