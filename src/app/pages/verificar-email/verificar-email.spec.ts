import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { VerificarEmailComponent } from './verificar-email';
import { UsuarioService } from '../../services/usuario/usuario.service';
import { ToastService } from '@app/services/toast/toast.service';

describe('VerificarEmailComponent', () => {
  let fixture: ComponentFixture<VerificarEmailComponent>;
  let mockUsuarioService: {
    verificarEmail: ReturnType<typeof vi.fn>;
    reenviarVerificacion: ReturnType<typeof vi.fn>;
  };
  let mockToastService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const configurarTest = (paramToken: string | null) => {
    mockUsuarioService = {
      verificarEmail: vi.fn(),
      reenviarVerificacion: vi.fn(),
    };
    mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [VerificarEmailComponent],
      providers: [
        provideRouter([]),
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: ToastService, useValue: mockToastService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'token' ? paramToken : null),
              },
            },
          },
        },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(VerificarEmailComponent);
  };

  it('debería mostrar toast de error y redirigir a /login si no hay token en la URL', () => {
    configurarTest(null);
    fixture.detectChanges();

    expect(mockUsuarioService.verificarEmail).not.toHaveBeenCalled();
    expect(mockToastService.error).toHaveBeenCalledWith(
      expect.stringContaining('enlace de activación válido'),
      'Atención'
    );
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('debería notificar éxito con ToastService y redirigir a /login ante token válido', () => {
    configurarTest('token-valido-123');
    mockUsuarioService.verificarEmail.mockReturnValue(
      of({ message: 'Tu cuenta fue verificada con éxito' })
    );

    fixture.detectChanges();

    expect(mockUsuarioService.verificarEmail).toHaveBeenCalledWith('token-valido-123');
    expect(mockToastService.success).toHaveBeenCalledWith(
      'Tu cuenta fue verificada con éxito',
      'Éxito'
    );
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('debería notificar error con ToastService y redirigir a /login si el token venció o es inválido', () => {
    configurarTest('token-vencido');
    mockUsuarioService.verificarEmail.mockReturnValue(
      throwError(() => ({
        status: 400,
        error: { message: 'El enlace de activación es inválido o venció.' },
      }))
    );

    fixture.detectChanges();

    expect(mockUsuarioService.verificarEmail).toHaveBeenCalledWith('token-vencido');
    expect(mockToastService.error).toHaveBeenCalledWith(
      'El enlace de activación es inválido o venció.',
      'Error'
    );
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
