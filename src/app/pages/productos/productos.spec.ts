import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductosComponent } from './productos';
import { ProductosService } from '@app/services/producto/producto.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { ZonaService } from '@app/services/zona/zona.service';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { TipoPaquete } from '@app/models/Enums';
import { NgIconsModule } from '@ng-icons/core';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { vi } from 'vitest';

describe('ProductosComponent', () => {
  let component: ProductosComponent;
  let fixture: ComponentFixture<ProductosComponent>;
  let mockUsuarioService: { perfilUsuario: ReturnType<typeof signal<any>> };

  const prodEnPaquete: Producto = {
    id_producto: 1,
    nombre: 'Producto en paquete activo',
    precio: 100,
    categoria_id: 1,
    marca_id: 1,
    tipo: TipoPaquete.SINERGICO,
    descripcion: 'Descripción del producto',
    imagenes: [],
  };

  const prodSinPaquete: Producto = {
    id_producto: 2,
    nombre: 'Producto sin paquete',
    precio: 200,
    categoria_id: 2,
    marca_id: 2,
    tipo: TipoPaquete.SINERGICO,
    descripcion: 'Descripción del producto',
    imagenes: [],
  };

  const mockPaqueteActivo: PaquetePublicado = {
    id_paquete_publicado: 1,
    paqueteBaseId: 1,
    estadoId: 1,
    zonaId: 1,
    fecha_inicio: new Date(),
    fecha_fin: new Date(),
    estado: { id_estado: 1, nombre: 'Activo' },
    paqueteBase: {
      id_paquete_base: 1,
      nombre: 'Paquete Activo',
      descripcion: '',
      imagen_url: '',
      categoria_id: 1,
      productos: [{ id: 1, productoId: 1, paqueteBaseId: 1 }],
    },
  };

  beforeEach(async () => {
    mockUsuarioService = {
      perfilUsuario: signal<any>(null),
    };

    await TestBed.configureTestingModule({
      imports: [
        ProductosComponent,
        NgIconsModule.withIcons({}),
      ],
      providers: [
        { provide: ProductosService, useValue: { getProductos: () => of([]) } },
        { provide: CategoriaService, useValue: { getCategorias: () => of([]) } },
        { provide: MarcaService, useValue: { getMarcas: () => of([]) } },
        { provide: ZonaService, useValue: { getZonas: () => of([]) } },
        { provide: UsuarioService, useValue: mockUsuarioService },
        {
          provide: PaquetePublicadoService,
          useValue: {
            getPaquetes: () => of([]),
            getPaqueteById: () => of({}),
          },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductosComponent);
    component = fixture.componentInstance;
    // No detectChanges — control signals manually to avoid async ngOnInit
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('productosFiltrados() excluye productos que no pertenecen a ningún paquete activo, incluso sin zona seleccionada', () => {
    component.productosOriginales.set([prodEnPaquete, prodSinPaquete]);
    component.paquetesActivos.set([mockPaqueteActivo]);

    const result = component.productosFiltrados();
    expect(result.length).toBe(1);
    expect(result[0].id_producto).toBe(1);
  });

  it('si ningún producto pertenece a un paquete activo, productosFiltrados() devuelve lista vacía', () => {
    component.productosOriginales.set([prodSinPaquete]);
    component.paquetesActivos.set([]);

    const result = component.productosFiltrados();
    expect(result).toEqual([]);
  });

  it('combina correctamente filtro de categoría + paquete activo (AND, no OR)', () => {
    component.productosOriginales.set([prodEnPaquete]);
    component.paquetesActivos.set([mockPaqueteActivo]);
    component.filtrosActuales.set({
      categorias: [999],
      marcas: [],
      tiposPaquete: [],
      ordenamiento: '',
      rangoPrecio: { min: null, max: null },
      estados: [],
      zonas: [],
    });

    const result = component.productosFiltrados();
    expect(result).toEqual([]);
  });

  it('limpiarFiltros() reaplica la zona del perfil del usuario si existe', () => {
    (mockUsuarioService.perfilUsuario as any).set({
      id: 1,
      email: 'test@test.com',
      nombre: 'Test',
      telefono: '123456789',
      rolId: 2,
      direccion: {
        usuarioId: 1,
        localidadId: 1,
        codigo_postal: 1000,
        calle: 'Test',
        numero: 123,
        localidad: {
          id_localidad: 1,
          nombre: 'Test Localidad',
          codigo_postal: 1000,
          zonas: [{ id_zona: 1, nombre: 'Test Zona' }],
        },
      },
    });

    component.filtrosActuales.set({
      categorias: [1],
      marcas: [],
      tiposPaquete: [],
      ordenamiento: '',
      rangoPrecio: { min: null, max: null },
      estados: [],
      zonas: [999],
    });

    component.limpiarFiltros();

    expect(component.filtrosActuales()).not.toBeNull();
    expect(component.filtrosActuales()!.zonas).toEqual([1]);
  });

  it('limpiarFiltros() setea null si el perfil no tiene zona cargada', () => {
    component.filtrosActuales.set({
      categorias: [1],
      marcas: [],
      tiposPaquete: [],
      ordenamiento: '',
      rangoPrecio: { min: null, max: null },
      estados: [],
      zonas: [],
    });

    component.limpiarFiltros();

    expect(component.filtrosActuales()).toBeNull();
  });
});
