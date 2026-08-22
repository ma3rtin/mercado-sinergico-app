import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import { NgIconsModule } from '@ng-icons/core';
import { AdministrarPlantillasComponent } from './administrar-plantillas.component';
import { PlantillaService } from '@app/services/plantilla/plantilla.service';
import { ToastService } from '@app/services/toast/toast.service';
import { of } from 'rxjs';
import { Plantilla } from '@app/models/PlantillaInterfaces/Plantilla';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makePlantilla(overrides: Partial<Plantilla> = {}): Plantilla {
  return {
    id: 1,
    nombre: 'Plantilla Test',
    ...overrides,
  } as Plantilla;
}

// ── Setup ──────────────────────────────────────────────────────────────────────

describe('AdministrarPlantillasComponent', () => {
  let plantillaServiceSpy: Partial<PlantillaService>;
  let toastSpy: Partial<ToastService>;

  beforeEach(() => {
    plantillaServiceSpy = {
      getPlantillas: vi.fn().mockReturnValue(of([])),
      crearPlantilla: vi.fn(),
      eliminarPlantilla: vi.fn(),
    };

    toastSpy = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [AdministrarPlantillasComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        importProvidersFrom(NgIconsModule.withIcons({})),
        { provide: PlantillaService, useValue: plantillaServiceSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    });
  });

  // ── Bug #2 y #3 — filteredPlantillas (búsqueda y orden) ─────────────────────

  describe('filteredPlantillas() — búsqueda y ordenamiento (bugs #2 y #3)', () => {
    it('devuelve todas las plantillas cuando el término de búsqueda está vacío', () => {
      const comp = TestBed.createComponent(AdministrarPlantillasComponent).componentInstance;
      comp.plantillas.set([
        makePlantilla({ id: 1, nombre: 'Yogur' }),
        makePlantilla({ id: 2, nombre: 'Aceite' }),
      ]);
      comp.searchTerm.set('');
      expect(comp.filteredPlantillas().length).toBe(2);
    });

    it('filtra plantillas cuyo nombre incluye el término buscado (case-insensitive)', () => {
      const comp = TestBed.createComponent(AdministrarPlantillasComponent).componentInstance;
      comp.plantillas.set([
        makePlantilla({ id: 1, nombre: 'Yogur Natural' }),
        makePlantilla({ id: 2, nombre: 'Aceite de Oliva' }),
      ]);
      comp.searchTerm.set('aceite');
      const result = comp.filteredPlantillas();
      expect(result.length).toBe(1);
      expect(result[0].nombre).toBe('Aceite de Oliva');
    });

    it('devuelve lista vacía cuando ningún nombre coincide con el término', () => {
      const comp = TestBed.createComponent(AdministrarPlantillasComponent).componentInstance;
      comp.plantillas.set([makePlantilla({ nombre: 'Yogur' })]);
      comp.searchTerm.set('xyz123');
      expect(comp.filteredPlantillas().length).toBe(0);
    });

    it('ordena ascendente (A-Z) cuando sortOrder es "asc"', () => {
      const comp = TestBed.createComponent(AdministrarPlantillasComponent).componentInstance;
      comp.plantillas.set([
        makePlantilla({ id: 1, nombre: 'Zanahoria' }),
        makePlantilla({ id: 2, nombre: 'Aceite' }),
        makePlantilla({ id: 3, nombre: 'Miel' }),
      ]);
      comp.sortOrder.set('asc');
      const nombres = comp.filteredPlantillas().map(p => p.nombre);
      expect(nombres).toEqual(['Aceite', 'Miel', 'Zanahoria']);
    });

    it('ordena descendente (Z-A) cuando sortOrder es "desc" — verifica que el fix del bug #2 funciona', () => {
      const comp = TestBed.createComponent(AdministrarPlantillasComponent).componentInstance;
      comp.plantillas.set([
        makePlantilla({ id: 1, nombre: 'Zanahoria' }),
        makePlantilla({ id: 2, nombre: 'Aceite' }),
        makePlantilla({ id: 3, nombre: 'Miel' }),
      ]);
      comp.sortOrder.set('desc');
      const nombres = comp.filteredPlantillas().map(p => p.nombre);
      expect(nombres).toEqual(['Zanahoria', 'Miel', 'Aceite']);
    });

    it('combina filtrado y ordenamiento: filtra primero y luego ordena el resultado', () => {
      const comp = TestBed.createComponent(AdministrarPlantillasComponent).componentInstance;
      comp.plantillas.set([
        makePlantilla({ id: 1, nombre: 'Aceite de Oliva' }),
        makePlantilla({ id: 2, nombre: 'Aceite de Girasol' }),
        makePlantilla({ id: 3, nombre: 'Yogur Natural' }),
      ]);
      comp.searchTerm.set('aceite');
      comp.sortOrder.set('desc');
      const nombres = comp.filteredPlantillas().map(p => p.nombre);
      expect(nombres).toEqual(['Aceite de Oliva', 'Aceite de Girasol']);
    });
  });

  // ── Modales ───────────────────────────────────────────────────────────────────

  describe('gestión de modales', () => {
    it('openCreateModal() abre el modal y limpia plantillaToEdit', () => {
      const comp = TestBed.createComponent(AdministrarPlantillasComponent).componentInstance;
      comp.plantillaToEdit.set(makePlantilla());
      comp.openCreateModal();
      expect(comp.isCreateModalOpen()).toBe(true);
      expect(comp.plantillaToEdit()).toBeUndefined();
    });

    it('openEditModal(plantilla) abre el modal con la plantilla a editar', () => {
      const comp = TestBed.createComponent(AdministrarPlantillasComponent).componentInstance;
      const plantilla = makePlantilla({ id: 42, nombre: 'Plantilla Editable' });
      comp.openEditModal(plantilla);
      expect(comp.isCreateModalOpen()).toBe(true);
      expect(comp.plantillaToEdit()).toEqual(plantilla);
    });

    it('closeCreateModal() cierra el modal', () => {
      const comp = TestBed.createComponent(AdministrarPlantillasComponent).componentInstance;
      comp.isCreateModalOpen.set(true);
      comp.closeCreateModal();
      expect(comp.isCreateModalOpen()).toBe(false);
    });
  });

  // ── CRUD ──────────────────────────────────────────────────────────────────────

  describe('onPlantillaCreated()', () => {
    it('agrega la nueva plantilla a la lista cuando no estaba editando (plantillaToEdit undefined)', () => {
      const comp = TestBed.createComponent(AdministrarPlantillasComponent).componentInstance;
      comp.plantillas.set([makePlantilla({ id: 1, nombre: 'Existente' })]);
      comp.plantillaToEdit.set(undefined);
      comp.onPlantillaCreated(makePlantilla({ id: 2, nombre: 'Nueva' }));
      expect(comp.plantillas().length).toBe(2);
      expect(comp.plantillas()[1].nombre).toBe('Nueva');
    });

    it('reemplaza la plantilla existente en la lista cuando estaba en modo edición', () => {
      const comp = TestBed.createComponent(AdministrarPlantillasComponent).componentInstance;
      const original = makePlantilla({ id: 5, nombre: 'Original' });
      comp.plantillas.set([original]);
      comp.plantillaToEdit.set(original);
      comp.onPlantillaCreated(makePlantilla({ id: 5, nombre: 'Actualizada' }));
      expect(comp.plantillas().length).toBe(1);
      expect(comp.plantillas()[0].nombre).toBe('Actualizada');
    });

    it('cierra el modal y limpia plantillaToEdit después de crear o editar', () => {
      const comp = TestBed.createComponent(AdministrarPlantillasComponent).componentInstance;
      comp.isCreateModalOpen.set(true);
      comp.plantillaToEdit.set(makePlantilla());
      comp.onPlantillaCreated(makePlantilla({ id: 99 }));
      expect(comp.isCreateModalOpen()).toBe(false);
      expect(comp.plantillaToEdit()).toBeUndefined();
    });
  });
});
