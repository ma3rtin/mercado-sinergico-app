import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarVariantes } from './gestionar-variantes';

describe('GestionarVariantes', () => {
  let component: GestionarVariantes;
  let fixture: ComponentFixture<GestionarVariantes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarVariantes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarVariantes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
