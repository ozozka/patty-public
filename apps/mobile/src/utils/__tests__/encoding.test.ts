import { describe, expect, it } from '@jest/globals';

import { Encoding } from '../encoding';

describe('Encoding', () => {
  describe('atob', () => {
    it('decodes standard Base64 strings', () => {
      expect(Encoding.atob('SGVsbG8=')).toBe('Hello');
      expect(Encoding.atob('V29ybGQ=')).toBe('World');
    });

    it('handles empty strings', () => {
      expect(Encoding.atob('')).toBe('');
    });

    it('handles Base64Url variants (- and _)', () => {
      expect(() => Encoding.atob('8J-OiQ')).not.toThrow();
      expect(() => Encoding.atob('w5_Dvg')).not.toThrow();
      expect(Encoding.atob('YWI_')).toBe('ab?');
    });
  });

  describe('decodeJwtPayload', () => {
    it('decodes valid JWT payload', () => {
      const payload = { sub: 'user-1', exp: 1234567890 };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
        'base64url',
      );
      const token = `header.${encodedPayload}.signature`;

      const result = Encoding.decodeJwtPayload(token);
      expect(result).toEqual(payload);
    });

    it('returns null for malformed tokens with wrong part count', () => {
      expect(Encoding.decodeJwtPayload('only-one-part')).toBeNull();
      expect(Encoding.decodeJwtPayload('two.parts')).toBeNull();
    });

    it('returns null for invalid JSON in payload', () => {
      const token = 'header.not-valid-json.signature';
      expect(Encoding.decodeJwtPayload(token)).toBeNull();
    });

    it('returns null for invalid Base64 in payload', () => {
      const token = 'header.!!!invalid-base64!!!.signature';
      expect(Encoding.decodeJwtPayload(token)).toBeNull();
    });
  });
});
