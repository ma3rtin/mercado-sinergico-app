import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideIcons } from '@ng-icons/core';
import { MisPedidosComponent } from './mis-pedidos';
import { PedidoService } from '@app/services/pedido/pedido.service';
import { ToastService } from '@app/services/toast/toast.service';
import { TipoPaquete } from '@app/models/Enums';

describe('MisPedidosComponent', () => {
  let component: MisPedidosComponent;
  let pedidoService: {
    getPedidos: ReturnType<typeof vi.fn>;
    confirmarReserva: ReturnType<typeof vi.fn>;
    iniciarCheckout: ReturnType<typeof vi.fn>;
  };

  const pedido = (tipo: TipoPaquete) => ({
    id_pedido: 5,
    estado: { nombre: 'Pendiente' },
    paquetePublicado: { tipo }
  }) as any;

  beforeEach(() => {
    pedidoService = {
      getPedidos: vi.fn().mockReturnValue(of([])),
      confirmarReserva: vi.fn().mockReturnValue(of({})),
      iniciarCheckout: vi.fn().mockReturnValue(of({}))
    };

    TestBed.configureTestingModule({
      imports: [MisPedidosComponent],
      providers: [
        { provide: PedidoService, useValue: pedidoService },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        provideIcons({})
      ]
    });
    component = TestBed.createComponent(MisPedidosComponent).componentInstance;
  });

  describe('finalizarCompra', () => {
    it('un enérgico confirma la reserva sin pasar por Mercado Pago', () => {
      component.finalizarCompra(pedido(TipoPaquete.ENERGICO));

      expect(pedidoService.confirmarReserva).toHaveBeenCalledWith(5);
      expect(pedidoService.iniciarCheckout).not.toHaveBeenCalled();
    });

    it('un sinérgico inicia el checkout de Mercado Pago', () => {
      component.finalizarCompra(pedido(TipoPaquete.SINERGICO));

      expect(pedidoService.iniciarCheckout).toHaveBeenCalledWith(5);
      expect(pedidoService.confirmarReserva).not.toHaveBeenCalled();
    });
  });
});
