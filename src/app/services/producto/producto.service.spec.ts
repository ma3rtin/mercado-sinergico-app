import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductosService } from './producto.service';
import { environment } from '@environments/environment';

describe('ProductosService — parámetro de ordenamiento', () => {
  let service: ProductosService;
  let httpMock: HttpTestingController;

  const filtrosVacios = {
    categorias: [],
    marcas: [],
    zonas: [],
    tiposPaquete: [],
    estados: [],
    ordenamiento: '',
    rangoPrecio: { min: null, max: null },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductosService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('omite el parámetro orden cuando no hay ordenamiento elegido', () => {
    service.getProductosPaginados(1, 12, filtrosVacios).subscribe();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/productos`);
    expect(req.request.params.has('orden')).toBe(false);
    req.flush([], { headers: { 'X-Total-Count': '0' } });
  });

  it('combina orden con el resto de los filtros', () => {
    service.getProductosPaginados(2, 12, {
      ...filtrosVacios,
      zonas: [7],
      ordenamiento: 'precio-asc',
      rangoPrecio: { min: 100, max: 500 },
    }).subscribe();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/productos`);
    expect(req.request.params.get('orden')).toBe('precio-asc');
    expect(req.request.params.get('zonas')).toBe('7');
    expect(req.request.params.get('precioMin')).toBe('100');
    expect(req.request.params.get('precioMax')).toBe('500');
    expect(req.request.params.get('page')).toBe('2');
    req.flush([], { headers: { 'X-Total-Count': '0' } });
  });
});

describe('ProductosService — contrato con la API', () => {
  let service: ProductosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductosService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('parsea X-Total-Count como el total de la respuesta', () => {
    let total: number | undefined;
    service.getProductosPaginados(1, 12).subscribe((res) => (total = res.total));

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/productos`);
    req.flush([], { headers: { 'X-Total-Count': '37' } });

    expect(total).toBe(37);
  });

  it('el listado público no manda includeArchived', () => {
    service.getProductosPaginados(1, 12).subscribe();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/productos`);
    expect(req.request.params.has('includeArchived')).toBe(false);
    req.flush([], { headers: { 'X-Total-Count': '0' } });
  });

  it('normaliza id -> id_producto e imagen -> imagen_url, como los manda ProductoItemListaDTO', () => {
    let productos: { id_producto?: number; imagen_url?: string }[] = [];
    service.getProductosPaginados(1, 12).subscribe((res) => (productos = res.productos));

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/productos`);
    req.flush(
      [{ id: 5, nombre: 'Producto', imagen: 'foto.jpg', precio: 100 }],
      { headers: { 'X-Total-Count': '1' } }
    );

    expect(productos[0].id_producto).toBe(5);
    expect(productos[0].imagen_url).toBe('foto.jpg');
  });
});
