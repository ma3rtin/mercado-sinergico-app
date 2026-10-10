import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductosService } from './producto.service';
import { PaquetePublicadoService } from '../paquete/paquete-publicado.service';
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

  const ordenes = ['recientes', 'a-z', 'z-a', 'precio-asc', 'precio-desc', 'mas-stock'];

  ordenes.forEach(orden => {
    it(`manda orden=${orden} al backend`, () => {
      service.getProductosPaginados(1, 12, { ...filtrosVacios, ordenamiento: orden }).subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/productos`);
      expect(req.request.params.get('orden')).toBe(orden);
      req.flush([], { headers: { 'X-Total-Count': '0' } });
    });
  });

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

describe('PaquetePublicadoService — parámetro de ordenamiento', () => {
  let service: PaquetePublicadoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaquetePublicadoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaquetePublicadoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  ['recientes', 'a-z', 'z-a', 'mas-participantes'].forEach(orden => {
    it(`manda orden=${orden} al backend`, () => {
      service.getPaquetesPaginados(1, 12, { ordenamiento: orden }).subscribe();

      const req = httpMock.expectOne(r => r.params.has('orden'));
      expect(req.request.params.get('orden')).toBe(orden);
      req.flush([], { headers: { 'X-Total-Count': '0' } });
    });
  });

  it('omite orden cuando no hay ordenamiento elegido', () => {
    service.getPaquetesPaginados(1, 12, { ordenamiento: '' }).subscribe();

    const req = httpMock.expectOne(r => r.params.get('page') === '1');
    expect(req.request.params.has('orden')).toBe(false);
    req.flush([], { headers: { 'X-Total-Count': '0' } });
  });
});
