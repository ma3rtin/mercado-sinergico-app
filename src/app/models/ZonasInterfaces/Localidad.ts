import { Direccion } from '@app/models/ZonasInterfaces/Direccion';
import { Zona } from '@app/models/ZonasInterfaces/Zona';
export interface Localidad {
  id_localidad: number;
  nombre: string;
  codigo_postal: number;

  // Relaciones
  direcciones?: Direccion[];
  zonas?: Zona[];
}