import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgIconsModule } from '@ng-icons/core';
import { ButtonComponent } from './buttonComponent';

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<ButtonComponent>;
  let component: ButtonComponent;

  const montar = async (inputs: Record<string, unknown> = {}) => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent, NgIconsModule.withIcons({})],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    Object.entries(inputs).forEach(([k, v]) => fixture.componentRef.setInput(k, v));
    fixture.detectChanges();
  };

  const boton = (): HTMLButtonElement => fixture.nativeElement.querySelector('button');
  const emisiones = () => {
    const vistas: number[] = [];
    component.buttonClick.subscribe(() => vistas.push(1));
    return vistas;
  };

  afterEach(() => fixture?.destroy());

  describe('click', () => {
    it('emite buttonClick al tocarlo', async () => {
      await montar({ label: 'Guardar' });
      const vistas = emisiones();

      boton().click();

      expect(vistas.length).toBe(1);
    });

    it('no emite si está deshabilitado', async () => {
      await montar({ label: 'Guardar', disabled: true });
      const vistas = emisiones();

      component.onButtonClick();

      expect(vistas.length).toBe(0);
    });

    it('no emite si está cargando', async () => {
      await montar({ label: 'Guardar', loading: true });
      const vistas = emisiones();

      component.onButtonClick();

      expect(vistas.length).toBe(0);
    });
  });

  describe('estado del botón', () => {
    it('deshabilita el botón nativo cuando disabled es true', async () => {
      await montar({ label: 'Guardar', disabled: true });

      expect(boton().disabled).toBe(true);
    });

    it('también lo deshabilita mientras carga', async () => {
      await montar({ label: 'Guardar', loading: true });

      expect(boton().disabled).toBe(true);
      expect(boton().getAttribute('aria-busy')).toBe('true');
    });

    it('respeta el type recibido', async () => {
      await montar({ label: 'Enviar', type: 'submit' });

      expect(boton().type).toBe('submit');
    });
  });

  describe('contenido', () => {
    it('muestra el label', async () => {
      await montar({ label: 'Intentar de nuevo' });

      expect(boton().textContent).toContain('Intentar de nuevo');
    });

    it('esconde el label mientras carga', async () => {
      await montar({ label: 'Guardar', loading: true });

      expect(boton().textContent).not.toContain('Guardar');
      expect(boton().querySelector('.animate-spin')).toBeTruthy();
    });

    it('no muestra spinner cuando no está cargando', async () => {
      await montar({ label: 'Guardar' });

      expect(boton().querySelector('.animate-spin')).toBeFalsy();
    });
  });

  describe('badge', () => {
    it('no lo muestra si no se pasa ninguno', async () => {
      await montar({ label: 'Notificaciones' });

      expect(component.shouldShowBadge()).toBe(false);
    });

    it('muestra el número recibido', async () => {
      await montar({ label: 'Notificaciones', badge: 5 });

      expect(component.shouldShowBadge()).toBe(true);
      expect(boton().textContent).toContain('5');
    });

    it('recorta a 99+ cuando se pasa de 99', async () => {
      await montar({ label: 'Notificaciones', badge: 150 });

      expect(boton().textContent).toContain('99+');
    });

    it('muestra el badge aunque sea 0', async () => {
      await montar({ label: 'Notificaciones', badge: 0 });

      expect(component.shouldShowBadge()).toBe(true);
    });
  });

  describe('accesibilidad', () => {
    it('usa el ariaLabel explícito si se pasa', async () => {
      await montar({ label: 'X', ariaLabel: 'Cerrar el modal' });

      expect(component.getAriaLabel()).toBe('Cerrar el modal');
      expect(boton().getAttribute('aria-label')).toBe('Cerrar el modal');
    });

    it('cae al label cuando no hay ariaLabel', async () => {
      await montar({ label: 'Guardar' });

      expect(component.getAriaLabel()).toBe('Guardar');
    });

    it('usa un texto por defecto si no hay ni label ni ariaLabel', async () => {
      await montar({});

      expect(component.getAriaLabel()).toBe('Button');
    });

    it('refleja el estado seleccionado en aria-pressed', async () => {
      await montar({ label: 'Filtro', selected: true });

      expect(boton().getAttribute('aria-pressed')).toBe('true');
    });
  });

});
