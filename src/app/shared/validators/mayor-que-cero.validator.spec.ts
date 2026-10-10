import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { mayorQueCero } from './mayor-que-cero.validator';

describe('mayorQueCero', () => {
  it('devuelve null cuando el valor es null', () => {
    expect(mayorQueCero(new FormControl(null))).toBeNull();
  });

  it('devuelve null cuando el valor es undefined', () => {
    expect(mayorQueCero(new FormControl(undefined))).toBeNull();
  });

  it('devuelve null cuando el valor es string vacío', () => {
    expect(mayorQueCero(new FormControl(''))).toBeNull();
  });

  it('acepta valores decimales positivos', () => {
    expect(mayorQueCero(new FormControl(0.5))).toBeNull();
    expect(mayorQueCero(new FormControl(0.1))).toBeNull();
    expect(mayorQueCero(new FormControl(0.001))).toBeNull();
    expect(mayorQueCero(new FormControl(1.25))).toBeNull();
    expect(mayorQueCero(new FormControl('3'))).toBeNull();
  });

  it('acepta strings decimales', () => {
    expect(mayorQueCero(new FormControl('0.5'))).toBeNull();
    expect(mayorQueCero(new FormControl('1.25'))).toBeNull();
  });

  it('acepta strings con espacios alrededor', () => {
    expect(mayorQueCero(new FormControl(' 0.5 '))).toBeNull();
  });

  it('acepta decimales muy pequeños', () => {
    expect(mayorQueCero(new FormControl(0.0001))).toBeNull();
    expect(mayorQueCero(new FormControl('0.0001'))).toBeNull();
  });

  it('rechaza el cero exacto', () => {
    expect(mayorQueCero(new FormControl(0))).toEqual({ min: { min: 0 } });
    expect(mayorQueCero(new FormControl('0'))).toEqual({ min: { min: 0 } });
  });

  it('rechaza el cero negativo', () => {
    expect(mayorQueCero(new FormControl(-0))).toEqual({ min: { min: 0 } });
    expect(mayorQueCero(new FormControl(-0.0))).toEqual({ min: { min: 0 } });
  });

  it('rechaza valores negativos', () => {
    expect(mayorQueCero(new FormControl(-1))).toEqual({ min: { min: 0 } });
    expect(mayorQueCero(new FormControl(-0.5))).toEqual({ min: { min: 0 } });
    expect(mayorQueCero(new FormControl('-0.5'))).toEqual({ min: { min: 0 } });
  });

  it('rechaza strings de solo espacios', () => {
    expect(mayorQueCero(new FormControl(' '))).toEqual({ min: { min: 0 } });
    expect(mayorQueCero(new FormControl('   '))).toEqual({ min: { min: 0 } });
  });

  it('rechaza valores no numéricos', () => {
    expect(mayorQueCero(new FormControl('abc'))).toEqual({ min: { min: 0 } });
    expect(mayorQueCero(new FormControl('0,5'))).toEqual({ min: { min: 0 } });
  });
});
