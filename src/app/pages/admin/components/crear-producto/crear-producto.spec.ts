import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CrearProductoComponent } from './crear-producto';
import { PlantillaService } from '@app/services/plantilla/plantilla.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { VarianteService } from '@app/services/variantes/variante.service';
import { ToastService } from '@app/services/toast/toast.service';
import { NgIconsModule } from '@ng-icons/core';
import { vi } from 'vitest';
import { of } from 'rxjs';

describe('CrearProductoComponent — validaciones del formulario', () => {
  let component: CrearProductoComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearProductoComponent, NgIconsModule.withIcons({})],
      providers: [
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
