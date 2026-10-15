import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PedidoService } from './pedido.service';
import { environment } from '@environments/environment';

describe('PedidoService', () => {
  let service: PedidoService;
  let httpMock: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PedidoService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PedidoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('confirmarReserva hace POST a /pedidos/:id/confirmar-reserva', () => {
    service.confirmarReserva(12).subscribe();

    const req = httpMock.expectOne(`${base}/pedidos/12/confirmar-reserva`);
    expect(req.request.method).toBe('POST');
    req.flush({ ok: true, estado: 'Reservado', mensaje: '', pedidoId: 12 });
  });

  it('solicitarReembolso hace POST a /pedidos/:id/solicitar-reembolso', () => {
    service.solicitarReembolso(12).subscribe();

    const req = httpMock.expectOne(`${base}/pedidos/12/solicitar-reembolso`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: '', pedidoId: 12 });
  });

  it('iniciarCheckout hace POST a /pedidos/:id/checkout', () => {
    service.iniciarCheckout(12).subscribe();

    const req = httpMock.expectOne(`${base}/pedidos/12/checkout`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
