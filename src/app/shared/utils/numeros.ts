const ENTERO_POSITIVO = /^[1-9]\d*$/;

export function parseEnteroPositivo(value: unknown): number | null {
  if (typeof value !== 'string' || !ENTERO_POSITIVO.test(value)) return null;
  return parseInt(value, 10);
}

export function parsePrecio(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
