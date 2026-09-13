import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NgIconsModule } from '@ng-icons/core';
import { LoginComponent } from './login';
import { UsuarioService } from '../../services/usuario/usuario.service';
import { AuthService } from '../../services/auth/auth.service';
import { ToastService } from '@app/services/toast/toast.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockUsuarioService: {
    login: ReturnType<typeof vi.fn>;
    loginWithFirebase: ReturnType<typeof vi.fn>;
    reenviarVerificacion: ReturnType<typeof vi.fn>;
  };
  let mockAuthService: {
    signInWithGoogle: ReturnType<typeof vi.fn>;
    getFirebaseToken: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };
  let mockToastService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockUsuarioService = {
      login: vi.fn(),
      loginWithFirebase: vi.fn(),
      reenviarVerificacion: vi.fn(),
    };
    mockAuthService = {
      signInWithGoogle: vi.fn(),
      getFirebaseToken: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
    };
    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [LoginComponent, NgIconsModule.withIcons({})],
      providers: [
        provideRouter([]),
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
      ],
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('debería marcar cuentaNoVerificada ante error EMAIL_NO_VERIFICADO al iniciar sesión', () => {
    component.email.set('sinverificar@example.com');
    component.password.set('Password123');

    mockUsuarioService.login.mockReturnValue(
      throwError(() => ({
        status: 403,
        error: {
          code: 'EMAIL_NO_VERIFICADO',
          message: 'Confirmá tu correo electrónico antes de iniciar sesión.',
        },
      }))
    );

    component.onSubmit();

    expect(component.cuentaNoVerificada()).toBe(true);
    expect(component.mensaje()).toBe('Confirmá tu correo electrónico antes de iniciar sesión.');
  });

  it('debería limpiar tokens y sesión Firebase ante rechazo del backend en login Google', async () => {
    mockAuthService.signInWithGoogle.mockResolvedValue({} as any);
    mockAuthService.getFirebaseToken.mockReturnValue('firebase-token-123');

    mockUsuarioService.loginWithFirebase.mockReturnValue(
      throwError(() => ({
        status: 403,
        error: {
          code: 'EMAIL_NO_VERIFICADO',
          message: 'Google no confirmó este correo electrónico',
        },
      }))
    );

    await component.signInWithGoogle();

    expect(mockAuthService.signOut).toHaveBeenCalled();
    expect(component.mensaje()).toBe('Google no confirmó este correo electrónico');
    expect(component.loading()).toBe(false);
  });

  it('debería reenviar la activación para el correo ingresado en el login', () => {
    component.email.set('usuario@example.com');
    mockUsuarioService.reenviarVerificacion.mockReturnValue(
      of({ message: 'Correo reenviado' })
    );

    component.reenviarActivacion();

    expect(mockUsuarioService.reenviarVerificacion).toHaveBeenCalledWith('usuario@example.com');
    expect(mockToastService.success).toHaveBeenCalledWith('Correo reenviado', 'Éxito');
  });
});
