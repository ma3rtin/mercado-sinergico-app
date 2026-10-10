import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Perfil } from './perfil';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { LocalidadService } from '@app/services/localidad/localidad.service';
import { ToastService } from '@app/services/toast/toast.service';

describe('Perfil: localidades y domicilio', () => {
  async function crearPerfil(activa: boolean) {
    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [
        { provide: UsuarioService, useValue: { getPerfil: () => of({
          telefono: '1122334455', fecha_nac: '1990-01-01',
          direccion: { localidad: { id_localidad: 1, nombre: 'Anterior', activa },
            codigo_postal: 1708, calle: 'Rivadavia', numero: 100 },
        }) } },
        { provide: LocalidadService, useValue: { getAll: () => of([
          { id_localidad: 2, nombre: 'Morón', codigo_postal: null, activa: true },
        ]) } },
        { provide: ToastService, useValue: {} },
      ],
    }).overrideComponent(Perfil, { set: { template: '', imports: [] } }).compileComponents();
    const fixture = TestBed.createComponent(Perfil);
    fixture.detectChanges();
    return fixture;
  }

  it('cambiar la localidad no sobrescribe el CP del domicilio', async () => {
    const fixture = await crearPerfil(true);
    const component = fixture.componentInstance;
    component.form.get('localidad')!.setValue(2);
    expect(component.form.get('cp')!.value).toBe(1708);
    fixture.destroy();
  });

  it('pide elegir una localidad vigente y conserva los demás datos históricos', async () => {
    const fixture = await crearPerfil(false);
    const component = fixture.componentInstance;
    expect(component.form.get('localidad')!.value).toBeNull();
    expect(component.form.get('localidad')!.invalid).toBe(true);
    expect(component.form.get('calle')!.value).toBe('Rivadavia');
    expect(component.form.get('cp')!.value).toBe(1708);
    fixture.destroy();
  });
});
