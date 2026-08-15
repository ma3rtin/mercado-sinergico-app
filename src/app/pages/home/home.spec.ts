import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Home } from './home';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { NgIconsModule } from '@ng-icons/core';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let mockPaquetePublicadoService: { getPaquetesPorCerrarse: ReturnType<typeof vi.fn> };

  const paquetesMock: PaquetePublicado[] = [
    { id_paquete_publicado: 1 } as PaquetePublicado,
    { id_paquete_publicado: 2 } as PaquetePublicado,
  ];

  const configurarTestBed = async (platformId: string) => {
    mockPaquetePublicadoService = {
      getPaquetesPorCerrarse: vi.fn().mockReturnValue(of(paquetesMock)),
    };

    await TestBed.configureTestingModule({
      imports: [Home, NgIconsModule.withIcons({})],
      providers: [
        provideRouter([]),
        { provide: PaquetePublicadoService, useValue: mockPaquetePublicadoService },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
  };

  afterEach(() => {
    fixture?.destroy();
  });

  it('debería cargar los paquetes por cerrarse al inicializar en el navegador', async () => {
    await configurarTestBed('browser');

    fixture.detectChanges(); // ejecuta ngOnInit

    expect(mockPaquetePublicadoService.getPaquetesPorCerrarse).toHaveBeenCalled();
    expect(component.paquetesPorCerrarse()).toEqual(paquetesMock);
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe('');
  });

  it('no debería cargar paquetes cuando se ejecuta en el servidor (SSR)', async () => {
    await configurarTestBed('server');

    fixture.detectChanges();

    expect(mockPaquetePublicadoService.getPaquetesPorCerrarse).not.toHaveBeenCalled();
    expect(component.paquetesPorCerrarse()).toEqual([]);
  });

  it('debería setear un mensaje de error si falla la carga de paquetes', async () => {
    await configurarTestBed('browser');
    mockPaquetePublicadoService.getPaquetesPorCerrarse.mockReturnValue(
      throwError(() => new Error('fallo de red'))
    );

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Error al cargar paquetes. Intenta de nuevo más tarde.');
    expect(component.isLoading()).toBe(false);
    expect(component.paquetesPorCerrarse()).toEqual([]);
  });

  it('recargarPaquetes debería volver a solicitar los paquetes al servicio', async () => {
    await configurarTestBed('browser');
    fixture.detectChanges();
    mockPaquetePublicadoService.getPaquetesPorCerrarse.mockClear();

    component.recargarPaquetes();

    expect(mockPaquetePublicadoService.getPaquetesPorCerrarse).toHaveBeenCalledTimes(1);
  });

  it('scrollToInfo debería llamar a scrollIntoView cuando la sección existe', async () => {
    await configurarTestBed('browser');
    fixture.detectChanges();

    const section = document.getElementById('info-section');
    expect(section).toBeTruthy();
    const scrollIntoViewSpy = vi.fn();
    section!.scrollIntoView = scrollIntoViewSpy;

    component.scrollToInfo();

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('scrollToInfo no debería lanzar error si la sección no existe', async () => {
    await configurarTestBed('browser');
    fixture.detectChanges();

    const section = document.getElementById('info-section');
    section?.remove();

    expect(() => component.scrollToInfo()).not.toThrow();
  });
});
