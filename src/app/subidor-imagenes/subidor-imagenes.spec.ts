import { TestBed } from '@angular/core/testing';
import { NgIconsModule } from '@ng-icons/core';
import { SubidorImagenes } from './subidor-imagenes';
import { ToastService } from '@app/services/toast/toast.service';

describe('SubidorImagenes — validación de archivos', () => {
  let toast: { error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };

  const montar = (maxSlots = 16) => {
    const fixture = TestBed.createComponent(SubidorImagenes);
    fixture.componentRef.setInput('maxSlots', maxSlots);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  const seleccionar = (comp: SubidorImagenes, files: File[]) => {
    comp.onMultipleFilesSelected({
      target: { files, value: '' },
    } as unknown as Event);
  };

  const archivo = (nombre: string, tipo: string, bytes = 10) =>
    new File([new Uint8Array(bytes)], nombre, { type: tipo });

  beforeEach(async () => {
    toast = { error: vi.fn(), warning: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [SubidorImagenes, NgIconsModule.withIcons({})],
      providers: [{ provide: ToastService, useValue: toast }],
    }).compileComponents();
  });

  it('acepta HEIC aunque el navegador mande un mimetype genérico', () => {
    const comp = montar();
    seleccionar(comp, [archivo('foto.HEIC', 'application/octet-stream')]);

    expect(comp._slots()[1].file?.name).toBe('foto.HEIC');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('avisa cuántos archivos se omitieron en vez de descartarlos en silencio', () => {
    const comp = montar();
    seleccionar(comp, [
      archivo('ok.jpg', 'image/jpeg'),
      archivo('manual.pdf', 'application/pdf'),
      archivo('enorme.png', 'image/png', 6 * 1024 * 1024),
    ]);

    expect(comp._slots()[1].file?.name).toBe('ok.jpg');
    expect(comp._slots()[2].file).toBeNull();
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('omitieron 2 archivos'));
  });

  it('avisa cuando hay más imágenes válidas que espacios libres', () => {
    const comp = montar(3);
    seleccionar(comp, [
      archivo('a.jpg', 'image/jpeg'),
      archivo('b.jpg', 'image/jpeg'),
      archivo('c.jpg', 'image/jpeg'),
    ]);

    expect(comp.getCantidadImagenesCargadas()).toBe(0);
    expect(comp._slots()[1].file?.name).toBe('a.jpg');
    expect(comp._slots()[2].file?.name).toBe('b.jpg');
    expect(comp._slots()[3].file).toBeNull();
    expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('se ignoraron 1'));
  });
});
