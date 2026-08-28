import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { PaqueteCard } from './paquete-card';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { TipoPaquete } from '@app/models/Enums';

describe('PaqueteCard', () => {
  let fixture: ComponentFixture<PaqueteCard>;
  let component: PaqueteCard;

  // La API serializa fecha_fin como ISO string, no como Date.
  const enHoras = (horas: number) =>
    new Date(Date.now() + horas * 60 * 60 * 1000).toISOString();

  const montar = async (fechaFin: string | undefined) => {
    await TestBed.configureTestingModule({
      imports: [PaqueteCard, NgIconsModule.withIcons({})],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PaqueteCard);
    component = fixture.componentInstance;
    component.paquete = {
      id_paquete_publicado: 1,
      fecha_fin: fechaFin,
      cant_productos: 10,
      cant_productos_reservados: 2,
    } as unknown as PaquetePublicado;
    fixture.detectChanges();
  };

  const montarCon = async (extra: Partial<PaquetePublicado>) => {
    await montar(enHoras(51));
    component.paquete = { ...component.paquete, ...extra } as PaquetePublicado;
    fixture.detectChanges();
  };

  afterEach(() => fixture?.destroy());

  describe('etiqueta del timer', () => {
    it('debería mostrar el tiempo restante cuando el paquete sigue abierto', async () => {
      await montar(enHoras(51));

      expect(component.getEtiquetaTiempo()).toBe('Finaliza en 2d 2h');
      expect(fixture.nativeElement.textContent).toContain('Finaliza en 2d 2h');
    });

    it('debería decir sólo "Finalizado" cuando la fecha ya pasó', async () => {
      await montar(enHoras(-5));

      expect(component.getEtiquetaTiempo()).toBe('Finalizado');
      // La regresión: el template anteponía "Finaliza en" al estado.
      expect(fixture.nativeElement.textContent).not.toContain('Finaliza en Finalizado');
    });

    it('debería avisar cuando el paquete no tiene fecha de cierre', async () => {
      await montar(undefined);

      expect(component.getEtiquetaTiempo()).toBe('Sin fecha de cierre');
      expect(fixture.nativeElement.textContent).not.toContain('N/A');
    });
  });

  describe('badge de urgencia', () => {
    it('debería mostrarse cuando quedan menos de 24 horas', async () => {
      await montar(enHoras(5));

      expect(fixture.nativeElement.textContent).toContain('Finaliza pronto');
    });

    it('no debería mostrarse en un paquete ya finalizado', async () => {
      await montar(enHoras(-5));

      expect(fixture.nativeElement.textContent).not.toContain('Finaliza pronto');
    });

    it('no debería mostrarse cuando todavía falta más de un día', async () => {
      await montar(enHoras(51));

      expect(fixture.nativeElement.textContent).not.toContain('Finaliza pronto');
    });
  });

  describe('tooltip del timer', () => {
    it('debería describir el cierre cuando el paquete sigue abierto', async () => {
      await montar(enHoras(51));

      expect(component.getTimerTooltip()).toBe('Cierra en 2d 2h');
    });

    it('no debería concatenar el prefijo con un estado', async () => {
      await montar(enHoras(-5));

      expect(component.getTimerTooltip()).toBe('Este paquete ya finalizó');
    });
  });

  describe('stock y progreso', () => {
    it('calcula el stock disponible restando lo reservado', async () => {
      await montar(enHoras(51));

      expect(component.stockDisponible()).toBe(8);
    });

    it('nunca devuelve stock negativo si hay más reservas que productos', async () => {
      await montarCon({ cant_productos: 5, cant_productos_reservados: 8 });

      expect(component.stockDisponible()).toBe(0);
    });

    it('calcula el porcentaje reservado', async () => {
      await montarCon({ cant_productos: 8, cant_productos_reservados: 2 });

      expect(component.porcentajeReservado()).toBe(25);
    });

    it('devuelve 0% en vez de dividir por cero cuando no hay productos', async () => {
      await montarCon({ cant_productos: 0, cant_productos_reservados: 0 });

      expect(component.porcentajeReservado()).toBe(0);
    });

    it('recalcula al cambiar el paquete y no se queda con el valor viejo', async () => {
      await montar(enHoras(51));
      expect(component.stockDisponible()).toBe(8);
      expect(component.porcentajeReservado()).toBe(20);

      component.paquete = {
        ...component.paquete,
        cant_productos: 4,
        cant_productos_reservados: 3,
      } as PaquetePublicado;
      fixture.detectChanges();

      expect(component.stockDisponible()).toBe(1);
      expect(component.porcentajeReservado()).toBe(75);
    });

    it.each([
      [10, 'text-success', 'bg-success'],
      [40, 'text-attention-dark', 'bg-attention'],
      [70, 'text-warning', 'bg-warning'],
      [90, 'text-error', 'bg-error'],
    ])('con %i%% reservado usa los colores de ese tramo', async (pct, texto, barra) => {
      await montarCon({ cant_productos: 100, cant_productos_reservados: pct });

      expect(component.getPercentageTextClass()).toBe(texto);
      expect(component.obtenerColorBarra()).toBe(barra);
    });
  });

  describe('helpers de tipo', () => {
    it('reconoce un paquete enérgico', async () => {
      await montarCon({ tipo: TipoPaquete.ENERGICO });

      expect(component.isEnergico()).toBe(true);
      expect(component.isSinergico()).toBe(false);
      expect(component.getBorderColorClass()).toBe('border-l-secondary-dark');
      expect(component.getDiscountBadgeClass()).toContain('secondary-dark');
    });

    it('reconoce un paquete sinérgico', async () => {
      await montarCon({ tipo: TipoPaquete.SINERGICO });

      expect(component.isSinergico()).toBe(true);
      expect(component.isEnergico()).toBe(false);
      expect(component.getBorderColorClass()).toBe('border-l-brand-primary');
      expect(component.getTitleHoverClass()).toBe('group-hover:text-brand-primary');
    });

    it('cae en los estilos neutros si el tipo no está definido', async () => {
      await montarCon({ tipo: undefined });

      expect(component.getBorderColorClass()).toBe('border-l-border-default');
      expect(component.getDiscountBadgeClass()).toBe('text-gray-700 border-gray-400');
      expect(component.getFooterClass()).toContain('text-text-secondary');
    });
  });

  describe('imagen', () => {
    it('usa la imagen del paquete base', async () => {
      await montarCon({ paqueteBase: { imagen_url: '/imagenes/paquete.jpg' } });

      expect(component.obtenerImagenUrl()).toBe('/imagenes/paquete.jpg');
    });

    it('cae al placeholder cuando el paquete base no tiene imagen', async () => {
      await montarCon({ paqueteBase: {} });

      expect(component.obtenerImagenUrl()).toBe('/assets/images/placeholder-product.png');
    });

    it('cae al placeholder cuando no hay paquete base', async () => {
      await montar(enHoras(51));

      expect(component.obtenerImagenUrl()).toBe('/assets/images/placeholder-product.png');
    });
  });

  describe('click en la card', () => {
    it('emite el id del paquete', async () => {
      await montar(enHoras(51));
      const emitido: number[] = [];
      component.cardClick.subscribe((id) => emitido.push(id));

      component.onCardClick();

      expect(emitido).toEqual([1]);
    });

    it('no emite nada si el paquete no tiene id', async () => {
      await montarCon({ id_paquete_publicado: undefined });
      const emitido: number[] = [];
      component.cardClick.subscribe((id) => emitido.push(id));

      component.onCardClick();

      expect(emitido).toEqual([]);
    });
  });
});
