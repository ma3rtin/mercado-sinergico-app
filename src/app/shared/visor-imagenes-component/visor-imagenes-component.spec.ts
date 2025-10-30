import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisorImagenesComponent } from './visor-imagenes-component';

describe('VisorImagenesComponent', () => {
  let component: VisorImagenesComponent;
  let fixture: ComponentFixture<VisorImagenesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisorImagenesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisorImagenesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
