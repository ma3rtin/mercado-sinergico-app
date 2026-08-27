import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { EditarPaqueteBaseComponent } from './editar-paquete-base';
import { MarcaService } from '@app/services/producto/marca.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { PaqueteBaseService } from '@app/services/paquete/paquete-base.service';
import { ToastService } from '@app/services/toast/toast.service';
import { TipoPaquete } from '@app/models/Enums';
import { PaqueteBase } from '@app/models/PaquetesInterfaces/PaqueteBase';

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

const paquete: PaqueteBase = {
  id_paquete_base: 7,
  nombre: 'Paquete de prueba',
  descripcion: 'Descripción',
  imagen_url: 'https://example.test/img.webp',
  categoria_id: 1,
  marcaId: 2,
  tipo: TipoPaquete.SINERGICO,
};

describe('EditarPaqueteBaseComponent — carga inicial', () => {
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };
  let navigate: ReturnType<typeof vi.fn>;

  const montar = (baseService: Partial<PaqueteBaseService>, idRuta = '7') => {
    TestBed.configureTestingModule({
      imports: [EditarPaqueteBaseComponent, NgIconsModule.withIcons({})],
      providers: [
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: idRuta } } } },
        { provide: MarcaService, useValue: { getMarcas: () => of([]) } },
        { provide: CategoriaService, useValue: { getCategorias: () => of([]) } },
        { provide: ProductosService, useValue: { getProductos: () => of([]) } },
        { provide: PaqueteBaseService, useValue: baseService },
        { provide: ToastService, useValue: toast },
      ],
    });

    const fixture = TestBed.createComponent(EditarPaqueteBaseComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
    navigate = vi.fn();
  });

  it('carga el paquete y sus productos', () => {
    const component = montar({
      getPaquetes: () => of([paquete]),
      getProductosByPaqueteBase: () => of([]),
    } as Partial<PaqueteBaseService>);

    expect(component.nombre()).toBe('Paquete de prueba');
    expect(component.isLoading()).toBe(false);
  });

  it('no deja el spinner girando si el paquete no existe', () => {
    const component = montar({
      getPaquetes: () => of([]),
      getProductosByPaqueteBase: () => of([]),
    } as Partial<PaqueteBaseService>);

    expect(component.isLoading()).toBe(false);
    expect(toast.error).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/admin/administrar-paquetes']);
  });

  it('no deja el spinner girando si falla la carga de paquetes', () => {
    const component = montar({
      getPaquetes: () => throwError(() => new Error('500')),
      getProductosByPaqueteBase: () => of([]),
    } as Partial<PaqueteBaseService>);

    expect(component.isLoading()).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it('no deja el spinner girando si falla la carga de productos del paquete', () => {
    const component = montar({
      getPaquetes: () => of([paquete]),
      getProductosByPaqueteBase: () => throwError(() => new Error('500')),
    } as Partial<PaqueteBaseService>);

    expect(component.isLoading()).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });
});
