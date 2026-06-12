import { Injectable, signal, computed, effect } from '@angular/core';
import { Observable, catchError, throwError, timeout, tap } from 'rxjs';
import { Usuario } from '@app/models/UsuarioInterfaces/Usuario';
import { Direccion } from '@app/models/ZonasInterfaces/Direccion';
import { CrearUsuarioDTO } from '@app/models/DTOs/Usuario/crearUsuarioDTO';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api.service';
import { FirebaseLoginResponse, LoginResponse } from './types';

@Injectable({ providedIn: 'root' })
export class UsuarioService extends ApiService {
  // 🧠 Signals reactivos de perfil
  perfilUsuario = signal<Usuario | null>(null);

  perfilCompleto = computed(() => {
    const usuario = this.perfilUsuario();
    if (!usuario) return false;

    const tieneTelefono = !!usuario.telefono && usuario.telefono.trim().length >= 8;
    const tieneFechaNac = !!usuario.fecha_nac;
    const tieneDireccion = !!usuario.direccion && 
                           (!!usuario.direccion.localidadId || !!usuario.direccion.localidad?.id_localidad) &&
                           !!usuario.direccion.calle && usuario.direccion.calle.trim().length > 0 &&
                           !!usuario.direccion.numero;

    return tieneTelefono && tieneFechaNac && tieneDireccion;
  });

  constructor(private authService: AuthService) {
    super();

    // 🔄 Limpiar perfil reactivamente cuando el usuario cierra sesión
    effect(() => {
      if (!this.authService.isAuthenticated()) {
        this.perfilUsuario.set(null);
      }
    });
  }

  getUsuarios(): Observable<Usuario[]> {
    return this.get<Usuario[]>('usuarios').pipe(
      timeout(60000),
      catchError(this.handleError('getUsuarios'))
    );
  }

  register(usuario: CrearUsuarioDTO): Observable<Usuario> {
    return this.post<Usuario>('usuarios/registrar', usuario).pipe(
      timeout(60000),
      catchError(this.handleError('register'))
    );
  }

  login(credenciales: { email: string; contraseña: string }): Observable<LoginResponse> {
    return this.post<LoginResponse>('usuarios/login', credenciales).pipe(
      tap(response => this.authService.setJwtToken(response.token)),
      timeout(30000),
      catchError(this.handleError('login'))
    );
  }

  loginWithFirebase(firebaseToken: string): Observable<FirebaseLoginResponse> {
    return this.post<FirebaseLoginResponse>('usuarios/login-firebase', { token: firebaseToken }).pipe(
      tap(response => this.authService.setJwtToken(response.token)),
      timeout(30000),
      catchError(this.handleError('loginWithFirebase'))
    );
  }

  getPerfil(): Observable<Usuario> {
    return this.get<Usuario>('usuarios/me').pipe(
      timeout(60000),
      tap(u => this.perfilUsuario.set(u)),
      catchError(this.handleError('getPerfil'))
    );
  }

  updatePerfil(data: any): Observable<Usuario> {
    return this.patch<Usuario>('usuarios/me', data).pipe(
      tap((res) => {
        const u = (res as any).usuario ?? res;
        this.perfilUsuario.set(u);
      }),
      timeout(60000),
      catchError(this.handleError('updatePerfil'))
    );
  }


  uploadImagenPerfil(file: File): Observable<Usuario> {
    const formData = new FormData();
    formData.append('imagen', file);

    return this.patch<Usuario>('usuarios/me', formData).pipe(
      timeout(60000),
      catchError(this.handleError('uploadImagenPerfil'))
    );
  }

  registrarDireccion(userId: number, direccion: Direccion): Observable<Usuario> {
    return this.post<Usuario>(`usuarios/${userId}/direcciones`, direccion).pipe(
      timeout(60000),
      catchError(this.handleError('registrarDireccion'))
    );
  }

  buscarPorEmail(email: string): Observable<Usuario> {
    return this.get<Usuario>(`usuarios?email=${email}`).pipe(
      timeout(60000),
      catchError(this.handleError('buscarPorEmail'))
    );
  }

  private handleError(operation = 'operación') {
    return (error: any) => {
      console.error(`Error en UsuarioService.${operation}:`, error);
      return throwError(() => new Error(`Error en ${operation}: ${error.message}`));
    };
  }
}
