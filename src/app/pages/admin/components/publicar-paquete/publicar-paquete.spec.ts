import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { featherArrowLeft, featherPlus, featherSearch, featherX } from '@ng-icons/feather-icons';
import { Subject, of } from 'rxjs';

import { PublicarPaqueteComponent } from './publicar-paquete';
import { PaqueteBaseService } from '@app/services/paquete/paquete-base.service';
import { ZonaService } from '@app/services/zona/zona.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { ToastService } from '@app/services/toast/toast.service';

const paquetesBaseMock = [
  { id_paquete_base: 1, nombre: 'Paquete Base Genérico', tipo: 'ENERGICO' },
];

const publicacionMock = {
  id_paquete_publicado: 5,
  nombre: 'Nombre personalizado del admin',
  paqueteBase: { id_paquete_base: 1, nombre: 'Paquete Base Genérico' },
  estado: { id_estado: 2 },
};

function setup(id: string | null) {
  const getPaquetesSubject = new Subject<typeof paquetesBaseMock>();
  const getPaqueteByIdSubject = new Subject<typeof publicacionMock>();

  TestBed.configureTestingModule({
    imports: [PublicarPaqueteComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
      provideRouter([]),
      provideIcons({ featherArrowLeft, featherPlus, featherSearch, featherX }),
      {
        provide: ActivatedRoute,
        useValue: {
          queryParams: of({}),
          params: of(id ? { id } : {}),
        },
      },
      { provide: PaqueteBaseService, useValue: { getPaquetes: () => getPaquetesSubject.asObservable() } },
      { provide: ZonaService, useValue: { getZonas: () => of([]) } },
      {
        provide: PaquetePublicadoService,
        useValue: { getPaqueteById: () => getPaqueteByIdSubject.asObservable() },
      },
      { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } },
    ],
  });

  const fixture: ComponentFixture<PublicarPaqueteComponent> = TestBed.createComponent(PublicarPaqueteComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, getPaquetesSubject, getPaqueteByIdSubject };
}

describe('PublicarPaqueteComponent — carrera entre carga de edición y autocompletado', () => {
  it('no pisa el nombre personalizado si cargarDatosEdicion resuelve antes que cargarPaquetesIniciales', () => {
    const { component, getPaquetesSubject, getPaqueteByIdSubject } = setup('5');

    getPaqueteByIdSubject.next(publicacionMock);
    getPaqueteByIdSubject.complete();
    expect(component.nombre()).toBe('Nombre personalizado del admin');

    getPaquetesSubject.next(paquetesBaseMock);
    getPaquetesSubject.complete();

    expect(component.nombre()).toBe('Nombre personalizado del admin');
  });

  it('no pisa el nombre personalizado si cargarPaquetesIniciales resuelve antes que cargarDatosEdicion', () => {
    const { component, getPaquetesSubject, getPaqueteByIdSubject } = setup('5');

    getPaquetesSubject.next(paquetesBaseMock);
    getPaquetesSubject.complete();
    expect(component.nombre()).toBe('');

    getPaqueteByIdSubject.next(publicacionMock);
    getPaqueteByIdSubject.complete();

    expect(component.nombre()).toBe('Nombre personalizado del admin');
  });

  it('sigue autocompletando el nombre al crear una publicación nueva (no edición)', () => {
    const { component, getPaquetesSubject } = setup(null);
    component.paqueteBaseSeleccionado.set(1);

    getPaquetesSubject.next(paquetesBaseMock);
    getPaquetesSubject.complete();

    expect(component.nombre()).toBe('Paquete Base Genérico');
  });

  it('no pisa el nombre personalizado si el admin usa el buscador durante una edición', () => {
    const { component, getPaquetesSubject, getPaqueteByIdSubject } = setup('5');

    getPaqueteByIdSubject.next(publicacionMock);
    getPaqueteByIdSubject.complete();
    getPaquetesSubject.next(paquetesBaseMock);
    getPaquetesSubject.complete();
    expect(component.nombre()).toBe('Nombre personalizado del admin');

    component.seleccionarPaquete(paquetesBaseMock[0]);

    expect(component.nombre()).toBe('Nombre personalizado del admin');
  });

  it('sigue autocompletando por el buscador al crear una publicación nueva', () => {
    const { component, getPaquetesSubject } = setup(null);
    getPaquetesSubject.next(paquetesBaseMock);
    getPaquetesSubject.complete();

    component.seleccionarPaquete(paquetesBaseMock[0]);

    expect(component.nombre()).toBe('Paquete Base Genérico');
  });
});
