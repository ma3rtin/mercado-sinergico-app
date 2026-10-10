import { AbstractControl, ValidationErrors } from '@angular/forms';

export function mayorQueCero(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;

  const numero = Number(value);
  if (Number.isNaN(numero) || numero <= 0) {
    return { min: { min: 0 } };
  }

  return null;
}
