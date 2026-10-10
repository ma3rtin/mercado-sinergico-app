import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CrearPaqueteComponent } from './crear-paquete';
import { MarcaService } from '@app/services/producto/marca.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { PaqueteBaseService } from '@app/services/paquete/paquete-base.service';
import { ToastService } from '@app/services/toast/toast.service';
import { NgIconsModule } from '@ng-icons/core';
import Swal from 'sweetalert2';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Observable, Subject, of, throwError } from 'rxjs';
import { TipoPaquete } from '@app/models/Enums';
import { Producto } from '@app/models/ProductosInterfaces/Producto';

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
  },
}));

const crearProducto = (id: number, tipo: TipoPaquete): Producto =>
  ({
    id_producto: id,
    nombre: `Producto ${id}`,
    descripcion: 'Descripción de prueba',
    precio: 100,
    tipo,
    imagenes: [],
    marca_id: 1,
    categoria_id: 1,
  }) as Producto;

const productoSinergico1 = crearProducto(1, TipoPaquete.SINERGICO);
const productoEnergico = crearProducto(2, TipoPaquete.ENERGICO);
const productoSinergico2 = crearProducto(3, TipoPaquete.SINERGICO);

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe('CrearPaqueteComponent', () => {
  let component: CrearPaqueteComponent;
  let createPaqueteMock: ReturnType<typeof vi.fn>;
  let toastMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };
  let navigateMock: ReturnType<typeof vi.fn>;
  const swalFireMock = vi.mocked(Swal.fire);

  beforeEach(async () => {
    createPaqueteMock = vi.fn(() => of({ id_paquete_base: 1 }));
    navigateMock = vi.fn();
    toastMock = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
    swalFireMock.mockResolvedValue({ isConfirmed: true } as Awaited<ReturnType<typeof Swal.fire>>);

    await TestBed.configureTestingModule({
      imports: [CrearPaqueteComponent, NgIconsModule.withIcons({})],
      providers: [
        { provide: Router, useValue: { navigate: navigateMock } },
        {
          provide: MarcaService,
          useValue: { getMarcas: () => of([]), createMarca: () => of({}), updateMarca: () => of({}) },
        },
        {
          provide: CategoriaService,
          useValue: { getCategorias: () => of([]), createCategoria: () => of({}), updateCategoria: () => of({}) },
        },
        {
          provide: ProductosService,
          useValue: { getProductos: () => of([productoSinergico1, productoEnergico, productoSinergico2]) },
        },
        { provide: PaqueteBaseService, useValue: { createPaquete: createPaqueteMock } },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CrearPaqueteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('validaciones del formulario', () => {
    it('debe ser inválido al iniciar (nombre y categoría requeridos)', () => {
      expect(component.paqueteForm.invalid).toBe(true);
      expect(component.paqueteForm.get('nombre')?.errors?.['required']).toBeTruthy();
      expect(component.paqueteForm.get('categoria_id')?.errors?.['required']).toBeTruthy();
    });

    it('marca debe ser opcional', () => {
      component.paqueteForm.patchValue({
        nombre: 'Paquete válido',
        descripcion: 'Descripción suficientemente larga',
        categoria_id: 5,
      });
      expect(component.paqueteForm.get('marca_id')?.valid).toBe(true);
      expect(component.paqueteForm.valid).toBe(true);
    });

    describe('nombre', () => {
      it('debe tener error minlength con menos de 3 caracteres', () => {
        const control = component.paqueteForm.get('nombre');
        control?.setValue('ab');
        expect(control?.errors?.['minlength']).toBeTruthy();
        expect(control?.errors?.['minlength'].requiredLength).toBe(3);
      });

      it('debe tener error maxlength con más de 100 caracteres', () => {
        const control = component.paqueteForm.get('nombre');
        control?.setValue('a'.repeat(101));
        expect(control?.errors?.['maxlength']).toBeTruthy();
        expect(control?.errors?.['maxlength'].requiredLength).toBe(100);
      });
    });

    describe('descripcion', () => {
      it('debe ser requerida', () => {
        const control = component.paqueteForm.get('descripcion');
        control?.setValue('');
        expect(control?.errors?.['required']).toBeTruthy();
      });

      it('debe tener error minlength con menos de 10 caracteres', () => {
        const control = component.paqueteForm.get('descripcion');
        control?.setValue('corta');
        expect(control?.errors?.['minlength'].requiredLength).toBe(10);
      });

      it('debe tener error maxlength con más de 500 caracteres', () => {
        const control = component.paqueteForm.get('descripcion');
        control?.setValue('a'.repeat(501));
        expect(control?.errors?.['maxlength'].requiredLength).toBe(500);
      });
    });

    it('getErrorMessage debe devolver mensaje para categoria_id requerido', () => {
      const control = component.paqueteForm.get('categoria_id');
      control?.setValue(null);
      control?.markAsTouched();
      expect(component.getErrorMessage('categoria_id')).toBe('La categoría es requerido');
    });
  });

  describe('cambio entre Enérgico y Sinérgico', () => {
    it('sin productos seleccionados cambia el tipo directamente', () => {
      component.onTipoPaqueteChange(TipoPaquete.ENERGICO);
      expect(component.tipoPaquete()).toBe(TipoPaquete.ENERGICO);
      expect(swalFireMock).not.toHaveBeenCalled();
    });

    it('con productos incompatibles y confirmación los remueve', async () => {
      component.onSelectProducto(productoSinergico1.id_producto!);
      component.onTipoPaqueteChange(TipoPaquete.ENERGICO);

      await flushMicrotasks();

      expect(swalFireMock).toHaveBeenCalledTimes(1);
      expect(component.tipoPaquete()).toBe(TipoPaquete.ENERGICO);
      expect(component.productosSeleccionados().length).toBe(0);
    });

    it('al cancelar la confirmación mantiene el tipo y los productos', async () => {
      swalFireMock.mockResolvedValueOnce({ isConfirmed: false } as Awaited<ReturnType<typeof Swal.fire>>);

      component.onSelectProducto(productoSinergico1.id_producto!);
      component.onTipoPaqueteChange(TipoPaquete.ENERGICO);

      await flushMicrotasks();

      expect(component.tipoPaquete()).toBe(TipoPaquete.SINERGICO);
      expect(component.productosSeleccionados().length).toBe(1);
    });
  });

  describe('selección de productos', () => {
    it('agrega un producto compatible y limpia el buscador', () => {
      component.productoBuscado.setValue(productoSinergico1.id_producto!);

      component.onSelectProducto(productoSinergico1.id_producto!);

      expect(component.productosSeleccionados().length).toBe(1);
      expect(component.productosSeleccionados()[0].id_producto).toBe(productoSinergico1.id_producto);
      expect(component.productoBuscado.value).toBeNull();
    });

    it('no permite agregar el mismo producto dos veces', () => {
      component.onSelectProducto(productoSinergico1.id_producto!);
      component.onSelectProducto(productoSinergico1.id_producto!);

      expect(component.productosSeleccionados().length).toBe(1);
    });

    it('ignora productos incompatibles con el tipo actual', () => {
      component.onSelectProducto(productoEnergico.id_producto!);

      expect(component.productosSeleccionados().length).toBe(0);
    });

    it('eliminarProducto quita el producto y permite volver a buscarlo', () => {
      component.onSelectProducto(productoSinergico1.id_producto!);
      component.eliminarProducto(0);

      expect(component.productosSeleccionados().length).toBe(0);
      // El producto vuelve a estar disponible en las opciones del buscador
      const opciones = component.productosOptions().map((o) => o.value);
      expect(opciones).toContain(productoSinergico1.id_producto);
    });

    it('las opciones excluyen productos ya seleccionados y de otro tipo', () => {
      component.onSelectProducto(productoSinergico1.id_producto!);

      const valores = component.productosOptions().map((o) => o.value);
      expect(valores).toContain(productoSinergico2.id_producto);
      expect(valores).not.toContain(productoSinergico1.id_producto);
      expect(valores).not.toContain(productoEnergico.id_producto);
    });
  });

  describe('submit', () => {
    const completarFormularioValido = (): void => {
      component.paqueteForm.patchValue({
        nombre: 'Paquete de prueba',
        descripcion: 'Descripción suficientemente larga para pasar la validación',
        categoria_id: 5,
      });
    };

    const cargarImagenPrincipal = (): File => {
      const file = new File(['contenido-imagen'], 'portada.png', { type: 'image/png' });
      const subidor = (component as any).subidorImagenes();
      subidor.loadSlots([{ file, preview: 'data:image/png;base64,abc', isExisting: false }]);
      return file;
    };

    it('con formulario inválido no llama al servicio y marca el form como enviado', () => {
      component.crearPaquete();

      expect(createPaqueteMock).not.toHaveBeenCalled();
      expect(component.formSubmitted()).toBe(true);
    });

    it('sin imagen no llama al servicio', () => {
      completarFormularioValido();
      component.onSelectProducto(productoSinergico1.id_producto!);

      component.crearPaquete();

      expect(createPaqueteMock).not.toHaveBeenCalled();
      expect(toastMock.error).toHaveBeenCalled();
    });

    it('sin productos no llama al servicio', () => {
      completarFormularioValido();
      cargarImagenPrincipal();

      component.crearPaquete();

      expect(createPaqueteMock).not.toHaveBeenCalled();
      expect(toastMock.error).toHaveBeenCalled();
    });

    it('válido construye el FormData correcto y navega a administrar paquetes', () => {
      completarFormularioValido();
      component.paqueteForm.patchValue({ marca_id: 7 });
      component.onSelectProducto(productoSinergico1.id_producto!);
      component.onSelectProducto(productoSinergico2.id_producto!);
      const archivo = cargarImagenPrincipal();

      component.crearPaquete();

      expect(createPaqueteMock).toHaveBeenCalledTimes(1);
      const formData: FormData = createPaqueteMock.mock.calls[0][0];
      expect(formData.get('nombre')).toBe('Paquete de prueba');
      expect(formData.get('descripcion')).toContain('Descripción suficientemente larga');
      expect(formData.get('categoria_id')).toBe('5');
      expect(formData.get('marcaId')).toBe('7');
      expect(formData.get('tipo')).toBe('SINERGICO');
      expect(formData.getAll('productos')).toEqual(['1', '3']);
      expect(formData.get('imagen')).toBe(archivo);
      expect(navigateMock).toHaveBeenCalledWith(['/admin/administrar-paquetes']);
    });

    it('no envía marcaId cuando no hay marca seleccionada', () => {
      completarFormularioValido();
      component.onSelectProducto(productoSinergico1.id_producto!);
      cargarImagenPrincipal();

      component.crearPaquete();

      const formData: FormData = createPaqueteMock.mock.calls[0][0];
      expect(formData.has('marcaId')).toBe(false);
    });

    it('maneja el error del backend sin romperse y libera el loading', () => {
      createPaqueteMock.mockReturnValue(
        throwError(() => ({ status: 400, error: { message: 'El nombre ya existe' } }))
      );
      completarFormularioValido();
      component.onSelectProducto(productoSinergico1.id_producto!);
      cargarImagenPrincipal();

      component.crearPaquete();

      expect(toastMock.error).toHaveBeenCalledWith('El nombre ya existe', 'Fallo');
      expect(component.creandoPaquete()).toBe(false);
    });
  });

  describe('carga inicial', () => {
    const montarCon = async (
      marcas$: Observable<any>,
      categorias$: Observable<any>,
      productos$: Observable<any>
    ): Promise<CrearPaqueteComponent> => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CrearPaqueteComponent, NgIconsModule.withIcons({})],
        providers: [
          { provide: Router, useValue: { navigate: vi.fn() } },
          { provide: MarcaService, useValue: { getMarcas: () => marcas$ } },
          { provide: CategoriaService, useValue: { getCategorias: () => categorias$ } },
          { provide: ProductosService, useValue: { getProductos: () => productos$ } },
          { provide: PaqueteBaseService, useValue: { createPaquete: vi.fn() } },
          { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn(), info: vi.fn() } },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(CrearPaqueteComponent);
      fixture.detectChanges();
      return fixture.componentInstance;
    };

    it('mantiene el loader hasta que responden las tres cargas', async () => {
      const marcas$ = new Subject<any>();
      const categorias$ = new Subject<any>();
      const productos$ = new Subject<any>();
      const comp = await montarCon(marcas$, categorias$, productos$);

      expect(comp.isLoading()).toBe(true);

      marcas$.next([{ id_marca: 1, nombre: 'Marca' }]);
      expect(comp.isLoading()).toBe(true);

      categorias$.next([{ id_categoria: 1, nombre: 'Categoría' }]);
      expect(comp.isLoading()).toBe(true);

      productos$.next([productoSinergico1]);
      expect(comp.isLoading()).toBe(false);
    });

    it('libera el loader aunque las tres respuestas vengan vacías', async () => {
      const comp = await montarCon(of([]), of([]), of([]));

      expect(comp.isLoading()).toBe(false);
    });

    it('libera el loader aunque las tres cargas fallen', async () => {
      const falla = () => throwError(() => new Error('network'));
      const comp = await montarCon(falla(), falla(), falla());

      expect(comp.isLoading()).toBe(false);
    });
  });

  describe('reset', () => {
    it('limpia todos los estados del formulario', () => {
      component.paqueteForm.patchValue({
        nombre: 'Paquete de prueba',
        descripcion: 'Descripción suficientemente larga para pasar la validación',
        categoria_id: 5,
      });
      component.onSelectProducto(productoSinergico1.id_producto!);
      (component as any)
        .subidorImagenes()
        .loadSlots([
          { file: new File(['x'], 'a.png', { type: 'image/png' }), preview: 'data:image/png;base64,x', isExisting: false },
        ]);
      component.formSubmitted.set(true);
      component.onTipoPaqueteChange(TipoPaquete.ENERGICO);

      component.resetForm();

      expect(component.paqueteForm.get('nombre')?.value).toBeNull();
      expect(component.paqueteForm.get('categoria_id')?.value).toBeNull();
      expect(component.tipoPaquete()).toBe(TipoPaquete.SINERGICO);
      expect(component.productosSeleccionados().length).toBe(0);
      expect(component.productoBuscado.value).toBeNull();
      expect(component.formSubmitted()).toBe(false);
      expect((component as any).subidorImagenes().hasMainImage()).toBe(false);
    });
  });
});
