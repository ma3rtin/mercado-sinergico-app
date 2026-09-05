import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PaqueteUsuarioCardComponent } from './paquete-usuario-card';

describe('PaqueteUsuarioCardComponent.porcentajeReservado', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
  });

  const montarCon = (cantProductos: number | null, reservados: number | null) => {
    const component = TestBed.runInInjectionContext(() => new PaqueteUsuarioCardComponent());
    component.pedido = {
      paquetePublicado: {
        cant_productos: cantProductos,
        cant_productos_reservados: reservados,
      },
    };
    return component;
  };

  it('delega en calcularPorcentajeStock para el stat numérico', () => {
    expect(montarCon(8, 2).porcentajeReservado).toBe(25);
  });

  it('clampea en los extremos igual que la función pura', () => {
    expect(montarCon(5, 8).porcentajeReservado).toBe(100);
    expect(montarCon(0, 2).porcentajeReservado).toBe(0);
  });
});