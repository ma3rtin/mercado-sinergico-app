import { describe, it, expect } from 'vitest';
import { parseEnteroPositivo, parsePrecio } from './numeros';

describe('parseEnteroPositivo', () => {
  it.each([
    ['1', 1],
    ['45', 45],
  ])('acepta un entero positivo (%s)', (input, esperado) => {
    expect(parseEnteroPositivo(input)).toBe(esperado);
  });

  it.each(['abc', '1abc', '12abc', '1.5', '0', '-1', 'Infinity', '', undefined])(
    'rechaza %s',
    (input) => {
      expect(parseEnteroPositivo(input)).toBeNull();
    },
  );
});

describe('parsePrecio', () => {
  it.each([
    ['100', 100],
    ['-50', -50],
    ['0', 0],
    ['12.5', 12.5],
  ])('acepta un número finito (%s)', (input, esperado) => {
    expect(parsePrecio(input)).toBe(esperado);
  });

  it.each(['abc', '12abc', 'Infinity', '', undefined, null])('rechaza %s', (input) => {
    expect(parsePrecio(input)).toBeNull();
  });
});
