import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductosComponent } from './productos';
import { ProductosService } from '@app/services/producto/producto.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { ZonaService } from '@app/services/zona/zona.service';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { NgIconsModule } from '@ng-icons/core';
import { signal } from '@angular/core';
import { of, throwError, BehaviorSubject, Subject } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';

describe('ProductosComponent', () => {
  let component: ProductosComponent;
  let fixture: ComponentFixture<ProductosComponent>;
  let mockUsuarioService: { perfilUsuario: ReturnType<typeof signal<any>> };
  let mockProductosService: any;
  let mockCategoriaService: { getCategorias: ReturnType<typeof vi.fn> };
  let mockRouter: any;
  let queryParamsSubject: BehaviorSubject<any>;
  let mockRouteSnapshotParams: any;

  beforeEach(async () => {
    mockUsuarioService = {
      perfilUsuario: signal<any>(null),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    queryParamsSubject = new BehaviorSubject<any>({});
    mockRouteSnapshotParams = {};

    mockProductosService = {
      getProductos: vi.fn().mockReturnValue(of([])),
      getProductosPaginados: vi.fn().mockReturnValue(of({ productos: [], total: 0 })),
    };

    mockCategoriaService = {
      getCategorias: vi.fn(() => of([{ id_categoria: 1, nombre: 'Lácteos' }])),
    };

    await TestBed.configureTestingModule({
      imports: [
        ProductosComponent,
        NgIconsModule.withIcons({}),
      ],
      providers: [
        { provide: ProductosService, useValue: mockProductosService },
        { provide: CategoriaService, useValue: mockCategoriaService },
        { provide: MarcaService, useValue: { getMarcas: () => of([{ id_marca: 1, nombre: 'Arcor' }]) } },
        { provide: ZonaService, useValue: { getZonas: () => of([{ id_zona: 1, nombre: 'Zona Norte' }, { id_zona: 2, nombre: 'Zona Sur' }]) } },
        { provide: UsuarioService, useValue: mockUsuarioService },
        {
          provide: PaquetePublicadoService,
          useValue: {
            getPaquetes: () => of([]),
            getPaqueteById: () => of({}),
          },
        },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable(),
            snapshot: { queryParams: mockRouteSnapshotParams },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductosComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('debería inicializar el componente y cargar los catálogos en paralelo', () => {
    // Simulamos entorno de navegador
    component['isBrowser'] = true;
    fixture.detectChanges(); // Ejecuta ngOnInit

    expect(component.todasLasCategorias().length).toBe(1);
    expect(component.todasLasCategorias()[0].nombre).toBe('Lácteos');
    expect(component.todasLasMarcas()[0].nombre).toBe('Arcor');
    expect(component.todasLasZonas()[0].nombre).toBe('Zona Norte');
  });

  it('debería procesar los queryParams y mapear slugs de filtros a sus IDs correspondientes', () => {
    component['isBrowser'] = true;
    fixture.detectChanges();

    queryParamsSubject.next({
      page: '2',
      limit: '15',
      categorias: 'lacteos',
      marcas: 'arcor',
      zonas: 'zona-norte',
      orden: 'precio-asc',
    });

    expect(component.paginaActual()).toBe(2);
    expect(component.itemsPorPagina()).toBe(15);
    expect(component.filtrosActuales()).toEqual({
      categorias: [1],
      marcas: [1],
      zonas: [1],
      tiposPaquete: [],
      ordenamiento: 'precio-asc',
      rangoPrecio: { min: null, max: null },
      estados: [],
    });
  });

  it('debería preseleccionar la zona del usuario como valor inicial de filtros', () => {
    mockUsuarioService.perfilUsuario.set({
      direccion: { localidad: { nombre: 'Palermo', zonas: [{ id_zona: 7 }] } },
    });
    component['isBrowser'] = true;
    fixture.detectChanges();

    expect(component.valoresFiltrosIniciales().zonas).toEqual([7]);
  });

  it('debería navegar con nuevos queryParams al cambiar la página', () => {
    component['isBrowser'] = true;
    fixture.detectChanges();

    component.onPageChange(3);

    expect(mockRouter.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({
        page: '3',
      }),
    }));
  });

  it('una respuesta vieja no pisa a la más nueva (switchMap cancela el request anterior)', () => {
    const primera = new Subject<{ productos: any[]; total: number }>();
    const segunda = new Subject<{ productos: any[]; total: number }>();
    let llamadas = 0;
    mockProductosService.getProductosPaginados = vi.fn(() =>
      (++llamadas === 1 ? primera : segunda).asObservable(),
    );

    component['isBrowser'] = true;
    fixture.detectChanges();
    queryParamsSubject.next({ page: '2' });

    segunda.next({ productos: [{ id_producto: 2 }], total: 1 });
    primera.next({ productos: [{ id_producto: 1 }], total: 1 });

    expect(component.productosOriginales()).toEqual([{ id_producto: 2 }]);
  });

  it('después de un error al cargar productos, un cambio de URL vuelve a intentar la carga', () => {
    let llamadas = 0;
    mockProductosService.getProductosPaginados = vi.fn(() => {
      llamadas++;
      return llamadas === 1
        ? throwError(() => new Error('falló'))
        : of({ productos: [{ id_producto: 9 }], total: 1 });
    });

    component['isBrowser'] = true;
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Error al cargar productos.');

    queryParamsSubject.next({ page: '2' });

    expect(component.errorMessage()).toBe('');
    expect(component.productosOriginales()).toEqual([{ id_producto: 9 }]);
  });

  it('una URL sin "orden" vuelve a "recientes"', () => {
    component['isBrowser'] = true;
    fixture.detectChanges();

    queryParamsSubject.next({ orden: 'precio-asc' });
    expect(component.ordenSeleccionado()).toBe('precio-asc');

    queryParamsSubject.next({});
    expect(component.ordenSeleccionado()).toBe('recientes');
  });

  it('precioMin inválido no se manda al backend', () => {
    component['isBrowser'] = true;
    fixture.detectChanges();

    queryParamsSubject.next({ precioMin: 'abc' });

    expect(component.filtrosActuales()?.rangoPrecio.min).toBeNull();
  });

  it('los filtros de zona que vienen de la URL le ganan a la zona del perfil', () => {
    mockUsuarioService.perfilUsuario.set({
      direccion: { localidad: { zonas: [{ id_zona: 7 }] } },
    });
    component['isBrowser'] = true;
    fixture.detectChanges();

    queryParamsSubject.next({ zonas: 'zona-sur' });

    expect(component.filtrosActuales()?.zonas).toEqual([2]);
  });

  it('el eco del panel con los filtros de la URL no vuelve a la página 1', () => {
    component['isBrowser'] = true;
    fixture.detectChanges();
    queryParamsSubject.next({ page: '2', categorias: 'lacteos' });
    mockRouter.navigate.mockClear();

    // app-filtros reemite, tras el debounce, el estado que recibió por valoresActuales.
    component.aplicarFiltros(structuredClone(component.filtrosActuales()!));

    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('un cambio real de filtros desde el panel vuelve a la página 1', () => {
    component['isBrowser'] = true;
    fixture.detectChanges();
    queryParamsSubject.next({ page: '2', categorias: 'lacteos' });
    mockRouter.navigate.mockClear();

    component.aplicarFiltros({ ...component.filtrosActuales()!, categorias: [] });

    expect(mockRouter.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({ page: '1', categorias: null }),
    }));
  });

  it('cambiar "items por página" navega una sola vez', () => {
    component['isBrowser'] = true;
    fixture.detectChanges();
    mockRouter.navigate.mockClear();

    // Replica lo que hace app-pagination: emite itemsPerPageChange y
    // enseguida pageChange(1), en ese orden.
    component.onItemsPerPageChange(24);
    component.onPageChange(1);

    expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({ limit: '24', page: '1' }),
    }));
  });

  it('con el perfil ya cargado al montar, la zona llega al request inicial (confirma F)', () => {
    // El panel en sí (que la zona aparezca tildada) ya está cubierto en
    // filtros.spec.ts; acá sólo importa que el dato llegue al pedido real.
    mockUsuarioService.perfilUsuario.set({
      direccion: { localidad: { zonas: [{ id_zona: 7 }] } },
    });
    component['isBrowser'] = true;
    fixture.detectChanges();

    expect(component.filtrosActuales()?.zonas).toEqual([7]);
    expect(mockProductosService.getProductosPaginados).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ zonas: [7] }),
      expect.anything(),
    );
  });

  it('si falla un catálogo que la URL necesita, avisa y "reintentar" recupera el filtro', () => {
    mockRouteSnapshotParams.categorias = 'lacteos';
    let intento = 0;
    mockCategoriaService.getCategorias = vi.fn(() => {
      intento++;
      return intento === 1
        ? throwError(() => new Error('caído'))
        : of([{ id_categoria: 1, nombre: 'Lácteos' }]);
    });

    component['isBrowser'] = true;
    fixture.detectChanges();

    expect(component.errorMessage()).toContain('filtros de tu enlace');
    expect(component.isLoading()).toBe(false);

    component.recargarProductos();

    expect(component.errorMessage()).toBe('');
    expect(component.todasLasCategorias()).toEqual([{ id_categoria: 1, nombre: 'Lácteos' }]);
  });
});
