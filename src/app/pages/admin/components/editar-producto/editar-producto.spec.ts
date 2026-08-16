import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { featherArrowLeft, featherCheck, featherInfo, featherPlus, featherSearch, featherUpload, featherUsers, featherZap } from '@ng-icons/feather-icons';
import { of } from 'rxjs';

const swalMocks = vi.hoisted(() => ({
  fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
}));

vi.mock('sweetalert2', () => ({
  default: { fire: swalMocks.fire },
}));

import { EditarProductoComponent } from './editar-producto';
import { TipoPaquete } from '@app/models/Enums';
import { ProductosService } from '@app/services/producto/producto.service';
import { PlantillaService } from '@app/services/plantilla/plantilla.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { VarianteService } from '@app/services/variantes/variante.service';
import { ToastService } from '@app/services/toast/toast.service';

const DIMENSION_FIELDS = ['altura', 'ancho', 'profundidad', 'peso'] as const;

const baseMockProducto = {
  id_producto: 1,
  nombre: 'Producto test',
  descripcion: 'Descripción suficientemente larga para el formulario',
  precio: 100,
  stock: 5,
  marca_id: 1,
  marca: { id_marca: 1 },
  categoria_id: 1,
  categoria: { id_categoria: 1 },
  tipo: 'ENERGICO',
  plantilla: null,
  altura: 0.5,
  ancho: 1.25,
  profundidad: 0.1,
  peso: 0.3,
  imagen_url: '/assets/placeholder.png',
  imagenes: [],
};

async function flushTimers(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 20));
}

function configureTestBed(getProductoById: (id: number) => unknown) {
  TestBed.configureTestingModule({
    imports: [EditarProductoComponent],
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
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: { get: (key: string) => (key === 'id' ? '1' : null) } },
        },
      },
      { provide: PlantillaService, useValue: { getPlantillas: () => of([]) } },
      { provide: MarcaService, useValue: { getMarcas: () => of([]) } },
      { provide: CategoriaService, useValue: { getCategorias: () => of([]) } },
      { provide: ProductosService, useValue: { getProductoById } },
      { provide: VarianteService, useValue: { generarVariantes: () => of({ variantes: [] }) } },
      { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } },
    ],
  });
}

describe('EditarProductoComponent', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('con marca/categoría como objetos', () => {
    let component: EditarProductoComponent;
    let fixture: ComponentFixture<EditarProductoComponent>;

    beforeEach(async () => {
      configureTestBed(() => of(baseMockProducto));
      await TestBed.compileComponents();
      fixture = TestBed.createComponent(EditarProductoComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await flushTimers();
      fixture.detectChanges();
    });

    function getInputByFormControlName(name: string): HTMLInputElement {
      return fixture.nativeElement.querySelector(`app-input[formcontrolname="${name}"] input`);
    }

    it('carga las dimensiones decimales sin truncarlas', () => {
      expect(component.productForm.get('altura')!.value).toBe(0.5);
      expect(component.productForm.get('ancho')!.value).toBe(1.25);
      expect(component.productForm.get('profundidad')!.value).toBe(0.1);
      expect(component.productForm.get('peso')!.value).toBe(0.3);
    });

    it('rechaza el valor 0 en las dimensiones', () => {
      DIMENSION_FIELDS.forEach((field) => {
        component.productForm.get(field)!.setValue(0);
        expect(component.productForm.get(field)!.invalid).toBe(true);
      });
    });

    it('acepta valores decimales mayores a 0', () => {
      component.productForm.get('peso')!.setValue(0.5);
      expect(component.productForm.get('peso')!.valid).toBe(true);
      component.productForm.get('peso')!.setValue('1.25');
      expect(component.productForm.get('peso')!.valid).toBe(true);
    });

    it('aplica el máximo de 10000', () => {
      DIMENSION_FIELDS.forEach((field) => {
        component.productForm.get(field)!.setValue(10001);
        expect(component.productForm.get(field)!.errors?.['max']).toBeTruthy();
      });
    });

    it('muestra mensajes de error acordes a cada campo', () => {
      component.productForm.get('peso')!.setValue(0);
      expect(component.getErrorMessage('peso')).toBe('El peso debe ser mayor a 0');
      component.productForm.get('altura')!.setValue(0);
      expect(component.getErrorMessage('altura')).toBe('La altura debe ser mayor a 0');
    });

    it('renderiza step="0.01" en los inputs de dimensiones', () => {
      DIMENSION_FIELDS.forEach((field) => {
        const input = getInputByFormControlName(field);
        expect(input).toBeTruthy();
        expect(input.getAttribute('step')).toBe('0.01');
      });
    });
  });

  describe('con marca/categoría como strings', () => {
    let component: EditarProductoComponent;
    let fixture: ComponentFixture<EditarProductoComponent>;

    beforeEach(async () => {
      const productoStrings = {
        ...baseMockProducto,
        marca: 'Marca String',
        categoria: 'Categoria String',
        marca_id: 2,
        categoria_id: 3,
      };
      configureTestBed(() => of(productoStrings));
      await TestBed.compileComponents();
      fixture = TestBed.createComponent(EditarProductoComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await flushTimers();
      fixture.detectChanges();
    });

    it('resuelve marca_id y categoria_id por fallback numérico', () => {
      expect(component.productForm.get('marca_id')!.value).toBe(2);
      expect(component.productForm.get('categoria_id')!.value).toBe(3);
    });

    it('carga las dimensiones decimales sin truncarlas', () => {
      expect(component.productForm.get('altura')!.value).toBe(0.5);
      expect(component.productForm.get('peso')!.value).toBe(0.3);
    });
  });

  describe('validaciones básicas del formulario', () => {
    let component: EditarProductoComponent;
    let fixture: ComponentFixture<EditarProductoComponent>;

    beforeEach(async () => {
      configureTestBed(() => of(baseMockProducto));
      await TestBed.compileComponents();
      fixture = TestBed.createComponent(EditarProductoComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await flushTimers();
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
});

describe('EditarProductoComponent — cambio de plantilla', () => {
  let component: EditarProductoComponent;
  let fixture: ComponentFixture<EditarProductoComponent>;
  let updateProducto: ReturnType<typeof vi.fn>;
  let generarVariantes: ReturnType<typeof vi.fn>;
  let toastSuccess: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.fn>;

  const plantilla8 = {
    id: 8,
    nombre: 'Cascos',
    caracteristicas: [
      { id: 1, nombre: 'Color', opciones: [{ id: 1, nombre: 'Negro' }] },
    ],
  };

  const plantilla5 = {
    id: 5,
    nombre: 'Otra plantilla',
    caracteristicas: [
      { id: 2, nombre: 'Talle', opciones: [{ id: 2, nombre: 'M' }] },
    ],
  };

  beforeEach(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    swalMocks.fire.mockReset();
    swalMocks.fire.mockResolvedValue({ isConfirmed: true });

    updateProducto = vi.fn().mockReturnValue(of({}));
    generarVariantes = vi.fn().mockReturnValue(of({ variantes: [] }));
    toastSuccess = vi.fn();
    toastError = vi.fn();

    const productoConPlantilla = {
      ...baseMockProducto,
      plantilla: plantilla8,
      variantes: [],
    };

    TestBed.configureTestingModule({
      imports: [EditarProductoComponent],
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
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
        { provide: PlantillaService, useValue: { getPlantillas: () => of([plantilla8, plantilla5]) } },
        { provide: MarcaService, useValue: { getMarcas: () => of([]) } },
        { provide: CategoriaService, useValue: { getCategorias: () => of([]) } },
        {
          provide: ProductosService,
          useValue: { getProductoById: () => of(productoConPlantilla), updateProducto },
        },
        { provide: VarianteService, useValue: { generarVariantes } },
        { provide: ToastService, useValue: { success: toastSuccess, error: toastError, warning: vi.fn(), info: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });

    await TestBed.compileComponents();
    fixture = TestBed.createComponent(EditarProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await flushTimers();
    fixture.detectChanges();

    component.imagenPrincipalCargada.set(true);
  });

  it('no pide confirmación ni regenera variantes si la plantilla no cambió y el producto ya tiene variantes', () => {
    component.productoOriginal.set({
      ...baseMockProducto,
      plantilla: plantilla8,
      variantes: [{ id: 1 }],
    } as never);
    component.selectTemplate(plantilla8);

    component.onSubmit();

    expect(swalMocks.fire).not.toHaveBeenCalled();
    expect(updateProducto).toHaveBeenCalledTimes(1);
    expect(generarVariantes).not.toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('genera variantes sin confirmación si la plantilla no cambió pero el producto no tiene variantes', () => {
    component.selectTemplate(plantilla8);

    component.onSubmit();

    expect(updateProducto).toHaveBeenCalledTimes(1);
    expect(generarVariantes).toHaveBeenCalledTimes(1);
    const titles = swalMocks.fire.mock.calls.map((c) => c[0].title);
    expect(titles).not.toContain('¿Cambiar la plantilla?');
    expect(titles).not.toContain('¿Quitar la plantilla?');
  });

  it('confirma el cambio de plantilla, actualiza y regenera las variantes', async () => {
    component.selectTemplate(plantilla5);

    component.onSubmit();
    await flushTimers();

    expect(swalMocks.fire.mock.calls[0][0].title).toBe('¿Cambiar la plantilla?');
    expect(updateProducto).toHaveBeenCalledTimes(1);
    expect(generarVariantes).toHaveBeenCalledTimes(1);
  });

  it('no envía la actualización si el admin cancela la confirmación', async () => {
    swalMocks.fire.mockResolvedValue({ isConfirmed: false });
    component.selectTemplate(plantilla5);

    component.onSubmit();
    await flushTimers();

    expect(updateProducto).not.toHaveBeenCalled();
    expect(generarVariantes).not.toHaveBeenCalled();
  });

  it('genera variantes la primera vez que se asigna una plantilla a un producto sin plantilla', async () => {
    component.productoOriginal.set({
      ...baseMockProducto,
      plantilla: null,
      variantes: [],
    } as never);
    component.productForm.patchValue({ plantillaId: null });
    component.selectTemplate(plantilla8);

    component.onSubmit();
    await flushTimers();

    expect(updateProducto).toHaveBeenCalledTimes(1);
    expect(generarVariantes).toHaveBeenCalledTimes(1);
  });

  it('al deseleccionar la plantilla envía plantillaId vacío y no regenera variantes', async () => {
    component.deseleccionarPlantilla();
    await flushTimers();
    expect(component.selectedTemplate()).toBeNull();

    component.onSubmit();
    await flushTimers();

    const ultimoLlamado =
      swalMocks.fire.mock.calls[swalMocks.fire.mock.calls.length - 1][0];
    expect(ultimoLlamado.title).toBe('¿Quitar la plantilla?');
    expect(updateProducto).toHaveBeenCalledTimes(1);
    const formData = updateProducto.mock.calls[0][1] as FormData;
    expect(formData.get('plantillaId')).toBe('');
    expect(generarVariantes).not.toHaveBeenCalled();
  });

  it('advierte que la acción es irreversible cuando el producto ya tiene variantes', async () => {
    component.productoOriginal.set({
      ...baseMockProducto,
      plantilla: plantilla8,
      variantes: [{ id: 1 }],
    } as never);
    component.selectTemplate(plantilla5);

    component.onSubmit();
    await flushTimers();

    const confirmacion = swalMocks.fire.mock.calls[0][0];
    expect(confirmacion.title).toBe('¿Cambiar la plantilla?');
    expect(confirmacion.html).toContain('irreversible');
  });

  it('sincroniza el control tipo con el signal al cargar el producto', () => {
    expect(component.productForm.get('tipo')!.value).toBe(TipoPaquete.ENERGICO);
    expect(component.tipoProducto()).toBe(TipoPaquete.ENERGICO);
  });

  it('cambiarTipoProducto sincroniza signal y control del formulario', () => {
    component.cambiarTipoProducto(TipoPaquete.SINERGICO);

    expect(component.tipoProducto()).toBe(TipoPaquete.SINERGICO);
    expect(component.productForm.get('tipo')!.value).toBe(TipoPaquete.SINERGICO);
    expect(component.productForm.get('stock')!.value).toBeNull();
  });

  it('buildFormData no incluye el campo tipo', () => {
    const formData = (component as any).buildFormData([]) as FormData;
    expect(formData.get('tipo')).toBeNull();
  });

  it('envía el tipo una sola vez en el FormData del submit', async () => {
    component.onSubmit();
    await flushTimers();

    const formData = updateProducto.mock.calls[0][1] as FormData;
    expect(formData.getAll('tipo')).toEqual(['ENERGICO']);
  });

  it('rechaza el submit si una característica de la plantilla queda sin opciones', () => {
    component.selectTemplate(plantilla8);
    component.selectedAttributes.set({ Color: [] });

    component.onSubmit();

    expect(updateProducto).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(
      'Debés seleccionar al menos una opción de cada característica'
    );
  });
});
