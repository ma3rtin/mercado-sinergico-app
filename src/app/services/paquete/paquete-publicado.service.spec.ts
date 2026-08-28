import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PaquetePublicadoService } from './paquete-publicado.service';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { environment } from '@environments/environment';

describe('PaquetePublicadoService', () => {
  let service: PaquetePublicadoService;
  let httpMock: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PaquetePublicadoService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PaquetePublicadoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse', () => {
    expect(service).toBeTruthy();
  });

  describe('endpoints', () => {
    it('getPaquetesPorCerrarse pega a /paquetes-publicados/por-cerrarse', () => {
      service.getPaquetesPorCerrarse().subscribe();

      const req = httpMock.expectOne(`${base}/paquetes-publicados/por-cerrarse`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('getPaquetesCerrados pega a /paquetes-publicados/cerrados', () => {
      service.getPaquetesCerrados().subscribe();

      const req = httpMock.expectOne(`${base}/paquetes-publicados/cerrados`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('getPaqueteById incluye el id en la ruta', () => {
      service.getPaqueteById(7).subscribe();

      const req = httpMock.expectOne(`${base}/paquetes-publicados/7`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('getRelacionados incluye el id en la ruta', () => {
      service.getRelacionados(7).subscribe();

      httpMock.expectOne(`${base}/paquetes-publicados/relacionados/7`).flush([]);
    });

    it('getByProductId incluye el id del producto en la ruta', () => {
      service.getByProductId(42).subscribe();

      httpMock.expectOne(`${base}/paquetes-publicados/producto/42`).flush([]);
    });

    it('getAllPaquetes agrega includeArchived sólo cuando se pide', () => {
      service.getAllPaquetes(true).subscribe();
      httpMock
        .expectOne(`${base}/paquetes-publicados?includeArchived=true`)
        .flush([]);

      service.getAllPaquetes().subscribe();
      httpMock.expectOne(`${base}/paquetes-publicados`).flush([]);
    });

    it.each([
      ['completarPaquete', 'completar', {}],
      ['confirmarCompra', 'confirmar', {}],
      ['marcarEntregado', 'entregar', {}],
    ] as const)('%s hace POST a /%s', (metodo, ruta, body) => {
      (service[metodo] as (id: number) => { subscribe: () => void })(3).subscribe();

      const req = httpMock.expectOne(`${base}/paquetes-publicados/3/${ruta}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ message: 'ok' });
    });

    it('marcarEnCamino manda los ids de pedido en el body', () => {
      service.marcarEnCamino(3, [10, 11]).subscribe();

      const req = httpMock.expectOne(`${base}/paquetes-publicados/3/marcar-en-camino`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ pedidoIds: [10, 11] });
      req.flush({ message: 'ok', notificados: 2 });
    });
  });

  describe('getPaquetesPaginados', () => {
    it('manda page y limit como string', () => {
      service.getPaquetesPaginados(2, 12).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === `${base}/paquetes-publicados`
      );
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('12');
      req.flush([]);
    });

    it('serializa los filtros de array separados por coma', () => {
      service
        .getPaquetesPaginados(1, 12, {
          categorias: [1, 2],
          marcas: [3],
          zonas: [4, 5],
          tiposPaquete: ['SINERGICO'],
          estados: ['por-cerrar'],
          ordenamiento: 'recientes',
        })
        .subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === `${base}/paquetes-publicados`
      );
      expect(req.request.params.get('categorias')).toBe('1,2');
      expect(req.request.params.get('marcas')).toBe('3');
      expect(req.request.params.get('zonas')).toBe('4,5');
      expect(req.request.params.get('tiposPaquete')).toBe('SINERGICO');
      expect(req.request.params.get('estados')).toBe('por-cerrar');
      expect(req.request.params.get('orden')).toBe('recientes');
      req.flush([]);
    });

    it('omite los filtros vacíos', () => {
      service
        .getPaquetesPaginados(1, 12, { categorias: [], marcas: [], zonas: [] })
        .subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === `${base}/paquetes-publicados`
      );
      expect(req.request.params.has('categorias')).toBe(false);
      expect(req.request.params.has('marcas')).toBe(false);
      expect(req.request.params.has('zonas')).toBe(false);
      req.flush([]);
    });

    it('lee el total del header X-Total-Count', () => {
      let resultado: { paquetes: PaquetePublicado[]; total: number } | undefined;
      service.getPaquetesPaginados(1, 12).subscribe((r) => (resultado = r));

      const req = httpMock.expectOne(
        (r) => r.url === `${base}/paquetes-publicados`
      );
      req.flush([{ id_paquete_publicado: 1 } as PaquetePublicado], {
        headers: { 'X-Total-Count': '37' },
      });

      expect(resultado?.total).toBe(37);
      expect(resultado?.paquetes.length).toBe(1);
    });

    it('devuelve total 0 cuando el backend no manda el header', () => {
      let resultado: { paquetes: PaquetePublicado[]; total: number } | undefined;
      service.getPaquetesPaginados(1, 12).subscribe((r) => (resultado = r));

      httpMock
        .expectOne((r) => r.url === `${base}/paquetes-publicados`)
        .flush([]);

      expect(resultado?.total).toBe(0);
      expect(resultado?.paquetes).toEqual([]);
    });
  });

  describe('filtros de admin', () => {
    const paquetes = [
      { estado: { nombre: 'Completo' }, archivado: false },
      { estado: { nombre: 'Confirmado' }, archivado: true },
      { estado: { nombre: 'Cancelado' }, archivado: false },
      { estado: { nombre: 'Recibido' }, archivado: true },
      { estado: { nombre: 'Activo' }, archivado: false },
    ] as unknown as PaquetePublicado[];

    it('getPaquetesCompletos deja sólo Completo y Confirmado no archivados', () => {
      let resultado: PaquetePublicado[] = [];
      service.getPaquetesCompletos().subscribe((r) => (resultado = r));

      httpMock.expectOne(`${base}/paquetes-publicados`).flush(paquetes);

      expect(resultado.map((p) => p.estado?.nombre)).toEqual(['Completo']);
    });

    it('getPaquetesFinalizados deja sólo Recibido y Cancelado no archivados', () => {
      let resultado: PaquetePublicado[] = [];
      service.getPaquetesFinalizados().subscribe((r) => (resultado = r));

      httpMock.expectOne(`${base}/paquetes-publicados`).flush(paquetes);

      expect(resultado.map((p) => p.estado?.nombre)).toEqual(['Cancelado']);
    });

    it('con includeArchived incluye también los archivados', () => {
      let resultado: PaquetePublicado[] = [];
      service.getPaquetesCompletos(true).subscribe((r) => (resultado = r));

      httpMock
        .expectOne(`${base}/paquetes-publicados?includeArchived=true`)
        .flush(paquetes);

      expect(resultado.map((p) => p.estado?.nombre)).toEqual([
        'Completo',
        'Confirmado',
      ]);
    });
  });
});
