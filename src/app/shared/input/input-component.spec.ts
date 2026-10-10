import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { InputComponent } from './input-component';
import { mayorQueCero } from '@app/shared/validators/mayor-que-cero.validator';

@Component({
  selector: 'app-input-host',
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent],
  template: `
    <form [formGroup]="form">
      <app-input
        formControlName="campo"
        [typeValue]="type"
        [labelValue]="label"
        [stepValue]="step"
      />
    </form>
  `,
})
class InputHostComponent {
  form = new FormGroup({ campo: new FormControl<any>(null) });
  type = 'text';
  label = 'Campo';
  step?: number | string;
}

describe('InputComponent', () => {
  let host: InputHostComponent;
  let fixture: ComponentFixture<InputHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputHostComponent);
    host = fixture.componentInstance;
  });

  function getInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }

  function getControl(): FormControl {
    return host.form.get('campo') as FormControl;
  }

  it('should create', () => {
    fixture.detectChanges();
    expect(host).toBeTruthy();
  });

  describe('atributo step', () => {
    it('renderiza step="0.01" cuando se pasa stepValue', () => {
      host.type = 'number';
      host.step = 0.01;
      fixture.detectChanges();
      expect(getInput().getAttribute('step')).toBe('0.01');
    });

    it('no renderiza el atributo step cuando no se pasa stepValue', () => {
      host.type = 'number';
      host.step = undefined;
      fixture.detectChanges();
      expect(getInput().hasAttribute('step')).toBe(false);
    });
  });

  describe('mensaje de error min', () => {
    it('muestra "El valor debe ser mayor a 0" cuando el mínimo es 0', () => {
      host.type = 'number';
      const control = getControl();
      control.setValidators([mayorQueCero]);
      control.setValue(0);
      control.updateValueAndValidity();
      fixture.detectChanges();

      getInput().dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.text-error').textContent)
        .toContain('El valor debe ser mayor a 0');
    });

    it('muestra "El valor debe ser mayor o igual a 5" para un mínimo distinto de 0', () => {
      const control = getControl();
      control.setValidators([Validators.min(5)]);
      control.setValue(2);
      control.updateValueAndValidity();
      fixture.detectChanges();

      getInput().dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.text-error').textContent)
        .toContain('El valor debe ser mayor o igual a 5');
    });
  });

  describe('valores decimales en type=number', () => {
    it('no trunca un decimal cargado en el input', async () => {
      host.type = 'number';
      fixture.detectChanges();

      const input = getInput();
      input.value = '0.1';
      input.dispatchEvent(new Event('input'));

      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(Number(getControl().value)).toBe(0.1);
      expect(getControl().value).not.toBe(0);
    });
  });
});
