import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { NgIconsModule } from '@ng-icons/core';
import { PerfilAdmin } from './perfil-admin';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { ToastService } from '@app/services/toast/toast.service';
import { of, throwError } from 'rxjs';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makePaquete(overrides: Partial<PaquetePublicado> = {}): PaquetePublicado {
  return {
    id_paquete_publicado: 1,
    nombre: 'Test',
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

describe('PerfilAdmin', () => {
  let paqueteServiceSpy: Partial<PaquetePublicadoService>;
  let usuarioServiceSpy: Partial<UsuarioService>;
  let toastSpy: Partial<ToastService>;
  let router: Router;

  beforeEach(() => {
    paqueteServiceSpy = {
      getAllPaquetes: vi.fn().mockReturnValue(of([])),
      duplicarPaquete: vi.fn().mockReturnValue(of({ id_paquete_publicado: 99 })),
      archivarPaquete: vi.fn().mockReturnValue(of({})),
      exportarFabrica: vi.fn().mockReturnValue(of(new Blob())),
      exportarLogistica: vi.fn().mockReturnValue(of(new Blob())),
      confirmarCompra: vi.fn().mockReturnValue(of({ message: 'ok', notificados: 2 })),
      cancelarPaquete: vi.fn().mockReturnValue(of({})),
    };

    usuarioServiceSpy = {
      getPerfil: vi.fn().mockReturnValue(of({ nombre: 'Admin Test', email: 'admin@test.com' })),
    };

    toastSpy = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [PerfilAdmin],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        importProvidersFrom(NgIconsModule.withIcons({})),
        { provide: PaquetePublicadoService, useValue: paqueteServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    });

    router = TestBed.inject(Router);
  });

  // ── Bug #6 — duplicarPaquete navega al formulario de edición ─────────────────

  describe('duplicarPaquete() — bug #6', () => {
    it('navega a /admin/publicar-paquete con el duplicadoId correcto tras duplicar', () => {
      const comp = TestBed.createComponent(PerfilAdmin).componentInstance;
      const navigateSpy = vi.spyOn(router, 'navigate');
      const paquete = makePaquete({ id_paquete_publicado: 5 });

      comp.duplicarPaquete(paquete);

      expect(navigateSpy).toHaveBeenCalledWith(
        ['/admin/publicar-paquete'],
        { queryParams: { duplicadoId: 99 } }
      );
    });

    it('muestra toast de info (no success) al duplicar para indicar revisión requerida', () => {
      const comp = TestBed.createComponent(PerfilAdmin).componentInstance;
      const paquete = makePaquete();

      comp.duplicarPaquete(paquete);

      expect(toastSpy.info).toHaveBeenCalled();
      expect(toastSpy.success).not.toHaveBeenCalled();
    });

    it('muestra toast de error si la duplicación falla', () => {
      (paqueteServiceSpy.duplicarPaquete as ReturnType<typeof vi.fn>)
        .mockReturnValue(throwError(() => new Error('fallo de red')));

      const comp = TestBed.createComponent(PerfilAdmin).componentInstance;
      comp.duplicarPaquete(makePaquete());

      expect(toastSpy.error).toHaveBeenCalled();
    });
  });

  // ── Bug #7 — loadPaquetesCompletos/Finalizados filtran en cliente ──────────────

  describe('loadPaquetesCompletos() y loadPaquetesFinalizados() — bug #7', () => {
    it('filtra paquetes con estado "completo" sin incluir archivados', () => {
      (paqueteServiceSpy.getAllPaquetes as ReturnType<typeof vi.fn>).mockReturnValue(of([
        makePaquete({ id_paquete_publicado: 1, estado: { id_estado: 3, nombre: 'Completo' }, archivado: false }),
        makePaquete({ id_paquete_publicado: 2, estado: { id_estado: 2, nombre: 'Activo' }, archivado: false }),
        makePaquete({ id_paquete_publicado: 3, estado: { id_estado: 3, nombre: 'Completo' }, archivado: true }),
      ]));

      const comp = TestBed.createComponent(PerfilAdmin).componentInstance;
      comp.loadPaquetesCompletos();

      expect(comp.paquetesCompletos().length).toBe(1);
      expect(comp.paquetesCompletos()[0].id_paquete_publicado).toBe(1);
    });

    it('filtra paquetes con estado "confirmado" sin incluir archivados', () => {
      (paqueteServiceSpy.getAllPaquetes as ReturnType<typeof vi.fn>).mockReturnValue(of([
        makePaquete({ id_paquete_publicado: 1, estado: { id_estado: 4, nombre: 'Confirmado' }, archivado: false }),
        makePaquete({ id_paquete_publicado: 2, estado: { id_estado: 4, nombre: 'Confirmado' }, archivado: true }),
      ]));

      const comp = TestBed.createComponent(PerfilAdmin).componentInstance;
      comp.loadPaquetesCompletos();

      expect(comp.paquetesCompletos().length).toBe(1);
    });

    it('filtra paquetes con estado "recibido" o "cancelado" para finalizados', () => {
      (paqueteServiceSpy.getAllPaquetes as ReturnType<typeof vi.fn>).mockReturnValue(of([
        makePaquete({ id_paquete_publicado: 1, estado: { id_estado: 6, nombre: 'Recibido' }, archivado: false }),
        makePaquete({ id_paquete_publicado: 2, estado: { id_estado: 5, nombre: 'Cancelado' }, archivado: false }),
        makePaquete({ id_paquete_publicado: 3, estado: { id_estado: 2, nombre: 'Activo' }, archivado: false }),
      ]));

      const comp = TestBed.createComponent(PerfilAdmin).componentInstance;
      comp.loadPaquetesFinalizados();

      expect(comp.paquetesFinalizados().length).toBe(2);
    });

    it('resetea paginaActualFinalizados a 1 al recargar finalizados', () => {
      (paqueteServiceSpy.getAllPaquetes as ReturnType<typeof vi.fn>).mockReturnValue(of([]));
      const comp = TestBed.createComponent(PerfilAdmin).componentInstance;
      comp.paginaActualFinalizados.set(3);
      comp.loadPaquetesFinalizados();
      expect(comp.paginaActualFinalizados()).toBe(1);
    });
  });

  // ── Paginación de finalizados ─────────────────────────────────────────────────

  describe('paginación de finalizados', () => {
    it('mostrarPaginacion() es false cuando hay 5 o menos ítems', () => {
      const comp = TestBed.createComponent(PerfilAdmin).componentInstance;
      comp.paquetesFinalizados.set(
        Array.from({ length: 5 }, (_, i) => makePaquete({ id_paquete_publicado: i + 1 }))
      );
      expect(comp.mostrarPaginacion()).toBe(false);
    });

    it('mostrarPaginacion() es true cuando hay más de 5 ítems', () => {
      const comp = TestBed.createComponent(PerfilAdmin).componentInstance;
      comp.paquetesFinalizados.set(
        Array.from({ length: 6 }, (_, i) => makePaquete({ id_paquete_publicado: i + 1 }))
      );
      expect(comp.mostrarPaginacion()).toBe(true);
    });

    it('cambiarPagina() ignora valores fuera de rango (< 1 o > total)', () => {
      const comp = TestBed.createComponent(PerfilAdmin).componentInstance;
      comp.paquetesFinalizados.set(
        Array.from({ length: 6 }, (_, i) => makePaquete({ id_paquete_publicado: i + 1 }))
      );
      comp.paginaActualFinalizados.set(1);
      comp.cambiarPagina(0);
      expect(comp.paginaActualFinalizados()).toBe(1);
      comp.cambiarPagina(999);
      expect(comp.paginaActualFinalizados()).toBe(1);
    });
  });

  // ── Helpers de estado ─────────────────────────────────────────────────────────

  describe('esRecibido() y esCancelado()', () => {
    it('esRecibido() devuelve true solo para estado "recibido" (case-insensitive)', () => {
      const comp = TestBed.createComponent(PerfilAdmin).componentInstance;
      expect(comp.esRecibido(makePaquete({ estado: { id_estado: 6, nombre: 'Recibido' } }))).toBe(true);
      expect(comp.esRecibido(makePaquete({ estado: { id_estado: 5, nombre: 'Cancelado' } }))).toBe(false);
    });

    it('esCancelado() devuelve true solo para estado "cancelado" (case-insensitive)', () => {
      const comp = TestBed.createComponent(PerfilAdmin).componentInstance;
      expect(comp.esCancelado(makePaquete({ estado: { id_estado: 5, nombre: 'Cancelado' } }))).toBe(true);
      expect(comp.esCancelado(makePaquete({ estado: { id_estado: 2, nombre: 'Activo' } }))).toBe(false);
    });
  });

  // ── formatearFecha ────────────────────────────────────────────────────────────

  describe('formatearFecha()', () => {
    it('devuelve N/A cuando la fecha es undefined', () => {
      const comp = TestBed.createComponent(PerfilAdmin).componentInstance;
      expect(comp.formatearFecha(undefined)).toBe('N/A');
    });

    it('retorna una fecha formateada en formato dd/mm/yyyy', () => {
      const comp = TestBed.createComponent(PerfilAdmin).componentInstance;
      const result = comp.formatearFecha('2026-08-15T00:00:00.000Z');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });
});
