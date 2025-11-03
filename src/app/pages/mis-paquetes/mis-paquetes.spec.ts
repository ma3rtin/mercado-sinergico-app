import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisPaquetes } from './mis-paquetes';

describe('MisPaquetes', () => {
  let component: MisPaquetes;
  let fixture: ComponentFixture<MisPaquetes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisPaquetes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisPaquetes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
