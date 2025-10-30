import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlechaCarrusel } from './flecha-carrusel';

describe('FlechaCarrusel', () => {
  let component: FlechaCarrusel;
  let fixture: ComponentFixture<FlechaCarrusel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlechaCarrusel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlechaCarrusel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
