import { TestBed } from '@angular/core/testing';
import { SelectCategoriaMarca } from './select-categoria-marca';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { NgIconsModule } from '@ng-icons/core';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('SelectCategoriaMarca — lógica de hover/tooltip', () => {
  let component: SelectCategoriaMarca;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectCategoriaMarca, NgIconsModule.withIcons({})],
    }).compileComponents();

    const fixture = TestBed.createComponent(SelectCategoriaMarca);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', []);
    fixture.componentRef.setInput('label', 'Test');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('onButtonEnter setea hoveredOption y hoveredOrigin, y limpia hoverTimer pendiente', () => {
    const mockOption = { id: 1, nombre: 'Opción 1' } as any;
    const mockOrigin = { element: {} } as CdkOverlayOrigin;

    component.onButtonEnter(mockOption, mockOrigin);

    expect(component.hoveredOption()).toBe(mockOption);
    expect(component.hoveredOrigin()).toBe(mockOrigin);
  });

  it('onButtonLeave resetea hoveredOption y hoveredOrigin después del delay de 100ms', () => {
    vi.useFakeTimers();

    const mockOption = { id: 1, nombre: 'Opción 1' } as any;
    const mockOrigin = { element: {} } as CdkOverlayOrigin;

    component.onButtonEnter(mockOption, mockOrigin);
    expect(component.hoveredOption()).toBe(mockOption);

    component.onButtonLeave();

    vi.advanceTimersByTime(50);
    expect(component.hoveredOption()).toBe(mockOption);

    vi.advanceTimersByTime(100);
    expect(component.hoveredOption()).toBeNull();
    expect(component.hoveredOrigin()).toBeNull();
  });

  it('onOverlayEnter cancela el cierre pendiente de onButtonLeave', () => {
    vi.useFakeTimers();

    const mockOption = { id: 1, nombre: 'Opción 1' } as any;
    const mockOrigin = { element: {} } as CdkOverlayOrigin;

    component.onButtonEnter(mockOption, mockOrigin);
    component.onButtonLeave();

    vi.advanceTimersByTime(50);
    component.onOverlayEnter();

    vi.advanceTimersByTime(200);
    expect(component.hoveredOption()).toBe(mockOption);
    expect(component.hoveredOrigin()).toBe(mockOrigin);
  });

  it('ngOnDestroy limpia el hoverTimer si está activo', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    (component as any).hoverTimer = setTimeout(() => {}, 10000);

    component.ngOnDestroy();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
