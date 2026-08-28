import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Home } from './home';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';
import { NgIconsModule } from '@ng-icons/core';
import { By } from '@angular/platform-browser';
import { Carrusel } from '@app/components/carrusel/carrusel';

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

  it('no debería volver a pedir los paquetes si ngOnInit corre dos veces', async () => {
    await configurarTestBed('browser');
    fixture.detectChanges();

    component.ngOnInit();

    expect(mockPaquetePublicadoService.getPaquetesPorCerrarse).toHaveBeenCalledTimes(1);
  });

  it('debería quedar en isLoading mientras la respuesta no llega', async () => {
    await configurarTestBed('browser');
    const respuesta$ = new Subject<PaquetePublicado[]>();
    mockPaquetePublicadoService.getPaquetesPorCerrarse.mockReturnValue(respuesta$);

    fixture.detectChanges();
    expect(component.isLoading()).toBe(true);

    respuesta$.next(paquetesMock);
    expect(component.isLoading()).toBe(false);
  });

  it('debería dejar de escuchar la respuesta si el componente se destruye antes', async () => {
    await configurarTestBed('browser');
    const respuesta$ = new Subject<PaquetePublicado[]>();
    mockPaquetePublicadoService.getPaquetesPorCerrarse.mockReturnValue(respuesta$);

    fixture.detectChanges();
    fixture.destroy();
    respuesta$.next(paquetesMock);

    expect(component.paquetesPorCerrarse()).toEqual([]);
  });

  describe('render del template', () => {
    const textoDe = () => fixture.nativeElement.textContent as string;

    it('muestra el spinner mientras carga', async () => {
      await configurarTestBed('browser');
      mockPaquetePublicadoService.getPaquetesPorCerrarse.mockReturnValue(
        new Subject<PaquetePublicado[]>()
      );

      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.animate-spin')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-carrusel')).toBeFalsy();
    });

    it('muestra el error con el botón de reintento cuando falla', async () => {
      await configurarTestBed('browser');
      mockPaquetePublicadoService.getPaquetesPorCerrarse.mockReturnValue(
        throwError(() => new Error('fallo de red'))
      );

      fixture.detectChanges();

      expect(textoDe()).toContain('Intentar de nuevo');
      expect(fixture.nativeElement.querySelector('app-carrusel')).toBeFalsy();
    });

    it('el botón de reintento vuelve a pedir los paquetes', async () => {
      await configurarTestBed('browser');
      mockPaquetePublicadoService.getPaquetesPorCerrarse.mockReturnValue(
        throwError(() => new Error('fallo de red'))
      );
      fixture.detectChanges();
      mockPaquetePublicadoService.getPaquetesPorCerrarse.mockClear();

      const boton = Array.from(
        fixture.nativeElement.querySelectorAll('app-button')
      ).find((b) => (b as HTMLElement).textContent?.includes('Intentar de nuevo'));
      expect(boton).toBeTruthy();
      (boton as HTMLElement).querySelector('button')!.click();

      expect(mockPaquetePublicadoService.getPaquetesPorCerrarse).toHaveBeenCalledTimes(1);
    });

    it('renderiza el carrusel con los paquetes recibidos', async () => {
      await configurarTestBed('browser');

      fixture.detectChanges();

      const carrusel = fixture.debugElement.query(By.directive(Carrusel));
      expect(carrusel).toBeTruthy();
      expect(carrusel.componentInstance.items()).toEqual(paquetesMock);
    });

    it('muestra el estado vacío cuando no hay paquetes por cerrarse', async () => {
      await configurarTestBed('browser');
      mockPaquetePublicadoService.getPaquetesPorCerrarse.mockReturnValue(of([]));

      fixture.detectChanges();

      expect(textoDe()).toContain('Actualmente no hay paquetes por cerrarse');
      expect(fixture.nativeElement.querySelector('app-carrusel')).toBeFalsy();
    });
  });
});
