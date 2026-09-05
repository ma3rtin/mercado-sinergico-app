import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarraStock, calcularPorcentajeStock } from './barra-stock';

describe('calcularPorcentajeStock', () => {
  it('devuelve 0 si el total es 0, null o undefined', () => {
    expect(calcularPorcentajeStock(0, 5)).toBe(0);
    expect(calcularPorcentajeStock(null, 5)).toBe(0);
    expect(calcularPorcentajeStock(undefined, 5)).toBe(0);
  });

  it('trata consumido null/undefined como 0', () => {
    expect(calcularPorcentajeStock(10, null)).toBe(0);
    expect(calcularPorcentajeStock(10, undefined)).toBe(0);
  });

  it('calcula el porcentaje redondeado', () => {
    expect(calcularPorcentajeStock(8, 2)).toBe(25);
    expect(calcularPorcentajeStock(3, 2)).toBe(67);
  });

  it('clampea a 100 cuando consumido supera el total', () => {
    expect(calcularPorcentajeStock(5, 8)).toBe(100);
  });

  it('clampea a 0 cuando consumido es negativo', () => {
    expect(calcularPorcentajeStock(10, -2)).toBe(0);
  });
});

@Component({
  standalone: true,
  imports: [BarraStock],
  template: `
    <app-barra-stock
      [total]="total"
      [consumido]="consumido"
      [modo]="modo"
      [altura]="altura"
      [anchoFijo]="anchoFijo"
      [colorScheme]="colorScheme"
      [mostrarPorcentaje]="mostrarPorcentaje">
      <span class="proyectado">unidades de prueba</span>
    </app-barra-stock>
  `,
})
class HostComponent {
  total: number | null | undefined = 10;
  consumido: number | null | undefined = 5;
  modo: 'reservado' | 'disponible' = 'reservado';
  altura: 'sm' | 'md' = 'sm';
  anchoFijo: string | undefined = undefined;
  colorScheme: 'auto' | 'fijo' = 'auto';
  mostrarPorcentaje = true;
}

describe('BarraStock', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  const track = () =>
    fixture.nativeElement.querySelector('div[style*="100%"]') as HTMLElement;
  const fill = () => track()?.querySelector('div') as HTMLElement;

  it('proyecta el contenido de unidades y muestra el porcentaje', () => {
    expect(fixture.nativeElement.textContent).toContain('unidades de prueba');
    expect(fixture.nativeElement.textContent).toContain('50%');
  });

  it('no muestra el porcentaje cuando mostrarPorcentaje es false', () => {
    host.mostrarPorcentaje = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('%');
  });

  it('aplica el ancho del porcentaje al fill (modo reservado)', () => {
    host.total = 8;
    host.consumido = 2;
    fixture.detectChanges();

    expect(fill().style.width).toBe('25%');
  });

  it('aplica tramos de color auto en modo reservado', () => {
    const casos: Array<[number, number, string]> = [
      [100, 90, 'bg-error'],
      [100, 65, 'bg-warning'],
      [100, 40, 'bg-attention'],
      [100, 10, 'bg-success'],
    ];
    for (const [total, consumido, esperado] of casos) {
      host.total = total;
      host.consumido = consumido;
      fixture.detectChanges();
      expect(fill().classList.contains(esperado)).toBe(true);
    }
  });

  it('usa color fijo cuando colorScheme es fijo', () => {
    host.colorScheme = 'fijo';
    fixture.detectChanges();

    expect(fill().className).toContain('bg-brand-primary');
  });

  it('invierte el porcentaje y los tramos en modo disponible', () => {
    host.modo = 'disponible';
    host.total = 10;
    host.consumido = 9;
    fixture.detectChanges();

    expect(fill().style.width).toBe('10%');
    expect(fill().className).toContain('bg-error');
  });

  it('aplica anchoFijo al track en vez de w-full', () => {
    host.anchoFijo = '4rem';
    fixture.detectChanges();

    const track = fixture.nativeElement.querySelector(
      'div[style*="4rem"]'
    ) as HTMLElement;
    expect(track).toBeTruthy();
    expect(track.style.width).toBe('4rem');
  });

  it('usa altura md con track con borde', () => {
    host.altura = 'md';
    fixture.detectChanges();

    expect(fill().className).toContain('h-2');
    expect(fixture.nativeElement.querySelector('.shadow-inner')).toBeTruthy();
  });

  it('no devuelve NaN ni Infinity con datos vacíos', () => {
    host.total = null;
    host.consumido = null;
    fixture.detectChanges();

    expect(fill().style.width).toBe('0%');
  });
});