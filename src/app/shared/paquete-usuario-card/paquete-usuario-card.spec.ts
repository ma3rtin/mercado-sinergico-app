import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { PaqueteUsuarioCardComponent } from './paquete-usuario-card';
import { TipoPaquete } from '@app/models/Enums';

describe('PaqueteUsuarioCardComponent', () => {
  let component: PaqueteUsuarioCardComponent;

  const conPedido = (tipo: TipoPaquete, estadoPedido: string, estadoPaquete = 'Activo') => {
    component.pedido = {
      estado: { nombre: estadoPedido },
      paquetePublicado: { tipo, estado: { nombre: estadoPaquete } }
    };
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PaqueteUsuarioCardComponent],
      providers: [provideRouter([]), provideIcons({})]
    });
    component = TestBed.createComponent(PaqueteUsuarioCardComponent).componentInstance;
  });

  describe('puedeReembolsar', () => {
    it('un enérgico se puede cancelar mientras está Reservado', () => {
      conPedido(TipoPaquete.ENERGICO, 'Reservado');
      expect(component.puedeReembolsar).toBe(true);
    });

    it('un enérgico Pagado no ofrece reembolso: no pasó por Mercado Pago', () => {
      conPedido(TipoPaquete.ENERGICO, 'Pagado');
      expect(component.puedeReembolsar).toBe(false);
    });

    it('un sinérgico se puede reembolsar mientras está Pagado', () => {
      conPedido(TipoPaquete.SINERGICO, 'Pagado');
      expect(component.puedeReembolsar).toBe(true);
    });

    it('un sinérgico Reservado no ofrece reembolso', () => {
      conPedido(TipoPaquete.SINERGICO, 'Reservado');
      expect(component.puedeReembolsar).toBe(false);
    });

    it('con el paquete fuera de Activo no se puede cancelar ni reembolsar', () => {
      conPedido(TipoPaquete.ENERGICO, 'Reservado', 'Completo');
      expect(component.puedeReembolsar).toBe(false);

      conPedido(TipoPaquete.SINERGICO, 'Pagado', 'Completo');
      expect(component.puedeReembolsar).toBe(false);
    });
  });
});
