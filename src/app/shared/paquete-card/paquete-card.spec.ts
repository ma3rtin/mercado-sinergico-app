import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { PaqueteCard } from './paquete-card';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

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
});
