import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Carrusel } from './carrusel';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { getPaqueteSlugUrl } from '@app/shared/utils/obfuscator';
import { NgIconsModule } from '@ng-icons/core';

describe('Carrusel', () => {
  let fixture: ComponentFixture<Carrusel>;
  let component: Carrusel;
  let router: Router;

  const paquete = (id: number): PaquetePublicado =>
    ({
      id_paquete_publicado: id,
      paqueteBase: { nombre: `Paquete ${id}` },
    }) as PaquetePublicado;

  const crear = async (cantidad: number) => {
    await TestBed.configureTestingModule({
      imports: [Carrusel, NgIconsModule.withIcons({})],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Carrusel);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentRef.setInput(
      'items',
      Array.from({ length: cantidad }, (_, i) => paquete(i + 1))
    );
    fixture.detectChanges();
  };

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  const paso = () => 320 + 16;

  const flecha = (label: string): HTMLButtonElement =>
    fixture.nativeElement.querySelector(`button[aria-label="${label}"]`);
  const flechaIzquierda = () => flecha('Anterior');
  const flechaDerecha = () => flecha('Siguiente');

  describe('maxScroll', () => {
    it('calcula el desplazamiento máximo según la cantidad de cards', async () => {
      await crear(6);

      expect(component.maxScroll).toBe(-(6 - 3) * paso());
    });

    it('se recalcula cuando cambian los items', async () => {
      await crear(6);

      fixture.componentRef.setInput('items', [paquete(1), paquete(2), paquete(3), paquete(4)]);
      fixture.detectChanges();

      expect(component.maxScroll).toBe(-(4 - 3) * paso());
    });
  });

  describe('scroll', () => {
    it('no debería scrollear a la derecha si entran todas las cards', async () => {
      await crear(2);

      component.scrollRight();

      expect(component.translateX).toBe(0);
    });

    it('avanza de a una card hacia la derecha', async () => {
      await crear(6);

      component.scrollRight();

      expect(component.translateX).toBe(-paso());
    });

    it('no debería pasarse del máximo por más que se siga scrolleando', async () => {
      await crear(5);

      for (let i = 0; i < 10; i++) component.scrollRight();

      expect(component.translateX).toBe(component.maxScroll);
    });

    it('no debería scrollear a la izquierda estando en el inicio', async () => {
      await crear(6);

      component.scrollLeft();

      expect(component.translateX).toBe(0);
    });

    it('vuelve hacia atrás de a una card', async () => {
      await crear(6);
      component.scrollRight();
      component.scrollRight();

      component.scrollLeft();

      expect(component.translateX).toBe(-paso());
    });

    it('no debería pasarse de 0 al volver hacia atrás', async () => {
      await crear(6);
      component.scrollRight();

      for (let i = 0; i < 10; i++) component.scrollLeft();

      expect(component.translateX).toBe(0);
    });

    it('actualiza el índice actual al scrollear', async () => {
      await crear(6);
      expect(component.currentIndex).toBe(0);

      component.scrollRight();
      expect(component.currentIndex).toBe(1);

      component.scrollRight();
      expect(component.currentIndex).toBe(2);

      component.scrollLeft();
      expect(component.currentIndex).toBe(1);
    });
  });

  describe('render', () => {
    it('aplica el translateX al contenedor al tocar la flecha', async () => {
      await crear(6);

      flechaDerecha().click();
      fixture.detectChanges();

      const track = fixture.nativeElement.querySelector('[style*="translateX"]');
      expect(track.style.transform).toBe(`translateX(${-paso()}px)`);
    });

    it('deshabilita la flecha izquierda al inicio y la derecha en el final', async () => {
      await crear(5);

      expect(flechaIzquierda().disabled).toBe(true);
      expect(flechaDerecha().disabled).toBe(false);

      flechaDerecha().click();
      fixture.detectChanges();
      flechaDerecha().click();
      fixture.detectChanges();

      expect(flechaIzquierda().disabled).toBe(false);
      expect(flechaDerecha().disabled).toBe(true);
    });

  });

  describe('click en una card', () => {
    it('emite el id y navega al detalle del paquete', async () => {
      await crear(3);
      const emitido: number[] = [];
      component.paqueteSelected.subscribe((id) => emitido.push(id));

      const item = paquete(2);
      component.onPaqueteClick(item);

      expect(emitido).toEqual([2]);
      expect(router.navigate).toHaveBeenCalledWith([
        '/paquete',
        getPaqueteSlugUrl(item),
        'productos',
      ]);
    });

    it('no hace nada si el paquete no tiene id', async () => {
      await crear(3);
      const emitido: number[] = [];
      component.paqueteSelected.subscribe((id) => emitido.push(id));

      component.onPaqueteClick({} as PaquetePublicado);

      expect(emitido).toEqual([]);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
