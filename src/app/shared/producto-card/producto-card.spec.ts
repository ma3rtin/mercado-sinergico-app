import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { vi } from 'vitest';
import { ProductoCard } from './producto-card';
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { getProductSlugUrl } from '@app/shared/utils/obfuscator';

describe('ProductoCard', () => {
  let fixture: ComponentFixture<ProductoCard>;
  let component: ProductoCard;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const producto: Producto = {
    id_producto: 1,
    nombre: 'Termo Stanley',
    descripcion: '',
    precio: 1000,
    marca_id: 1,
    categoria_id: 1,
    tipo: 'SINERGICO' as Producto['tipo'],
    imagenes: [],
  };

  const montar = async (extra: Partial<Producto>) => {
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ProductoCard, NgIconsModule.withIcons({})],
      providers: [{ provide: Router, useValue: mockRouter }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductoCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('producto', { ...producto, ...extra });
    fixture.componentRef.setInput('contexto', 'productos');
    fixture.componentRef.setInput('navegacion', 'detalle-seleccion');
    fixture.detectChanges();
  };

  afterEach(() => fixture?.destroy());

  it('un producto sin paquetes activos no navega ni emite cardClick', async () => {
    await montar({ cantPaquetes: 0 });
    const emitido: number[] = [];
    component.cardClick.subscribe((id) => emitido.push(id));

    component.onCardClick();

    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(emitido).toEqual([]);
  });

  it('un producto con paquetes navega una sola vez al detalle', async () => {
    await montar({ cantPaquetes: 3 });
    const emitido: number[] = [];
    component.cardClick.subscribe((id) => emitido.push(id));
    const slug = getProductSlugUrl({ ...producto, cantPaquetes: 3 });

    component.onCardClick();

    expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/producto', slug]);
    expect(emitido).toEqual([1]);
  });
});
