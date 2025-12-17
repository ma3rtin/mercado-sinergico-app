import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosDelPaquete } from './productos-del-paquete';

describe('ProductosDelPaquete', () => {
  let component: ProductosDelPaquete;
  let fixture: ComponentFixture<ProductosDelPaquete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosDelPaquete]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosDelPaquete);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
