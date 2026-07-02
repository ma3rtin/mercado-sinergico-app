import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PaqueteBaseService } from './paquete-base.service';
import { environment } from '@environments/environment';

describe('PaqueteBaseService', () => {
  let service: PaqueteBaseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PaqueteBaseService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PaqueteBaseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call getPaquetes with includeArchived=true when requested', () => {
    service.getPaquetes(true).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/paquetes-base?includeArchived=true`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should call getPaquetes with default includeArchived=false', () => {
    service.getPaquetes().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/paquetes-base`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should call archivarPaquete with correct endpoint and payload', () => {
    service.archivarPaquete(12, true).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/paquetes-base/12/archivar`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ archivado: true });
    req.flush({});
  });

  it('should call agregarProductos with correct endpoint and payload in body', () => {
    service.agregarProductos(5, [1, 2, 3]).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/paquetes-base/agregar-productos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ paqueteBaseId: 5, productosId: [1, 2, 3] });
    req.flush({});
  });
});
