import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ProductoDetalleSeleccionComponent } from './producto-detalle-seleccion-component';
import { ProductosService } from '@app/services/producto/producto.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { encodeId } from '@app/shared/utils/obfuscator';

describe('ProductoDetalleSeleccionComponent', () => {
  let component: ProductoDetalleSeleccionComponent;
  let fixture: ComponentFixture<ProductoDetalleSeleccionComponent>;
  let mockProductosService: { getProductoById: ReturnType<typeof vi.fn> };
  let mockPaquetePublicadoService: { getByProductId: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let paramMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const montar = async (idParam: string) => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({ id: idParam }));
    mockRouter = { navigate: vi.fn() };
    mockProductosService = {
      getProductoById: vi.fn(() => of({ id_producto: 1, nombre: 'Producto', precio: 100 })),
    };
    mockPaquetePublicadoService = {
      getByProductId: vi.fn(() => of([])),
    };

    await TestBed.configureTestingModule({
      imports: [ProductoDetalleSeleccionComponent, NgIconsModule.withIcons({})],
      providers: [
        { provide: ProductosService, useValue: mockProductosService },
        { provide: PaquetePublicadoService, useValue: mockPaquetePublicadoService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductoDetalleSeleccionComponent);
    component = fixture.componentInstance;
    (component as any).isBrowser = true;
  };

  afterEach(() => fixture?.destroy());

  it('decodifica el slug y llama a getProductoById con el id correcto', async () => {
    await montar(`termo-stanley-p${encodeId(45)}`);
    fixture.detectChanges();

    expect(mockProductosService.getProductoById).toHaveBeenCalledWith(45);
  });

  it('un slug inválido muestra error sin llamar a los servicios', async () => {
    await montar('abc-invalido');
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('ID de producto inválido');
    expect(mockProductosService.getProductoById).not.toHaveBeenCalled();
  });

  it('al cambiar de producto se descarta la respuesta vieja y se resetean filtro y página', async () => {
    const idA = 1;
    const idB = 2;
    const respuestaA = new Subject<any>();
    const respuestaB = new Subject<any>();

    await montar(`prod-a-p${encodeId(idA)}`);
    mockProductosService.getProductoById = vi.fn((id: number) =>
      (id === idA ? respuestaA : respuestaB).asObservable(),
    );
    fixture.detectChanges();

    component.filtroTipoPaquete.set('ENERGICO');
    component.paginaActual.set(3);

    // Cambio de ruta a otro producto antes de que resuelva el primero
    paramMapSubject.next(convertToParamMap({ id: `prod-b-p${encodeId(idB)}` }));

    respuestaB.next({ id_producto: idB, nombre: 'B', precio: 10 });
    respuestaA.next({ id_producto: idA, nombre: 'A tardía', precio: 5 });

    expect(component.productoSeleccionado()?.id_producto).toBe(idB);
    expect(component.filtroTipoPaquete()).toBe('TODOS');
    expect(component.paginaActual()).toBe(1);
  });

  it('"Reintentar" en medio de un cambio de ruta no pisa al producto nuevo', async () => {
    const idA = 1;
    const idB = 2;

    await montar(`prod-a-p${encodeId(idA)}`);
    mockProductosService.getProductoById = vi.fn(() => throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('Error al cargar el producto.');

    const reintentoA = new Subject<any>();
    const respuestaB = new Subject<any>();
    mockProductosService.getProductoById = vi.fn((id: number) =>
      (id === idA ? reintentoA : respuestaB).asObservable(),
    );

    // El usuario aprieta "Reintentar" para A...
    component.recargarDatos();
    // ...pero antes de que resuelva, la ruta cambia a B.
    paramMapSubject.next(convertToParamMap({ id: `prod-b-p${encodeId(idB)}` }));

    respuestaB.next({ id_producto: idB, nombre: 'B', precio: 10 });
    reintentoA.next({ id_producto: idA, nombre: 'A tardía', precio: 5 });

    expect(component.productoSeleccionado()?.id_producto).toBe(idB);
  });

  it('un error al traer los paquetes no rompe la vista del producto', async () => {
    await montar(`prod-p${encodeId(1)}`);
    mockPaquetePublicadoService.getByProductId = vi.fn(() => throwError(() => new Error('caído')));
    fixture.detectChanges();

    expect(component.productoSeleccionado()).not.toBeNull();
    expect(component.errorMessage()).toBe('');
    expect(component.errorPaquetes()).toBe(true);
  });

  it('recargarPaquetes() reintenta sólo la carga de paquetes, sin volver a pedir el producto', async () => {
    await montar(`prod-p${encodeId(1)}`);
    mockPaquetePublicadoService.getByProductId = vi.fn(() => throwError(() => new Error('caído')));
    fixture.detectChanges();
    expect(component.errorPaquetes()).toBe(true);

    mockProductosService.getProductoById.mockClear();
    mockPaquetePublicadoService.getByProductId = vi.fn(() => of([{ id_paquete_publicado: 9 }]));

    component.recargarPaquetes();

    expect(component.errorPaquetes()).toBe(false);
    expect(component.todosLosPaquetes()).toEqual([{ id_paquete_publicado: 9 }]);
    expect(mockProductosService.getProductoById).not.toHaveBeenCalled();
  });
});
