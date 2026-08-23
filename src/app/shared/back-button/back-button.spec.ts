import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { vi } from 'vitest';
import { BackButtonComponent } from './back-button';

describe('BackButtonComponent', () => {
  let component: BackButtonComponent;
  let fixture: ComponentFixture<BackButtonComponent>;
  let mockLocation: { back: ReturnType<typeof vi.fn> };
  let mockRouter: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockLocation = { back: vi.fn() };
    mockRouter = { navigateByUrl: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [BackButtonComponent, NgIconsModule.withIcons({})],
      providers: [
        { provide: Location, useValue: mockLocation },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BackButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería usar Location.back() cuando no se provee una ruta', () => {
    component.goBack();

    expect(mockLocation.back).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('debería navegar con Router.navigateByUrl cuando se provee una ruta', () => {
    fixture.componentRef.setInput('route', '/admin/perfil');

    component.goBack();

    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/admin/perfil');
    expect(mockLocation.back).not.toHaveBeenCalled();
  });

  it('debería emitir backClick y no navegar cuando customHandler está activo', () => {
    fixture.componentRef.setInput('customHandler', true);
    fixture.componentRef.setInput('route', '/admin/perfil');
    const emitSpy = vi.fn();
    component.backClick.subscribe(emitSpy);

    component.goBack();

    expect(emitSpy).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    expect(mockLocation.back).not.toHaveBeenCalled();
  });

});
