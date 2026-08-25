import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { LoadingOverlay } from './loading-overlay';

describe('LoadingOverlay', () => {
  let component: LoadingOverlay;
  let fixture: ComponentFixture<LoadingOverlay>;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [LoadingOverlay]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LoadingOverlay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('no se muestra por defecto', () => {
    const overlay = fixture.nativeElement.querySelector('.loading-overlay');
    expect(overlay).toBeNull();
  });

  it('se muestra con el título y la primera etapa al activarse', () => {
    fixture.componentRef.setInput(
      'mensajes',
      ['Subiendo imágenes...', 'Creando producto...', 'Generando variantes...']
    );
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.loading-overlay');
    expect(overlay).not.toBeNull();

    const titulo = fixture.nativeElement.querySelector('h3');
    expect(titulo.textContent.trim()).toBe('Procesando...');

    const mensaje = fixture.nativeElement.querySelector('p').textContent.trim();
    expect(mensaje).toBe('Subiendo imágenes...');
  });

  it('sin mensajes explícitos muestra solo el título como fallback', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.loading-overlay');
    expect(overlay).not.toBeNull();

    const titulo = fixture.nativeElement.querySelector('h3');
    expect(titulo.textContent.trim()).toBe('Procesando...');

    expect(fixture.nativeElement.querySelector('p')).toBeNull();
  });

  it('avanza hasta ~90% al cumplirse la duración estimada', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    vi.advanceTimersByTime(16000);
    fixture.detectChanges();

    const fill = fixture.nativeElement.querySelector('.bg-brand-cta') as HTMLElement;
    expect(fill.style.width).toBe('90%');
  });

  it('cambia el texto de etapa conforme avanza el progreso', () => {
    fixture.componentRef.setInput(
      'mensajes',
      ['Subiendo imágenes...', 'Creando producto...', 'Generando variantes...']
    );
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    vi.advanceTimersByTime(16000);
    fixture.detectChanges();

    const mensaje = fixture.nativeElement.querySelector('p').textContent.trim();
    expect(mensaje).toBe('Generando variantes...');
  });

  it('salta a 100% y se oculta cuando termina', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.loading-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay.classList.contains('saliendo')).toBe(true);

    const fill = fixture.nativeElement.querySelector('.bg-brand-cta') as HTMLElement;
    expect(fill.style.width).toBe('100%');

    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.loading-overlay')).toBeNull();
  });
});
