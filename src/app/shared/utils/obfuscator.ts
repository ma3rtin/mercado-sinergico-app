/**
 * Utilidades para ofuscar IDs numéricos y generar slugs amigables para SEO.
 */

const MAGIC_MULTIPLIER = 37;
const MAGIC_OFFSET = 1039;

/**
 * Convierte un texto en un slug amigable para SEO (ej: "Termo Stanley Classic" -> "termo-stanley-classic")
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Separa caracteres con tilde de sus letras base
    .replace(/[\u0300-\u036f]/g, '') // Elimina los acentos
    .replace(/\s+/g, '-') // Reemplaza espacios por guiones
    .replace(/[^\w\-]+/g, '') // Elimina caracteres especiales no alfanuméricos (excepto guión)
    .replace(/\-\-+/g, '-') // Evita múltiples guiones consecutivos
    .replace(/^-+/, '') // Elimina guiones al inicio
    .replace(/-+$/, ''); // Elimina guiones al final
}

/**
 * Ofusca un ID numérico convirtiéndolo en un string alfanumérico corto (base 36)
 */
export function encodeId(id: number): string {
  if (!id || isNaN(id)) return '';
  const val = (id + MAGIC_OFFSET) * MAGIC_MULTIPLIER;
  return val.toString(36);
}

/**
 * Decodifica un string alfanumérico corto (base 36) de vuelta a su ID numérico
 */
export function decodeId(encoded: string): number {
  if (!encoded || !/^[a-z0-9]+$/i.test(encoded)) return 0;
  const val = parseInt(encoded, 36);
  if (isNaN(val)) return 0;
  const decoded = Math.round(val / MAGIC_MULTIPLIER) - MAGIC_OFFSET;
  return decoded > 0 ? decoded : 0;
}

/**
 * Genera el slug con el ID ofuscado para un producto
 */
export function getProductSlugUrl(producto: { id_producto?: number; id?: number; nombre: string }): string {
  const id = producto.id_producto ?? producto.id;
  if (id === undefined || id === null) return '';
  const slug = slugify(producto.nombre || 'producto');
  return `${slug}-p${encodeId(id)}`;
}

/**
 * Genera el slug con el ID ofuscado para un paquete publicado
 */
export function getPaqueteSlugUrl(paquete: { id_paquete_publicado?: number; nombre?: string; paqueteBase?: { nombre: string } }): string {
  const id = paquete.id_paquete_publicado;
  if (id === undefined || id === null) return '';
  const nombre = paquete.nombre || paquete.paqueteBase?.nombre || 'paquete';
  const slug = slugify(nombre);
  return `${slug}-p${encodeId(id)}`;
}
