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
import { of, BehaviorSubject } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';

describe('ProductosComponent', () => {
  let component: ProductosComponent;
  let fixture: ComponentFixture<ProductosComponent>;
  let mockUsuarioService: { perfilUsuario: ReturnType<typeof signal<any>> };
  let mockProductosService: any;
  let mockRouter: any;
  let queryParamsSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    mockUsuarioService = {
      perfilUsuario: signal<any>(null),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    queryParamsSubject = new BehaviorSubject<any>({});

    mockProductosService = {
      getProductos: vi.fn().mockReturnValue(of([])),
      getProductosPaginados: vi.fn().mockReturnValue(of({ productos: [], total: 0 })),
    };

    await TestBed.configureTestingModule({
      imports: [
        ProductosComponent,
        NgIconsModule.withIcons({}),
      ],
      providers: [
        { provide: ProductosService, useValue: mockProductosService },
        { provide: CategoriaService, useValue: { getCategorias: () => of([{ id_categoria: 1, nombre: 'Lácteos' }]) } },
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

  it('debería navegar limpiando filtros al llamar a limpiarFiltros', () => {
    component['isBrowser'] = true;
    fixture.detectChanges();

    component.limpiarFiltros();

    expect(component.filtrosActuales()).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalled();
  });
});
