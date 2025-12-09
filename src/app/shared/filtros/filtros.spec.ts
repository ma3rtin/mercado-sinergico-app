import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Filtros } from './filtros';

describe('Filtros', () => {
  let component: Filtros;
  let fixture: ComponentFixture<Filtros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Filtros]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Filtros);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
