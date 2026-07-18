import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BuscadorComponent } from './buscador';
import { ProductosService } from '@app/services/producto/producto.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { Router } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { TipoPaquete } from '@app/models/Enums';
import { getProductSlugUrl, getPaqueteSlugUrl } from '@app/shared/utils/obfuscator';

describe('BuscadorComponent', () => {
  let component: BuscadorComponent;
  let fixture: ComponentFixture<BuscadorComponent>;
  let mockProductosService: any;
  let mockPaquetesService: any;
  let mockRouter: any;

  const mockProductos: Producto[] = [
    {
      id_producto: 1,
      nombre: 'Camiseta de Algodón',
      precio: 1500,
      marca: { nombre: 'MarcaA' },
      categoria: { nombre: 'Ropa' },
      descripcion: 'Camiseta suave y cómoda',
      tipo: TipoPaquete.SINERGICO,
      imagenes: [],
      marca_id:1,
      categoria_id:1
    },
    {
      id_producto: 2,
      nombre: 'Pantalón de Jean',
      precio: 3000,
      marca: { nombre: 'MarcaB' },
      categoria: { nombre: 'Ropa' },
      descripcion: 'Jean azul clásico',
      tipo: TipoPaquete.SINERGICO,
      imagenes: [],
      marca_id:2,
      categoria_id:3
    }
  ];

  const mockPaquetes: PaquetePublicado[] = [
    {
      id_paquete_publicado: 1,
      paqueteBaseId: 10,
      cant_productos: 2,
      fecha_inicio: new Date(),
      fecha_fin: new Date(),
      estadoId: 1,
      zonaId: 1,
      paqueteBase: {
        id_paquete_base: 10,
        nombre: 'Paquete de Ropa',
        descripcion: 'Un combo ideal de ropa',
        imagen_url: '',
        categoria_id: 1,
        productos: []
      }
    }
  ];

  beforeEach(async () => {
    mockProductosService = {
      getProductos: vi.fn().mockReturnValue(of(mockProductos))
    };

    mockPaquetesService = {
      getPaquetes: vi.fn().mockReturnValue(of(mockPaquetes))
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [BuscadorComponent, NgIconsModule.withIcons({})],
      providers: [
        { provide: ProductosService, useValue: mockProductosService },
        { provide: PaquetePublicadoService, useValue: mockPaquetesService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BuscadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe filtrar productos y paquetes por término de búsqueda con debounce de 300ms', async () => {
    vi.useFakeTimers();
    
    component.onSearchChange('Camiseta');
    expect(component.resultados().cargando).toBe(false); // No se dispara inmediatamente
    
    // Avanzar debounce
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();

    expect(mockProductosService.getProductos).toHaveBeenCalled();
    expect(mockPaquetesService.getPaquetes).toHaveBeenCalled();
    
    const res = component.resultados();
    expect(res.productos.length).toBe(1);
    expect(res.productos[0].nombre).toBe('Camiseta de Algodón');
    expect(res.paquetes.length).toBe(0);
  });

  it('debe filtrar paquetes por término de búsqueda', async () => {
    vi.useFakeTimers();
    
    component.onSearchChange('Paquete');
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();

    const res = component.resultados();
    expect(res.productos.length).toBe(0);
    expect(res.paquetes.length).toBe(1);
    expect(res.paquetes[0].paqueteBase?.nombre).toBe('Paquete de Ropa');
  });

  it('si no hay coincidencia, debe retornar resultados vacíos', async () => {
    vi.useFakeTimers();
    
    component.onSearchChange('Inexistente');
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();

    const res = component.resultados();
    expect(res.productos.length).toBe(0);
    expect(res.paquetes.length).toBe(0);
    expect(component.hayResultados()).toBe(false);
  });

  it('no debe lanzar error y debe manejar correctamente paquetes con paqueteBase o descripción nula/incompleta', async () => {
    vi.useFakeTimers();
    
    const paqueteIncompleto: PaquetePublicado = {
      id_paquete_publicado: 2,
      paqueteBaseId: 11,
      cant_productos: 1,
      fecha_inicio: new Date(),
      fecha_fin: new Date(),
      estadoId: 1,
      zonaId: 1,
      paqueteBase: undefined // paqueteBase no definido
    };

    const paqueteSinDescripcion: PaquetePublicado = {
      id_paquete_publicado: 3,
      paqueteBaseId: 12,
      cant_productos: 1,
      fecha_inicio: new Date(),
      fecha_fin: new Date(),
      estadoId: 1,
      zonaId: 1,
      paqueteBase: {
        id_paquete_base: 12,
        nombre: 'Paquete de prueba',
        descripcion: "", // descripcion undefined
        imagen_url: '',
        categoria_id: 1,
        productos: []
      }
    };

    mockPaquetesService.getPaquetes.mockReturnValue(of([paqueteIncompleto, paqueteSinDescripcion]));
    
    component.onSearchChange('prueba');
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();

    const res = component.resultados();
    expect(res.paquetes.length).toBe(1); // Debe encontrar 'Paquete de prueba' sin romperse
    expect(res.paquetes[0].id_paquete_publicado).toBe(3);
  });

  // ═══════════════════════════════════════════════════════════
  // 1. Navegación — verProducto() y verPaquete()
  // ═══════════════════════════════════════════════════════════

  describe('Navegación', () => {
    it('verProducto() debe navegar a /producto/:id con el id correcto', () => {
      const producto: Producto = { ...mockProductos[0] };

      component.verProducto(producto);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/producto', getProductSlugUrl(producto)]);
    });

    it('verProducto() debe cerrar búsqueda, limpiar término y emitir resultadoSeleccionado', () => {
      component.searchOpen.set(true);
      component.searchTerm.set('test');
      const emitSpy = vi.spyOn(component.resultadoSeleccionado, 'emit');

      component.verProducto(mockProductos[0]);

      expect(component.searchOpen()).toBe(false);
      expect(component.searchTerm()).toBe('');
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('verProducto() no debe navegar si el producto no tiene id_producto', () => {
      const productoSinId: Producto = { ...mockProductos[0], id_producto: undefined as any };

      component.verProducto(productoSinId);

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('verPaquete() debe navegar a /paquete/:paqueteId/productos con el id correcto', () => {
      const paquete: PaquetePublicado = { ...mockPaquetes[0] };

      component.verPaquete(paquete);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/paquete', getPaqueteSlugUrl(paquete), 'productos']);
    });

    it('verPaquete() debe cerrar búsqueda, limpiar término y emitir resultadoSeleccionado', () => {
      component.searchOpen.set(true);
      component.searchTerm.set('test');
      const emitSpy = vi.spyOn(component.resultadoSeleccionado, 'emit');

      component.verPaquete(mockPaquetes[0]);

      expect(component.searchOpen()).toBe(false);
      expect(component.searchTerm()).toBe('');
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('verPaquete() no debe navegar si el paquete no tiene id_paquete_publicado', () => {
      const paqueteSinId: PaquetePublicado = { ...mockPaquetes[0], id_paquete_publicado: undefined as any };

      component.verPaquete(paqueteSinId);

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 2. Filtro por tipo — cambiarTipoBusqueda()
  // ═══════════════════════════════════════════════════════════

  describe('Filtro por tipo', () => {
    it('setear "productos" debe mostrar solo productos', () => {
      component.cambiarTipoBusqueda('productos');

      expect(component.mostrarProductos()).toBe(true);
      expect(component.mostrarPaquetes()).toBe(false);
    });

    it('setear "paquetes" debe mostrar solo paquetes', () => {
      component.cambiarTipoBusqueda('paquetes');

      expect(component.mostrarPaquetes()).toBe(true);
      expect(component.mostrarProductos()).toBe(false);
    });

    it('setear "todo" debe mostrar ambos', () => {
      component.cambiarTipoBusqueda('productos');
      component.cambiarTipoBusqueda('todo');

      expect(component.mostrarProductos()).toBe(true);
      expect(component.mostrarPaquetes()).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 3. Manejo de errores del backend
  // ═══════════════════════════════════════════════════════════

  describe('Manejo de errores', () => {
    it('si getProductos() falla, productos debe quedar en [] y cargando en false', async () => {
      vi.useFakeTimers();
      mockProductosService.getProductos.mockReturnValue(throwError(() => new Error('fail')));

      component.onSearchChange('algo');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(component.resultados().productos).toEqual([]);
      expect(component.resultados().cargando).toBe(false);
    });

    it('si getPaquetes() falla, paquetes debe quedar en [] y cargando en false', async () => {
      vi.useFakeTimers();
      mockPaquetesService.getPaquetes.mockReturnValue(throwError(() => new Error('fail')));

      component.onSearchChange('algo');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(component.resultados().paquetes).toEqual([]);
      expect(component.resultados().cargando).toBe(false);
    });

    it('si ambos servicios fallan, cargando debe quedar en false (finalize se ejecuta)', async () => {
      vi.useFakeTimers();
      mockProductosService.getProductos.mockReturnValue(throwError(() => new Error('fail')));
      mockPaquetesService.getPaquetes.mockReturnValue(throwError(() => new Error('fail')));

      component.onSearchChange('algo');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(component.resultados().cargando).toBe(false);
      expect(component.resultados().productos).toEqual([]);
      expect(component.resultados().paquetes).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 4. Limpiar búsqueda / término vacío
  // ═══════════════════════════════════════════════════════════

  describe('Limpiar búsqueda', () => {
    it('limpiarBusqueda() debe resetear resultados y searchTerm al estado inicial', async () => {
      vi.useFakeTimers();

      component.onSearchChange('Camiseta');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();
      expect(component.resultados().productos.length).toBe(1);

      component.limpiarBusqueda();

      expect(component.searchTerm()).toBe('');
      expect(component.resultados().productos).toEqual([]);
      expect(component.resultados().paquetes).toEqual([]);
      expect(component.resultados().cargando).toBe(false);
      expect(component.resultados().error).toBeNull();
    });

    it('onSearchChange con término vacío debe vaciar resultados sin llamar a los servicios', async () => {
      vi.useFakeTimers();

      component.onSearchChange('Camiseta');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();
      expect(component.resultados().productos.length).toBe(1);

      mockProductosService.getProductos.mockClear();
      mockPaquetesService.getPaquetes.mockClear();

      component.onSearchChange('');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(component.resultados().productos).toEqual([]);
      expect(component.resultados().paquetes).toEqual([]);
      expect(mockProductosService.getProductos).not.toHaveBeenCalled();
      expect(mockPaquetesService.getPaquetes).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 5. Límite de 6 resultados y conteo total
  // ═══════════════════════════════════════════════════════════

  describe('Límite de 6 resultados y Carga Incremental', () => {
    it('debe mostrar como máximo 6 productos aunque haya más coincidencias inicialmente', async () => {
      vi.useFakeTimers();

      const muchosProductos: Producto[] = Array.from({ length: 10 }, (_, i) => ({
        id_producto: i + 1,
        nombre: `Producto Alpha ${i + 1}`,
        precio: 1000,
        marca: { nombre: 'MarcaX' },
        categoria: { nombre: 'CatX' },
        descripcion: `Descripción del producto ${i + 1}`,
        tipo: TipoPaquete.SINERGICO,
        imagenes: [],
        marca_id: 1,
        categoria_id: 1,
      }));

      mockProductosService.getProductos.mockReturnValue(of(muchosProductos));

      component.onSearchChange('Alpha');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(component.productosSlices().length).toBe(6);
    });

    it('debe mostrar como máximo 6 paquetes aunque haya más coincidencias inicialmente', async () => {
      vi.useFakeTimers();

      const muchosPaquetes: PaquetePublicado[] = Array.from({ length: 8 }, (_, i) => ({
        id_paquete_publicado: i + 1,
        paqueteBaseId: i + 100,
        cant_productos: 1,
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
        estadoId: 1,
        zonaId: 1,
        paqueteBase: {
          id_paquete_base: i + 100,
          nombre: `Paquete Beta ${i + 1}`,
          descripcion: `Descripción paquete ${i + 1}`,
          imagen_url: '',
          categoria_id: 1,
          productos: [],
        },
      }));

      mockPaquetesService.getPaquetes.mockReturnValue(of(muchosPaquetes));

      component.onSearchChange('Beta');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(component.paquetesSlices().length).toBe(6);
    });

    it('totalResultados debe reflejar la cantidad real de matches (no el limitado a 6)', async () => {
      vi.useFakeTimers();

      const ochoProductos: Producto[] = Array.from({ length: 8 }, (_, i) => ({
        id_producto: i + 1,
        nombre: `Producto Gamma ${i + 1}`,
        precio: 1000,
        marca: { nombre: 'MarcaY' },
        categoria: { nombre: 'CatY' },
        descripcion: `Descripción gamma ${i + 1}`,
        tipo: TipoPaquete.SINERGICO,
        imagenes: [],
        marca_id: 1,
        categoria_id: 1,
      }));

      mockProductosService.getProductos.mockReturnValue(of(ochoProductos));

      component.onSearchChange('Gamma');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      // productosSlices() tiene 6 inicialmente
      expect(component.productosSlices().length).toBe(6);
      // totalResultados() refleja el total real de matches
      expect(component.totalResultados()).toBe(8);
    });

    it('debe cargar más resultados al hacer scroll cerca del final', async () => {
      vi.useFakeTimers();

      const muchosProductos: Producto[] = Array.from({ length: 15 }, (_, i) => ({
        id_producto: i + 1,
        nombre: `Producto Delta ${i + 1}`,
        precio: 1000,
        marca: { nombre: 'MarcaZ' },
        categoria: { nombre: 'CatZ' },
        descripcion: `Descripción delta ${i + 1}`,
        tipo: TipoPaquete.SINERGICO,
        imagenes: [],
        marca_id: 1,
        categoria_id: 1,
      }));

      mockProductosService.getProductos.mockReturnValue(of(muchosProductos));

      component.onSearchChange('Delta');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      // Inicialmente muestra 6
      expect(component.productosSlices().length).toBe(6);
      expect(component.limiteMostrado()).toBe(6);

      // Gatillamos scroll
      const mockEvent = {
        target: {
          scrollHeight: 1000,
          scrollTop: 860, // 1000 - 860 - 100 = 40 (menos de 50px del final)
          clientHeight: 100
        }
      } as unknown as Event;

      component.onScroll(mockEvent);

      // Ahora el límite debe incrementarse en 6
      expect(component.limiteMostrado()).toBe(12);
      expect(component.productosSlices().length).toBe(12);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 6. Matching por marca y por categoría
  // ═══════════════════════════════════════════════════════════

  describe('Matching por marca y categoría', () => {
    it('debe encontrar un producto buscando solo por nombre de marca', async () => {
      vi.useFakeTimers();

      component.onSearchChange('MarcaA');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(component.resultados().productos.length).toBe(1);
      expect(component.resultados().productos[0].id_producto).toBe(1);
    });

    it('debe encontrar un producto buscando solo por nombre de categoría', async () => {
      vi.useFakeTimers();

      component.onSearchChange('Ropa');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      // Ambos productos tienen categoria 'Ropa'
      expect(component.resultados().productos.length).toBe(2);
    });

    it('debe encontrar un paquete buscando por nombre de marca del paqueteBase', async () => {
      vi.useFakeTimers();

      const paqueteConMarca: PaquetePublicado = {
        id_paquete_publicado: 10,
        paqueteBaseId: 50,
        cant_productos: 3,
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
        estadoId: 1,
        zonaId: 1,
        paqueteBase: {
          id_paquete_base: 50,
          nombre: 'Combo Especial',
          descripcion: 'Un combo completo',
          imagen_url: '',
          categoria_id: 1,
          marca: { id_marca: 1, nombre: 'MarcaZ' },
          productos: [],
        },
      };

      mockPaquetesService.getPaquetes.mockReturnValue(of([paqueteConMarca]));

      component.onSearchChange('MarcaZ');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(component.resultados().paquetes.length).toBe(1);
      expect(component.resultados().paquetes[0].id_paquete_publicado).toBe(10);
    });

    it('debe encontrar un paquete buscando por nombre de categoría del paqueteBase', async () => {
      vi.useFakeTimers();

      const paqueteConCategoria: PaquetePublicado = {
        id_paquete_publicado: 20,
        paqueteBaseId: 60,
        cant_productos: 2,
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
        estadoId: 1,
        zonaId: 1,
        paqueteBase: {
          id_paquete_base: 60,
          nombre: 'Combo Limpieza',
          descripcion: 'Todo para limpiar',
          imagen_url: '',
          categoria_id: 2,
          categoria: { id_categoria: 2, nombre: 'Hogar' },
          productos: [],
        },
      };

      mockPaquetesService.getPaquetes.mockReturnValue(of([paqueteConCategoria]));

      component.onSearchChange('Hogar');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(component.resultados().paquetes.length).toBe(1);
      expect(component.resultados().paquetes[0].id_paquete_publicado).toBe(20);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 7. distinctUntilChanged
  // ═══════════════════════════════════════════════════════════

  describe('distinctUntilChanged', () => {
    it('no debe volver a llamar a los servicios si se busca el mismo término dos veces', async () => {
      vi.useFakeTimers();

      component.onSearchChange('Camiseta');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      expect(mockProductosService.getProductos).toHaveBeenCalledTimes(1);
      expect(mockPaquetesService.getPaquetes).toHaveBeenCalledTimes(1);

      component.onSearchChange('Camiseta');
      await vi.advanceTimersByTimeAsync(300);
      fixture.detectChanges();

      // distinctUntilChanged bloquea el segundo emission del mismo valor
      expect(mockProductosService.getProductos).toHaveBeenCalledTimes(1);
      expect(mockPaquetesService.getPaquetes).toHaveBeenCalledTimes(1);
    });
  });
});
