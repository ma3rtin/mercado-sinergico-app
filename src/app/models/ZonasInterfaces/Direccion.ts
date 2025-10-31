import { Localidad } from '@app/models/ZonasInterfaces/Localidad';
import { Usuario } from '@app/models/UsuarioInterfaces/Usuario';
export interface Direccion {
    id?: number;
    usuarioId: number;
    localidadId: number;
    codigo_postal: number;
    calle: string;
    numero: number;
    piso?: number;
    departamento?: string;

    // Relaciones
    usuario?: Usuario;
    localidad?: Localidad;
}