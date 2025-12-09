import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaqueteUsuarioCard } from './paquete-usuario-card';

describe('PaqueteUsuarioCard', () => {
  let component: PaqueteUsuarioCard;
  let fixture: ComponentFixture<PaqueteUsuarioCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaqueteUsuarioCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaqueteUsuarioCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
