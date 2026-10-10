import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NgIconsModule } from '@ng-icons/core';
import { LoginComponent } from './login';
import { AuthService } from '../../services/auth/auth.service';
import { ToastService } from '@app/services/toast/toast.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: {
    signInWithEmailPassword: ReturnType<typeof vi.fn>;
    signInWithGoogle: ReturnType<typeof vi.fn>;
    resetPassword: ReturnType<typeof vi.fn>;
  };
  let mockToastService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(() => {
    mockAuthService = {
      signInWithEmailPassword: vi.fn().mockResolvedValue(undefined),
      signInWithGoogle: vi.fn().mockResolvedValue(undefined),
      resetPassword: vi.fn().mockResolvedValue(undefined),
    };
    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [LoginComponent, NgIconsModule.withIcons({})],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
      ],
    });

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('debería iniciar sesión correctamente con email y contraseña', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.email.set('usuario@example.com');
    component.password.set('password123');

    await component.onSubmit();

    expect(mockAuthService.signInWithEmailPassword).toHaveBeenCalledWith('usuario@example.com', 'password123');
    expect(mockToastService.success).toHaveBeenCalledWith('Sesión iniciada correctamente', 'Éxito');
    expect(navigateSpy).toHaveBeenCalledWith(['/perfil']);
  });

  it('debería mapear error de credenciales incorrectas en onSubmit', async () => {
    component.email.set('usuario@example.com');
    component.password.set('wrongpass');
    mockAuthService.signInWithEmailPassword.mockRejectedValue({ code: 'auth/invalid-credential' });

    await component.onSubmit();

    expect(component.mensaje()).toBe('El mail o la contraseña son incorrectos');
    expect(component.loading()).toBe(false);
  });

  it('debería iniciar sesión exitosamente con Google', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    await component.signInWithGoogle();

    expect(mockAuthService.signInWithGoogle).toHaveBeenCalled();
    expect(mockToastService.success).toHaveBeenCalledWith('Inicio de sesión con Google exitoso', 'Éxito');
    expect(navigateSpy).toHaveBeenCalledWith(['/perfil']);
  });

  it('debería enviar correo de reseteo de contraseña', async () => {
    component.resetEmail.set('recuperar@example.com');

    await component.sendResetEmail();

    expect(mockAuthService.resetPassword).toHaveBeenCalledWith('recuperar@example.com');
    expect(component.resetEmailSent()).toBe(true);
    expect(mockToastService.success).toHaveBeenCalledWith(
      'Te enviamos un email para restablecer tu contraseña',
      'Revisá tu casilla'
    );
  });
});
