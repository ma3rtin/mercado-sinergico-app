import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaqueteBanner } from './paquete-banner';

describe('PaqueteBanner', () => {
  let component: PaqueteBanner;
  let fixture: ComponentFixture<PaqueteBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaqueteBanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaqueteBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
