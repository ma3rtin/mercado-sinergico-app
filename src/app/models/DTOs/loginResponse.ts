import { Usuario } from '@app/models/UsuarioInterfaces/Usuario';

export interface LoginResponse {
  token: string;
  usuario?: Usuario;
}