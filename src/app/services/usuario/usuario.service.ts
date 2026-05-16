import { Injectable } from '@angular/core';
import { Observable, catchError, throwError, timeout, tap, shareReplay } from 'rxjs';
import { Usuario } from '@app/models/UsuarioInterfaces/Usuario';
import { Direccion } from '@app/models/ZonasInterfaces/Direccion';
import { CrearUsuarioDTO } from '@app/models/DTOs/Usuario/crearUsuarioDTO';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api.service';
import { FirebaseLoginResponse, LoginResponse } from './types';

@Injectable({ providedIn: 'root' })
export class UsuarioService extends ApiService {

  constructor(private authService: AuthService) {
    super();
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

  private cachedPerfil$: Observable<Usuario> | null = null;

  getPerfil(): Observable<Usuario> {
    if (!this.cachedPerfil$) {
      this.cachedPerfil$ = this.get<Usuario>('usuarios/me').pipe(
        timeout(60000),
        shareReplay(1),
        catchError(err => {
          this.cachedPerfil$ = null;
          return this.handleError('getPerfil')(err);
        })
      );
    }
    return this.cachedPerfil$;
  }

  updatePerfil(data: any): Observable<Usuario> {
    return this.patch<Usuario>('usuarios/me', data).pipe(
      tap(() => {
        // Limpiamos caché para forzar recarga la próxima vez
        this.cachedPerfil$ = null;
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
