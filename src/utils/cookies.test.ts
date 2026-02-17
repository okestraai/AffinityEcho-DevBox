import { CookieUtil } from './cookies';

// Helper to clear all cookies between tests
function clearAllCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
}

describe('CookieUtil', () => {
  beforeEach(() => {
    clearAllCookies();
  });

  describe('set() and get()', () => {
    it('sets and retrieves a cookie value', () => {
      CookieUtil.set('test_key', 'test_value', 7, false);
      expect(CookieUtil.get('test_key')).toBe('test_value');
    });

    it('returns null for a non-existent cookie', () => {
      expect(CookieUtil.get('does_not_exist')).toBeNull();
    });

    it('encodes and decodes special characters', () => {
      CookieUtil.set('encoded', 'hello world&foo=bar', 7, false);
      expect(CookieUtil.get('encoded')).toBe('hello world&foo=bar');
    });

    it('handles multiple cookies independently', () => {
      CookieUtil.set('key_a', 'value_a', 7, false);
      CookieUtil.set('key_b', 'value_b', 7, false);

      expect(CookieUtil.get('key_a')).toBe('value_a');
      expect(CookieUtil.get('key_b')).toBe('value_b');
    });

    it('overwrites an existing cookie', () => {
      CookieUtil.set('overwrite', 'old', 7, false);
      CookieUtil.set('overwrite', 'new', 7, false);
      expect(CookieUtil.get('overwrite')).toBe('new');
    });
  });

  describe('remove()', () => {
    it('removes an existing cookie', () => {
      CookieUtil.set('to_remove', 'value', 7, false);
      expect(CookieUtil.get('to_remove')).toBe('value');

      CookieUtil.remove('to_remove');
      expect(CookieUtil.get('to_remove')).toBeNull();
    });
  });

  describe('has()', () => {
    it('returns true when cookie exists', () => {
      CookieUtil.set('exists', 'yes', 7, false);
      expect(CookieUtil.has('exists')).toBe(true);
    });

    it('returns false when cookie does not exist', () => {
      expect(CookieUtil.has('nope')).toBe(false);
    });
  });
});
