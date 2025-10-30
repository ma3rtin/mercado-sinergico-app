import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Carrusel } from './carrusel';

describe('Carrusel', () => {
  let component: Carrusel;
  let fixture: ComponentFixture<Carrusel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Carrusel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Carrusel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
