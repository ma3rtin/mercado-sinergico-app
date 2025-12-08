import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Icono } from './icono';

describe('Icono', () => {
  let component: Icono;
  let fixture: ComponentFixture<Icono>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Icono]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Icono);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
