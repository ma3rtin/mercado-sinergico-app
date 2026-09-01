import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { EditarPaqueteBaseComponent } from './editar-paquete-base';
import { MarcaService } from '@app/services/producto/marca.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { PaqueteBaseService } from '@app/services/paquete/paquete-base.service';
import { ToastService } from '@app/services/toast/toast.service';
import { TipoPaquete } from '@app/models/Enums';
import { PaqueteBase } from '@app/models/PaquetesInterfaces/PaqueteBase';
import { Producto } from '@app/models/ProductosInterfaces/Producto';

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

const paquete: PaqueteBase = {
  id_paquete_base: 7,
  nombre: 'Paquete de prueba',
  descripcion: 'Descripción',
  imagen_url: 'https://example.test/img.webp',
  categoria_id: 1,
  marcaId: 2,
  tipo: TipoPaquete.SINERGICO,
};

describe('EditarPaqueteBaseComponent — carga inicial', () => {
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };
  let navigate: ReturnType<typeof vi.fn>;

  const montar = (baseService: Partial<PaqueteBaseService>, idRuta = '7') => {
    TestBed.configureTestingModule({
      imports: [EditarPaqueteBaseComponent, NgIconsModule.withIcons({})],
      providers: [
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: idRuta } } } },
        { provide: MarcaService, useValue: { getMarcas: () => of([]) } },
        { provide: CategoriaService, useValue: { getCategorias: () => of([]) } },
        { provide: ProductosService, useValue: { getProductos: () => of([]) } },
        { provide: PaqueteBaseService, useValue: baseService },
        { provide: ToastService, useValue: toast },
      ],
    });

    const fixture = TestBed.createComponent(EditarPaqueteBaseComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
    navigate = vi.fn();
  });

  it('carga el paquete y sus productos', () => {
    const component = montar({
      getPaquetes: () => of([paquete]),
      getProductosByPaqueteBase: () => of([]),
    } as Partial<PaqueteBaseService>);

    expect(component.nombre()).toBe('Paquete de prueba');
    expect(component.isLoading()).toBe(false);
  });

  it('no deja el spinner girando si el paquete no existe', () => {
    const component = montar({
      getPaquetes: () => of([]),
      getProductosByPaqueteBase: () => of([]),
    } as Partial<PaqueteBaseService>);

    expect(component.isLoading()).toBe(false);
    expect(toast.error).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/admin/administrar-paquetes']);
  });

  it('no deja el spinner girando si falla la carga de paquetes', () => {
    const component = montar({
      getPaquetes: () => throwError(() => new Error('500')),
      getProductosByPaqueteBase: () => of([]),
    } as Partial<PaqueteBaseService>);

    expect(component.isLoading()).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it('no deja el spinner girando si falla la carga de productos del paquete', () => {
    const component = montar({
      getPaquetes: () => of([paquete]),
      getProductosByPaqueteBase: () => throwError(() => new Error('500')),
    } as Partial<PaqueteBaseService>);

    expect(component.isLoading()).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it('filtra los productos incompatibles con el tipo del paquete y avisa por toast', () => {
    const compatibles: Producto = {
      id_producto: 10,
      nombre: 'Notebook Sinérgica',
      descripcion: 'd',
      precio: 100,
      marca_id: 1,
      categoria_id: 1,
      tipo: TipoPaquete.SINERGICO,
      imagenes: [],
    };
    const incompatibles: Producto = {
      id_producto: 11,
      nombre: 'Samsung Galaxy S23',
      descripcion: 'd',
      precio: 200,
      marca_id: 1,
      categoria_id: 1,
      tipo: TipoPaquete.ENERGICO,
      imagenes: [],
    };

    const component = montar({
      getPaquetes: () => of([paquete]),
      getProductosByPaqueteBase: () => of([compatibles, incompatibles]),
    } as Partial<PaqueteBaseService>);

    expect(component.productosSeleccionados().map(p => p.id_producto)).toEqual([10]);
    expect(toast.warning).toHaveBeenCalledWith(
      'Se quitaron 1 producto(s) por no ser compatibles con el tipo de este paquete: Samsung Galaxy S23'
    );
  });

  it('no muestra warning si todos los productos son compatibles', () => {
    const compatibles: Producto = {
      id_producto: 10,
      nombre: 'Notebook Sinérgica',
      descripcion: 'd',
      precio: 100,
      marca_id: 1,
      categoria_id: 1,
      tipo: TipoPaquete.SINERGICO,
      imagenes: [],
    };

    const component = montar({
      getPaquetes: () => of([paquete]),
      getProductosByPaqueteBase: () => of([compatibles]),
    } as Partial<PaqueteBaseService>);

    expect(component.productosSeleccionados().map(p => p.id_producto)).toEqual([10]);
    expect(toast.warning).not.toHaveBeenCalled();
  });
});

describe('EditarPaqueteBaseComponent — guardar()', () => {
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };
  let navigate: ReturnType<typeof vi.fn>;

  const producto: Producto = {
    id_producto: 10,
    nombre: 'Notebook Sinérgica',
    descripcion: 'd',
    precio: 100,
    marca_id: 1,
    categoria_id: 1,
    tipo: TipoPaquete.SINERGICO,
    imagenes: [],
  };

  const montar = (baseService: Partial<PaqueteBaseService>, idRuta = '7') => {
    TestBed.configureTestingModule({
      imports: [EditarPaqueteBaseComponent, NgIconsModule.withIcons({})],
      providers: [
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: idRuta } } } },
        { provide: MarcaService, useValue: { getMarcas: () => of([]) } },
        { provide: CategoriaService, useValue: { getCategorias: () => of([]) } },
        { provide: ProductosService, useValue: { getProductos: () => of([]) } },
        { provide: PaqueteBaseService, useValue: baseService },
        { provide: ToastService, useValue: toast },
      ],
    });

    const fixture = TestBed.createComponent(EditarPaqueteBaseComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
    navigate = vi.fn();
  });

  it('sincroniza los productos antes de actualizar el paquete', () => {
    const orden: string[] = [];
    const component = montar({
      getPaquetes: () => of([paquete]),
      getProductosByPaqueteBase: () => of([]),
      agregarProductos: vi.fn(() => {
        orden.push('agregarProductos');
        return of({} as PaqueteBase);
      }),
      updatePaquete: vi.fn(() => {
        orden.push('updatePaquete');
        return of({} as PaqueteBase);
      }),
    } as Partial<PaqueteBaseService>);
    component.productosSeleccionados.set([producto]);

    component.guardar();

    expect(orden).toEqual(['agregarProductos', 'updatePaquete']);
    expect(toast.success).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/admin/administrar-paquetes']);
  });

  it('no intenta actualizar el paquete si falla la sincronización de productos', () => {
    const updatePaquete = vi.fn(() => of({} as PaqueteBase));
    const component = montar({
      getPaquetes: () => of([paquete]),
      getProductosByPaqueteBase: () => of([]),
      agregarProductos: () => throwError(() => ({ error: { message: 'incompatibles' } })),
      updatePaquete,
    } as Partial<PaqueteBaseService>);
    component.productosSeleccionados.set([producto]);

    component.guardar();

    expect(updatePaquete).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'No pudimos actualizar la lista de productos del paquete. Verificá que no haya productos incompatibles.'
    );
    expect(component.guardando()).toBe(false);
  });

  it('muestra el toast del paso update si falla la actualización del paquete', () => {
    const component = montar({
      getPaquetes: () => of([paquete]),
      getProductosByPaqueteBase: () => of([]),
      agregarProductos: () => of({} as PaqueteBase),
      updatePaquete: () => throwError(() => new Error('500')),
    } as Partial<PaqueteBaseService>);
    component.productosSeleccionados.set([producto]);

    component.guardar();

    expect(toast.error).toHaveBeenCalledWith(
      'No pudimos actualizar los datos del paquete. Verificá los campos e intentá de nuevo.'
    );
    expect(component.guardando()).toBe(false);
  });
});
