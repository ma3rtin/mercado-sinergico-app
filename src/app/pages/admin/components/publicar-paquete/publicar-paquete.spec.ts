import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { NgIconsModule } from '@ng-icons/core';
import { PublicarPaqueteComponent } from './publicar-paquete';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { PaqueteBaseService } from '@app/services/paquete/paquete-base.service';
import { ZonaService } from '@app/services/zona/zona.service';
import { ToastService } from '@app/services/toast/toast.service';
import { of } from 'rxjs';
import { TipoPaquete } from '@app/models/Enums';

// ── Setup ──────────────────────────────────────────────────────────────────────

describe('PublicarPaqueteComponent', () => {
  let paquetePublicadoSpy: Partial<PaquetePublicadoService>;
  let paqueteBaseSpy: Partial<PaqueteBaseService>;
  let zonaSpy: Partial<ZonaService>;
  let toastSpy: Partial<ToastService>;

  beforeEach(() => {
    paquetePublicadoSpy = {
      getPaqueteById: vi.fn().mockReturnValue(of({
        id_paquete_publicado: 1,
        nombre: 'Ronda Existente',
        paqueteBase: { id_paquete_base: 1, nombre: 'Base Test' },
        estado: { id_estado: 2, nombre: 'Activo' },
        zonaId: 1,
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

    zonaSpy = {
      getZonas: vi.fn().mockReturnValue(of([{ id_zona: 1, nombre: 'Zona Norte' }])),
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
        provideRouter([]),
        importProvidersFrom(NgIconsModule.withIcons({})),
        { provide: PaquetePublicadoService, useValue: paquetePublicadoSpy },
        { provide: PaqueteBaseService, useValue: paqueteBaseSpy },
        { provide: ZonaService, useValue: zonaSpy },
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
      comp.zonaSeleccionada.set(1);
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
      comp.zonaSeleccionada.set(1);
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
      comp.zonaSeleccionada.set(1);
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
      comp.zonaSeleccionada.set(1);
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
      comp.zonaSeleccionada.set(1);
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
      comp.zonaSeleccionada.set(1);
      comp.estadoSeleccionado.set(2);
      comp.fechaInicio.set('2026-08-01');
      comp.fechaFin.set('');

      comp.publicarPaquete();

      expect(toastSpy.error).toHaveBeenCalled();
      expect(paquetePublicadoSpy.createPaquete).not.toHaveBeenCalled();
    });
  });

  // ── Validación de descuento ───────────────────────────────────────────────────

  describe('publicarPaquete() — validación de descuento', () => {
    it('muestra error si el descuento es negativo', () => {
      const comp = TestBed.createComponent(PublicarPaqueteComponent).componentInstance;
      comp.nombre.set('Test');
      comp.paqueteBaseSeleccionado.set(1);
      comp.zonaSeleccionada.set(1);
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
      comp.zonaSeleccionada.set(1);
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
      comp.zonaSeleccionada.set(1);
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
      comp.zonaSeleccionada.set(2);
      comp.descuento.set(10);
      comp.cantProductos.set(50);

      comp.reiniciarFormulario();

      expect(comp.nombre()).toBe('');
      expect(comp.paqueteBaseSeleccionado()).toBeNull();
      expect(comp.zonaSeleccionada()).toBeNull();
      expect(comp.descuento()).toBeNull();
      expect(comp.cantProductos()).toBeNull();
      expect(comp.estadoSeleccionado()).toBe(2); // default Activo
    });
  });
});
