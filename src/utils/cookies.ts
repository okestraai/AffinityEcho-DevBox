// src/utils/cookies.ts

export const CookieUtil = {
  /**
   * Set a cookie
   * @param name - Cookie name
   * @param value - Cookie value
   * @param days - Expiration in days (default 7)
   * @param secure - Use secure flag (default true in production)
   */
  set(name: string, value: string, days = 7, secure = import.meta.env.PROD): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    const cookieString = [
      `${name}=${encodeURIComponent(value)}`,
      `expires=${expires.toUTCString()}`,
      'path=/',
      'SameSite=Lax',
      secure ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ');

    document.cookie = cookieString;
  },

  /**
   * Get a cookie value
   * @param name - Cookie name
   * @returns Cookie value or null if not found
   */
  get(name: string): string | null {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(nameEQ)) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }

    return null;
  },

  /**
   * Remove a cookie
   * @param name - Cookie name
   */
  remove(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  },

  /**
   * Check if a cookie exists
   * @param name - Cookie name
   * @returns true if cookie exists
   */
  has(name: string): boolean {
    return this.get(name) !== null;
  },
};
