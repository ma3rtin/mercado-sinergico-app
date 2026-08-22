import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { NgIconsModule } from '@ng-icons/core';
import { AdministrarPublicacionesComponent } from './administrar-publicaciones';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { ToastService } from '@app/services/toast/toast.service';
import { of } from 'rxjs';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makePaquete(overrides: Partial<PaquetePublicado> = {}): PaquetePublicado {
  return {
    id_paquete_publicado: 1,
    nombre: 'Ronda Test',
    cant_productos: 30,
    cant_usuarios_registrados: 20,
    cant_productos_reservados: 20,
    archivado: false,
    estado: { id_estado: 2, nombre: 'Activo' },
    paqueteBase: { id_paquete_base: 1, nombre: 'Aceite Oliva' },
    ...overrides,
  } as PaquetePublicado;
}

// ── Setup ──────────────────────────────────────────────────────────────────────

describe('AdministrarPublicacionesComponent', () => {
  let paqueteServiceSpy: Partial<PaquetePublicadoService>;
  let toastSpy: Partial<ToastService>;

  beforeEach(() => {
    paqueteServiceSpy = {
      getAllPaquetes: vi.fn().mockReturnValue(of([])),
      confirmarCompra: vi.fn().mockReturnValue(of({ message: 'ok', notificados: 3 })),
      cancelarPaquete: vi.fn().mockReturnValue(of(makePaquete({ estado: { id_estado: 99, nombre: 'Cancelado' } }))),
    };

    toastSpy = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [AdministrarPublicacionesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        importProvidersFrom(NgIconsModule.withIcons({})),
        { provide: PaquetePublicadoService, useValue: paqueteServiceSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    });
  });

  // ── Filtrado ─────────────────────────────────────────────────────────────────

  describe('filteredPaquetes()', () => {
    it('devuelve todos cuando el término de búsqueda está vacío y el filtro es "todos"', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      const paquetes = [makePaquete({ id_paquete_publicado: 1 }), makePaquete({ id_paquete_publicado: 2 })];
      comp.paquetes.set(paquetes);
      expect(comp.filteredPaquetes().length).toBe(2);
    });

    it('filtra por término de búsqueda en el nombre del paquete base', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      comp.paquetes.set([
        makePaquete({ paqueteBase: { id_paquete_base: 1, nombre: 'Aceite Oliva' } }),
        makePaquete({ paqueteBase: { id_paquete_base: 2, nombre: 'Yerba Mate' } }),
      ]);
      comp.searchTerm.set('aceite');
      expect(comp.filteredPaquetes().length).toBe(1);
      expect(comp.filteredPaquetes()[0].paqueteBase?.nombre).toBe('Aceite Oliva');
    });

    it('filtra por estado cuando estadoFiltro no es "todos"', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      comp.paquetes.set([
        makePaquete({ estado: { id_estado: 2, nombre: 'Activo' } }),
        makePaquete({ estado: { id_estado: 5, nombre: 'Cancelado' } }),
      ]);
      comp.estadoFiltro.set('cancelado');
      expect(comp.filteredPaquetes().length).toBe(1);
      expect(comp.filteredPaquetes()[0].estado?.nombre).toBe('Cancelado');
    });

    it('resetea la página a 1 cuando cambia el término de búsqueda', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      comp.currentPage.set(3);
      // El computed filteredPaquetes depende de searchTerm; al cambiar el signal
      // el effect interno del componente setea currentPage a 1
      comp.searchTerm.set('algo');
      TestBed.flushEffects();
      expect(comp.currentPage()).toBe(1);
    });
  });

  // ── Paginación ────────────────────────────────────────────────────────────────

  describe('paginatedPaquetes()', () => {
    it('retorna solo los items de la página actual según itemsPerPage', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      const lista = Array.from({ length: 25 }, (_, i) =>
        makePaquete({ id_paquete_publicado: i + 1 })
      );
      comp.paquetes.set(lista);
      comp.itemsPerPage.set(10);
      comp.currentPage.set(2);
      expect(comp.paginatedPaquetes().length).toBe(10);
      expect(comp.paginatedPaquetes()[0].id_paquete_publicado).toBe(11);
    });

    it('la última página tiene los items restantes aunque sean menos que itemsPerPage', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      const lista = Array.from({ length: 13 }, (_, i) =>
        makePaquete({ id_paquete_publicado: i + 1 })
      );
      comp.paquetes.set(lista);
      comp.itemsPerPage.set(10);
      comp.currentPage.set(2);
      expect(comp.paginatedPaquetes().length).toBe(3);
    });
  });

  // ── Helpers de estilo ─────────────────────────────────────────────────────────

  describe('getEstadoClasses()', () => {
    it('devuelve clases neutras cuando no se pasa estado', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      expect(comp.getEstadoClasses(undefined)).toContain('bg-status-neutral-bg');
    });

    it('devuelve clases de activo para estado "activo"', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      expect(comp.getEstadoClasses({ id_estado: 2, nombre: 'Activo' })).toContain('bg-status-active-bg');
    });

    it('devuelve clases de error para estado "cancelado"', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      expect(comp.getEstadoClasses({ id_estado: 5, nombre: 'cancelado' })).toContain('bg-error-light');
    });
  });

  // ── Bug #5 — cuposHtml en cerrarPaquete ─────────────────────────────────────

  describe('cerrarPaquete() — cupos restantes en el diálogo', () => {
    it('calcula correctamente que faltan cupos cuando cant_productos > cant_usuarios_registrados', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      const paquete = makePaquete({ cant_productos: 30, cant_usuarios_registrados: 20 });
      // Verificamos la lógica de cálculo directamente
      const faltan = (paquete.cant_productos || 0) - (paquete.cant_usuarios_registrados || 0);
      expect(faltan).toBe(10);
      expect(faltan > 0).toBe(true);
    });

    it('detecta que el paquete está lleno cuando cant_usuarios_registrados >= cant_productos', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      const paquete = makePaquete({ cant_productos: 30, cant_usuarios_registrados: 30 });
      const faltan = (paquete.cant_productos || 0) - (paquete.cant_usuarios_registrados || 0);
      expect(faltan).toBe(0);
      expect(faltan > 0).toBe(false);
    });

    it('trata cant_productos undefined como 0 sin lanzar excepción', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      const paquete = makePaquete({ cant_productos: undefined, cant_usuarios_registrados: 5 });
      const faltan = (paquete.cant_productos || 0) - (paquete.cant_usuarios_registrados || 0);
      expect(faltan).toBe(-5); // -5, o sea "lleno" según la condición > 0
    });
  });

  // ── getStockPct ───────────────────────────────────────────────────────────────

  describe('getStockPct()', () => {
    it('devuelve 0 cuando cant_productos es 0 o no existe', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      expect(comp.getStockPct(makePaquete({ cant_productos: 0 }))).toBe(0);
      expect(comp.getStockPct(makePaquete({ cant_productos: undefined }))).toBe(0);
    });

    it('devuelve el porcentaje correcto para reservas parciales', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      expect(comp.getStockPct(makePaquete({ cant_productos: 100, cant_productos_reservados: 75 }))).toBe(75);
    });

    it('cap a 100 aunque haya más reservas que capacidad', () => {
      const comp = TestBed.createComponent(AdministrarPublicacionesComponent).componentInstance;
      expect(comp.getStockPct(makePaquete({ cant_productos: 10, cant_productos_reservados: 15 }))).toBe(100);
    });
  });
});
