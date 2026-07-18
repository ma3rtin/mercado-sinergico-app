import { describe, it, expect } from 'vitest';
import { slugify, encodeId, decodeId, getProductSlugUrl, getPaqueteSlugUrl } from './obfuscator';

describe('obfuscator utilities', () => {
  describe('slugify', () => {
    it('should convert standard string to slug', () => {
      expect(slugify('Termo Stanley Classic 1L')).toBe('termo-stanley-classic-1l');
    });

    it('should handle accents and tildes', () => {
      expect(slugify('Café Orgánico de la Montaña')).toBe('cafe-organico-de-la-montana');
    });

    it('should remove special characters', () => {
      expect(slugify('Producto Súper Especial! & % $ @ #')).toBe('producto-super-especial');
    });

    it('should collapse multiple dashes', () => {
      expect(slugify('hello---world')).toBe('hello-world');
    });

    it('should trim leading/trailing dashes', () => {
      expect(slugify('---test---')).toBe('test');
    });

    it('should return empty string for empty input', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('encodeId / decodeId', () => {
    it('should be bidirectionally consistent for different numbers', () => {
      const ids = [1, 15, 123, 9999, 123456];
      ids.forEach(id => {
        const encoded = encodeId(id);
        expect(typeof encoded).toBe('string');
        expect(encoded.length).toBeGreaterThan(0);
        expect(decodeId(encoded)).toBe(id);
      });
    });

    it('should return 0 when decoding invalid strings', () => {
      expect(decodeId('')).toBe(0);
      expect(decodeId('not-a-base36-string-!!!')).toBe(0);
    });

    it('should return empty string when encoding invalid inputs', () => {
      expect(encodeId(NaN)).toBe('');
      expect(encodeId(0)).toBe('');
    });
  });

  describe('getProductSlugUrl', () => {
    it('should build url with id_producto', () => {
      const product = { id_producto: 45, nombre: 'Smart TV 55" 4K' };
      const slugUrl = getProductSlugUrl(product);
      expect(slugUrl).toContain('smart-tv-55-4k-p');
      const parts = slugUrl.split('-p');
      const encodedId = parts[parts.length - 1];
      expect(decodeId(encodedId)).toBe(45);
    });

    it('should build url with fallback id', () => {
      const product = { id: 89, nombre: 'Auriculares Inalámbricos' };
      const slugUrl = getProductSlugUrl(product);
      expect(slugUrl).toContain('auriculares-inalambricos-p');
      const parts = slugUrl.split('-p');
      const encodedId = parts[parts.length - 1];
      expect(decodeId(encodedId)).toBe(89);
    });

    it('should return empty string if no ID is present', () => {
      const product = { nombre: 'Sin ID' };
      expect(getProductSlugUrl(product)).toBe('');
    });
  });

  describe('getPaqueteSlugUrl', () => {
    it('should build url with direct nombre', () => {
      const paquete = { id_paquete_publicado: 23, nombre: 'Paquete Asado Familiar' };
      const slugUrl = getPaqueteSlugUrl(paquete);
      expect(slugUrl).toContain('paquete-asado-familiar-p');
      const parts = slugUrl.split('-p');
      const encodedId = parts[parts.length - 1];
      expect(decodeId(encodedId)).toBe(23);
    });

    it('should build url with name from paqueteBase', () => {
      const paquete = { id_paquete_publicado: 77, paqueteBase: { nombre: 'Alimento Balanceado Premium' } };
      const slugUrl = getPaqueteSlugUrl(paquete);
      expect(slugUrl).toContain('alimento-balanceado-premium-p');
      const parts = slugUrl.split('-p');
      const encodedId = parts[parts.length - 1];
      expect(decodeId(encodedId)).toBe(77);
    });

    it('should return empty string if no ID is present', () => {
      const paquete = { nombre: 'Sin ID' };
      expect(getPaqueteSlugUrl(paquete)).toBe('');
    });
  });
});
