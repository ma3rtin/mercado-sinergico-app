import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { featherArrowLeft, featherCheck, featherInfo, featherPlus, featherSearch, featherUpload, featherUsers, featherZap } from '@ng-icons/feather-icons';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CrearProductoComponent } from './crear-producto';
import { PlantillaService } from '@app/services/plantilla/plantilla.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { VarianteService } from '@app/services/variantes/variante.service';
import { ToastService } from '@app/services/toast/toast.service';

const DIMENSION_FIELDS = ['altura', 'ancho', 'profundidad', 'peso'] as const;

describe('CrearProductoComponent', () => {
  let component: CrearProductoComponent;
  let fixture: ComponentFixture<CrearProductoComponent>;
  let productoServiceMock: { createProduct: ReturnType<typeof vi.fn> };
  let toastServiceMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(async () => {
    productoServiceMock = { createProduct: vi.fn(() => of({ id_producto: 1 })) };
    toastServiceMock = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CrearProductoComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideRouter([]),
        provideIcons({
          featherArrowLeft,
          featherCheck,
          featherInfo,
          featherPlus,
          featherSearch,
          featherUpload,
          featherUsers,
          featherZap,
        }),
        { provide: PlantillaService, useValue: { getPlantillas: vi.fn(() => of([])) } },
        { provide: MarcaService, useValue: { getMarcas: vi.fn(() => of([])) } },
        { provide: CategoriaService, useValue: { getCategorias: vi.fn(() => of([])) } },
        { provide: ProductosService, useValue: productoServiceMock },
        { provide: VarianteService, useValue: { generarVariantes: vi.fn(() => of({ variantes: [] })) } },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getInputByFormControlName(name: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`app-input[formcontrolname="${name}"] input`);
  }

  describe('validación de dimensiones', () => {
    it('rechaza el valor 0 en altura, ancho, profundidad y peso', () => {
      DIMENSION_FIELDS.forEach((field) => {
        component.productForm.get(field)!.setValue(0);
        expect(component.productForm.get(field)!.invalid).toBe(true);
      });
    });

    it('rechaza números negativos', () => {
      DIMENSION_FIELDS.forEach((field) => {
        component.productForm.get(field)!.setValue(-1);
        expect(component.productForm.get(field)!.invalid).toBe(true);
      });
    });

    it('acepta valores decimales mayores a 0', () => {
      DIMENSION_FIELDS.forEach((field) => {
        component.productForm.get(field)!.setValue(0.5);
        expect(component.productForm.get(field)!.valid).toBe(true);
      });
      component.productForm.get('peso')!.setValue('1.25');
      expect(component.productForm.get('peso')!.valid).toBe(true);
    });

    it('acepta null (dimensiones opcionales)', () => {
      DIMENSION_FIELDS.forEach((field) => {
        component.productForm.get(field)!.setValue(null);
        expect(component.productForm.get(field)!.valid).toBe(true);
      });
    });

    it('aplica el máximo de 10000', () => {
      DIMENSION_FIELDS.forEach((field) => {
        component.productForm.get(field)!.setValue(10001);
        expect(component.productForm.get(field)!.errors?.['max']).toBeTruthy();
      });
    });

    it('muestra mensajes de error acordes a cada campo', () => {
      component.productForm.get('altura')!.setValue(0);
      expect(component.getErrorMessage('altura')).toBe('La altura debe ser mayor a 0');
      component.productForm.get('ancho')!.setValue(0);
      expect(component.getErrorMessage('ancho')).toBe('El ancho debe ser mayor a 0');
      component.productForm.get('profundidad')!.setValue(0);
      expect(component.getErrorMessage('profundidad')).toBe('La profundidad debe ser mayor a 0');
      component.productForm.get('peso')!.setValue(0);
      expect(component.getErrorMessage('peso')).toBe('El peso debe ser mayor a 0');
    });
  });

  describe('template de dimensiones', () => {
    it('renderiza step="0.01" en los inputs de altura, ancho, profundidad y peso', () => {
      DIMENSION_FIELDS.forEach((field) => {
        const input = getInputByFormControlName(field);
        expect(input).toBeTruthy();
        expect(input.getAttribute('step')).toBe('0.01');
      });
    });
  });

  describe('submit', () => {
    it('no llama a createProduct cuando una dimensión es 0', () => {
      component.productForm.get('peso')!.setValue(0);
      component.onSubmit();
      expect(toastServiceMock.error).toHaveBeenCalled();
      expect(productoServiceMock.createProduct).not.toHaveBeenCalled();
    });

    it('no llama a createProduct cuando el formulario es inválido', () => {
      component.onSubmit();
      expect(productoServiceMock.createProduct).not.toHaveBeenCalled();
    });
  });
});



describe('CrearProductoComponent — validaciones del formulario', () => {
  let component: CrearProductoComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearProductoComponent],
      providers: [
        provideIcons({
          featherArrowLeft,
          featherCheck,
          featherInfo,
          featherPlus,
          featherSearch,
          featherUpload,
          featherUsers,
          featherZap,
        }),
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: PlantillaService, useValue: { getPlantillas: () => of([]) } },
        { provide: MarcaService, useValue: { getMarcas: () => of([]) } },
        { provide: CategoriaService, useValue: { getCategorias: () => of([]) } },
        { provide: ProductosService, useValue: { createProduct: () => of({}) } },
        { provide: VarianteService, useValue: { generarVariantes: () => of({}) } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn(), info: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CrearProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('descripcion', () => {
    it('debe ser inválido cuando está vacío (error required)', () => {
      const control = component.productForm.get('descripcion');
      control?.setValue('');
      expect(control?.invalid).toBe(true);
      expect(control?.errors?.['required']).toBeTruthy();
    });

    it('debe tener error minlength cuando tiene menos de 10 caracteres', () => {
      const control = component.productForm.get('descripcion');
      control?.setValue('abcde');
      expect(control?.errors?.['minlength']).toBeTruthy();
      expect(control?.errors?.['minlength'].requiredLength).toBe(10);
    });

    it('debe tener error maxlength cuando tiene más de 500 caracteres', () => {
      const control = component.productForm.get('descripcion');
      const textoLargo = 'a'.repeat(501);
      control?.setValue(textoLargo);
      expect(control?.errors?.['maxlength']).toBeTruthy();
      expect(control?.errors?.['maxlength'].requiredLength).toBe(500);
    });
  });

  describe('nombre', () => {
    it('debe tener error maxlength cuando tiene más de 100 caracteres', () => {
      const control = component.productForm.get('nombre');
      const textoLargo = 'a'.repeat(101);
      control?.setValue(textoLargo);
      expect(control?.errors?.['maxlength']).toBeTruthy();
      expect(control?.errors?.['maxlength'].requiredLength).toBe(100);
    });
  });

  describe('precio', () => {
    it('debe tener error max cuando supera el máximo definido', () => {
      const control = component.productForm.get('precio');
      control?.setValue(100000000);
      expect(control?.errors?.['max']).toBeTruthy();
      expect(control?.errors?.['max'].max).toBe(99999999);
    });
  });

  describe('getErrorMessage', () => {
    it('debe devolver el mensaje exacto para maxlength en descripcion', () => {
      const control = component.productForm.get('descripcion');
      const textoLargo = 'a'.repeat(501);
      control?.setValue(textoLargo);
      control?.markAsTouched();

      const mensaje = component.getErrorMessage('descripcion');
      expect(mensaje).toBe('La descripción no puede superar los 500 caracteres');
    });
  });

  describe('getFieldLabel', () => {
    it('debe devolver "La descripción" para el campo descripcion', () => {
      const label = (component as any).getFieldLabel('descripcion');
      expect(label).toBe('La descripción');
    });
  });

  describe('happy path', () => {
    it('no debe tener errores con valores válidos', () => {
      const control = component.productForm.get('descripcion');
      control?.setValue('Una descripción de longitud válida y correcta.');
      expect(control?.valid).toBe(true);
    });
  });
});
