import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UsuarioService } from './usuario.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '@environments/environment';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let httpMock: HttpTestingController;
  let mockAuthService: { isAuthenticated: ReturnType<typeof vi.fn>; setJwtToken: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      setJwtToken: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UsuarioService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(UsuarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería instanciarse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('verificarEmail', () => {
    it('debería enviar una petición POST a usuarios/verificar-email con el token provisto', () => {
      const mockToken = 'token-seguro-123';
      const mockRespuesta = { message: 'Tu correo fue verificado correctamente.' };

      service.verificarEmail(mockToken).subscribe((res) => {
        expect(res).toEqual(mockRespuesta);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/verificar-email`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token: mockToken });
      req.flush(mockRespuesta);
    });

    it('debería propagar el error HTTP original con status y código sin perder payload', () => {
      const mockToken = 'token-invalido';
      const mockError = { message: 'El enlace venció', code: 'TOKEN_VERIFICACION_INVALIDO' };

      service.verificarEmail(mockToken).subscribe({
        next: () => expect.fail('Debió fallar'),
        error: (err) => {
          expect(err.status).toBe(400);
          expect(err.error).toEqual(mockError);
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/verificar-email`);
      req.flush(mockError, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('reenviarVerificacion', () => {
    it('debería enviar una petición POST a usuarios/reenviar-verificacion con el email', () => {
      const mockEmail = 'test@example.com';
      const mockRespuesta = { message: 'Si existe una cuenta pendiente, enviamos el correo.' };

      service.reenviarVerificacion(mockEmail).subscribe((res) => {
        expect(res).toEqual(mockRespuesta);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/reenviar-verificacion`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: mockEmail });
      req.flush(mockRespuesta);
    });
  });
});
