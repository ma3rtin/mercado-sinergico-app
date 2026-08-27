import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FiltrosComponent, ConfigFiltros, FiltrosAplicados } from './filtros';
import { NgIconsModule } from '@ng-icons/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('FiltrosComponent', () => {
  let component: FiltrosComponent;
  let fixture: ComponentFixture<FiltrosComponent>;
  let emittedFilters: FiltrosAplicados[];

  const defaultConfig: ConfigFiltros = {
    mostrarCategoria: true,
    mostrarMarca: true,
    obtenerCategorias: () => of([]),
    obtenerMarcas: () => of([]),
  };

  beforeEach(async () => {
    emittedFilters = [];

    await TestBed.configureTestingModule({
      imports: [
        FiltrosComponent,
        NgIconsModule.withIcons({}),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FiltrosComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', defaultConfig);
    fixture.detectChanges();

    component.filtrosAplicados.subscribe(f => emittedFilters.push(f));
  });

  afterEach(() => {
    vi.useRealTimers();
    fixture.destroy();
  });

  it('no emite filtrosAplicados al inicializar el componente', () => {
    expect(emittedFilters.length).toBe(0);
  });

  it('emite filtrosAplicados 300ms después de togglear una categoría', async () => {
    vi.useFakeTimers();
    component.toggleCategoria(1);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);
    expect(emittedFilters.length).toBe(1);
    expect(emittedFilters[0].categorias).toEqual([1]);
  });

  it('NO emite filtrosAplicados antes de los 300ms de debounce', async () => {
    vi.useFakeTimers();
    component.toggleCategoria(1);
    await vi.advanceTimersByTimeAsync(100);
    expect(emittedFilters.length).toBe(0);
  });

  it('colapsa múltiples toggles seguidos en una sola emisión', async () => {
    vi.useFakeTimers();
    component.toggleCategoria(1);
    component.toggleCategoria(2);
    component.toggleCategoria(3);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);
    expect(emittedFilters.length).toBe(1);
    expect(emittedFilters[0].categorias).toEqual([1, 2, 3]);
  });

  it('toggleCategoria es simétrico', async () => {
    vi.useFakeTimers();
    component.toggleCategoria(1);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);
    expect(emittedFilters[0].categorias).toEqual([1]);

    component.toggleCategoria(1);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);
    expect(emittedFilters.length).toBe(2);
    expect(emittedFilters[1].categorias).toEqual([]);
  });

  it('limpiarFiltros() resetea todos los signals a su estado por defecto y emite filtrosLimpiados', () => {
    component.toggleCategoria(1);
    component.cambiarPrecioMin(100);

    const limpiadoSpy = vi.fn();
    component.filtrosLimpiados.subscribe(limpiadoSpy);

    component.limpiarFiltros();

    expect(component.categoriasSeleccionadas()).toEqual([]);
    expect(component.marcasSeleccionadas()).toEqual([]);
    expect(component.zonasSeleccionadas()).toEqual([]);
    expect(component.precioMin()).toBeNull();
    expect(component.precioMax()).toBeNull();
    expect(component.ordenSeleccionado()).toBe('');
    expect(limpiadoSpy).toHaveBeenCalledTimes(1);
  });

  it('valoresIniciales puebla el estado sin emitir filtrosAplicados de forma espuria antes de que el usuario interactúe', async () => {
    vi.useFakeTimers();
    fixture.componentRef.setInput('valoresIniciales', { zonas: [1] });
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);

    expect(component.zonasSeleccionadas()).toEqual([1]);
    expect(emittedFilters.length).toBe(1);
    expect(emittedFilters[0].zonas).toEqual([1]);
  });

  it('rango de precio: cambiar min y max en el mismo ciclo de debounce emite un solo filtrosAplicados con ambos valores combinados', async () => {
    vi.useFakeTimers();
    component.cambiarPrecioMin(100);
    component.cambiarPrecioMax(500);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);

    expect(emittedFilters.length).toBe(1);
    expect(emittedFilters[0].rangoPrecio).toEqual({ min: 100, max: 500 });
  });

  it('tieneRangoPrecio() es true solo si min o max no son null', () => {
    expect(component.tieneRangoPrecio()).toBe(false);

    component.cambiarPrecioMin(100);
    expect(component.tieneRangoPrecio()).toBe(true);

    component.cambiarPrecioMin(null);
    expect(component.tieneRangoPrecio()).toBe(false);

    component.cambiarPrecioMax(500);
    expect(component.tieneRangoPrecio()).toBe(true);

    component.cambiarPrecioMax(null);
    expect(component.tieneRangoPrecio()).toBe(false);
  });

  describe('puedeReiniciar', () => {
    it('es false cuando no hay ningún filtro tocado', () => {
      expect(component.puedeReiniciar()).toBe(false);
    });

    it('es false cuando lo único tildado es la zona por defecto del perfil', () => {
      fixture.componentRef.setInput('valoresIniciales', { zonas: [7] });
      fixture.detectChanges();
      expect(component.tieneFiltrosActivos()).toBe(true);
      expect(component.puedeReiniciar()).toBe(false);
    });

    it('es true al agregar un filtro sobre la zona por defecto', () => {
      fixture.componentRef.setInput('valoresIniciales', { zonas: [7] });
      fixture.detectChanges();
      component.toggleCategoria(1);
      fixture.detectChanges();
      expect(component.puedeReiniciar()).toBe(true);
    });

    it('es true al destildar la zona por defecto', () => {
      fixture.componentRef.setInput('valoresIniciales', { zonas: [7] });
      fixture.detectChanges();
      component.toggleZona(7);
      fixture.detectChanges();
      expect(component.puedeReiniciar()).toBe(true);
    });

    it('vuelve a false después de limpiarFiltros()', () => {
      fixture.componentRef.setInput('valoresIniciales', { zonas: [7] });
      fixture.detectChanges();
      component.toggleCategoria(1);
      fixture.detectChanges();
      component.limpiarFiltros();
      fixture.detectChanges();
      expect(component.puedeReiniciar()).toBe(false);
      expect(component.zonasSeleccionadas()).toEqual([7]);
    });

    it('ignora el orden de selección al comparar contra el estado inicial', () => {
      fixture.componentRef.setInput('valoresIniciales', { zonas: [7, 9] });
      fixture.detectChanges();
      component.toggleZona(7);
      component.toggleZona(7);
      fixture.detectChanges();
      expect(component.zonasSeleccionadas()).toEqual([9, 7]);
      expect(component.puedeReiniciar()).toBe(false);
    });
  });
});
