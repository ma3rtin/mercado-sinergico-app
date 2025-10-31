import { Localidad } from '@app/models/ZonasInterfaces/Localidad';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
export interface Zona {
  id_zona: number;
  nombre: string;

  // Relaciones
  paquetes?: PaquetePublicado[];
  localidades?: Localidad[];
}
