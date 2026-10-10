import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import { featherArrowLeft, featherPlus, featherSearch, featherX } from '@ng-icons/feather-icons';
import { PublicarPaqueteComponent } from './publicar-paquete';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { PaqueteBaseService } from '@app/services/paquete/paquete-base.service';
import { ZonaService } from '@app/services/zona/zona.service';
import { ToastService } from '@app/services/toast/toast.service';
import { of, Subject } from 'rxjs';
import { TipoPaquete } from '@app/models/Enums';

// ── Setup ──────────────────────────────────────────────────────────────────────

describe('PublicarPaqueteComponent', () => {
  let paquetePublicadoSpy: Partial<PaquetePublicadoService>;
  let paqueteBaseSpy: Partial<PaqueteBaseService>;
  let toastSpy: Partial<ToastService>;

  beforeEach(() => {
    paquetePublicadoSpy = {
      getPaqueteById: vi.fn().mockReturnValue(of({
        id_paquete_publicado: 1,
        nombre: 'Ronda Existente',
        paqueteBase: { id_paquete_base: 1, nombre: 'Base Test' },
        estado: { id_estado: 2, nombre: 'Activo' },

      })),
      createPaquete: vi.fn().mockReturnValue(of({ id_paquete_publicado: 100 })),
      updatePaquete: vi.fn().mockReturnValue(of({ id_paquete_publicado: 1 })),
    };

    paqueteBaseSpy = {
      getPaquetes: vi.fn().mockReturnValue(of([
        { id_paquete_base: 1, nombre: 'Base Sinérgico', tipo: TipoPaquete.SINERGICO },
        { id_paquete_base: 2, nombre: 'Base Enérgico', tipo: TipoPaquete.ENERGICO },
      ])),
    };


    toastSpy = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [PublicarPaqueteComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
        importProvidersFrom(NgIconsModule.withIcons({})),
        { provide: PaquetePublicadoService, useValue: paquetePublicadoSpy },
        { provide: PaqueteBaseService, useValue: paqueteBaseSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    });
  });

  // ── Bug #1 — validación del campo nombre ─────────────────────────────────────

  describe('publicarPaquete() — validación campo nombre (bug #1)', () => {
    it('muestra error de validación cuando el nombre está vacío y no llama al servicio', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.nombre.set('');
      comp.paqueteBaseSeleccionado.set(1);
      comp.estadoSeleccionado.set(2);
      comp.fechaInicio.set('2026-08-01');
      comp.fechaFin.set('2026-09-01');

      comp.publicarPaquete();

      expect(toastSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('nombre'),
        expect.any(String)
      );
      expect(paquetePublicadoSpy.createPaquete).not.toHaveBeenCalled();
    });

    it('muestra error de validación cuando el nombre tiene solo espacios', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.nombre.set('   ');
      comp.paqueteBaseSeleccionado.set(1);
      comp.estadoSeleccionado.set(2);
      comp.fechaInicio.set('2026-08-01');
      comp.fechaFin.set('2026-09-01');

      comp.publicarPaquete();

      expect(toastSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('nombre'),
        expect.any(String)
      );
      expect(paquetePublicadoSpy.createPaquete).not.toHaveBeenCalled();
    });

    it('llama a createPaquete cuando el nombre es válido junto con todos los campos requeridos', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.nombre.set('Ronda Agosto 2026');
      comp.paqueteBaseSeleccionado.set(1);
      comp.estadoSeleccionado.set(2);
      comp.fechaInicio.set('2026-08-01');
      comp.fechaFin.set('2026-09-01');

      comp.publicarPaquete();

      expect(paquetePublicadoSpy.createPaquete).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Ronda Agosto 2026' })
      );
    });

    it('incluye el nombre en el payload enviado al backend', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.nombre.set('Mi Ronda Test');
      comp.paqueteBaseSeleccionado.set(1);
      comp.estadoSeleccionado.set(2);
      comp.fechaInicio.set('2026-08-01');
      comp.fechaFin.set('2026-09-01');

      comp.publicarPaquete();

      const payload = (paquetePublicadoSpy.createPaquete as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(payload.nombre).toBe('Mi Ronda Test');
    });
  });

  // ── Validaciones de fecha ─────────────────────────────────────────────────────

  describe('publicarPaquete() — validación de fechas', () => {
    it('muestra error cuando fecha_fin es anterior a fecha_inicio', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.nombre.set('Test');
      comp.paqueteBaseSeleccionado.set(1);
      comp.estadoSeleccionado.set(2);
      comp.fechaInicio.set('2026-09-01');
      comp.fechaFin.set('2026-08-01'); // anterior al inicio

      comp.publicarPaquete();

      expect(toastSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('fecha'),
        expect.any(String)
      );
    });

    it('muestra error cuando no se ingresa fecha de fin', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.nombre.set('Test');
      comp.paqueteBaseSeleccionado.set(1);
      comp.estadoSeleccionado.set(2);
      comp.fechaInicio.set('2026-08-01');
      comp.fechaFin.set('');

      comp.publicarPaquete();

      expect(toastSpy.error).toHaveBeenCalled();
      expect(paquetePublicadoSpy.createPaquete).not.toHaveBeenCalled();
    });
  });

  describe('publicarPaquete() — validación de cantidad', () => {
    it('rechaza cantidades menores que uno', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.nombre.set('Test');
      comp.paqueteBaseSeleccionado.set(1);
      comp.estadoSeleccionado.set(2);
      comp.fechaInicio.set('2026-08-01');
      comp.fechaFin.set('2026-09-01');
      comp.cantProductos.set(0);

      comp.publicarPaquete();

      expect(toastSpy.error).toHaveBeenCalledWith(expect.stringContaining('cantidad'), expect.any(String));
      expect(paquetePublicadoSpy.createPaquete).not.toHaveBeenCalled();
    });

    it('rechaza cantidades decimales', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.nombre.set('Test');
      comp.paqueteBaseSeleccionado.set(1);
      comp.estadoSeleccionado.set(2);
      comp.fechaInicio.set('2026-08-01');
      comp.fechaFin.set('2026-09-01');
      comp.cantProductos.set(2.5);

      comp.publicarPaquete();

      expect(toastSpy.error).toHaveBeenCalledWith(expect.stringContaining('cantidad'), expect.any(String));
    });
  });

  // ── Validación de descuento ───────────────────────────────────────────────────

  describe('publicarPaquete() — validación de descuento', () => {
    it('muestra error si el descuento es negativo', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.nombre.set('Test');
      comp.paqueteBaseSeleccionado.set(1);
      comp.estadoSeleccionado.set(2);
      comp.fechaInicio.set('2026-08-01');
      comp.fechaFin.set('2026-09-01');
      comp.descuento.set(-5);

      comp.publicarPaquete();

      expect(toastSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('descuento'),
        expect.any(String)
      );
    });

    it('muestra error si el descuento supera 100', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.nombre.set('Test');
      comp.paqueteBaseSeleccionado.set(1);
      comp.estadoSeleccionado.set(2);
      comp.fechaInicio.set('2026-08-01');
      comp.fechaFin.set('2026-09-01');
      comp.descuento.set(150);

      comp.publicarPaquete();

      expect(toastSpy.error).toHaveBeenCalled();
    });

    it('permite descuento null (campo opcional)', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.nombre.set('Test sin descuento');
      comp.paqueteBaseSeleccionado.set(1);
      comp.estadoSeleccionado.set(2);
      comp.fechaInicio.set('2026-08-01');
      comp.fechaFin.set('2026-09-01');
      comp.descuento.set(null);

      comp.publicarPaquete();

      expect(paquetePublicadoSpy.createPaquete).toHaveBeenCalled();
    });
  });

  // ── Computed: tipo de paquete ─────────────────────────────────────────────────

  describe('tipoPaqueteSeleccionado(), isEnergico(), isSinergico()', () => {
    it('isEnergico() es true cuando el paquete base seleccionado es de tipo ENERGICO', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.paquetesBase.set([
        { id_paquete_base: 1, nombre: 'Base', tipo: TipoPaquete.ENERGICO },
      ]);
      comp.paqueteBaseSeleccionado.set(1);
      expect(comp.isEnergico()).toBe(true);
      expect(comp.isSinergico()).toBe(false);
    });

    it('isSinergico() es true cuando el paquete base seleccionado es de tipo SINERGICO', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.paquetesBase.set([
        { id_paquete_base: 2, nombre: 'Base', tipo: TipoPaquete.SINERGICO },
      ]);
      comp.paqueteBaseSeleccionado.set(2);
      expect(comp.isSinergico()).toBe(true);
      expect(comp.isEnergico()).toBe(false);
    });

    it('tipoPaqueteSeleccionado() es null cuando no hay paquete base seleccionado', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.paqueteBaseSeleccionado.set(null);
      expect(comp.tipoPaqueteSeleccionado()).toBeNull();
    });
  });

  // ── setDescuento ──────────────────────────────────────────────────────────────

  describe('setDescuento()', () => {
    it('asigna null cuando recibe null, string vacío o undefined', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.setDescuento(null);
      expect(comp.descuento()).toBeNull();
      comp.setDescuento('');
      expect(comp.descuento()).toBeNull();
    });

    it('parsea correctamente un string numérico a número', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.setDescuento('15');
      expect(comp.descuento()).toBe(15);
    });

    it('asigna null para valores no numéricos', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.setDescuento('abc');
      expect(comp.descuento()).toBeNull();
    });
  });

  // ── reiniciarFormulario ───────────────────────────────────────────────────────

  describe('reiniciarFormulario()', () => {
    it('limpia todos los campos del formulario incluyendo nombre', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.nombre.set('Ronda que se borra');
      comp.paqueteBaseSeleccionado.set(5);
      comp.descuento.set(10);
      comp.cantProductos.set(50);

      comp.reiniciarFormulario();

      expect(comp.nombre()).toBe('');
      expect(comp.paqueteBaseSeleccionado()).toBeNull();
      expect(comp.descuento()).toBeNull();
      expect(comp.cantProductos()).toBeNull();
    });
  });
});

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
