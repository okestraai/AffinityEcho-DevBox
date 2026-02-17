// src/utils/tokenUtils.ts
import { CookieUtil } from './cookies';

export const TokenUtils = {
  /**
   * Get access token from cookies (preferred) or localStorage (fallback)
   */
  getAccessToken(): string | null {
    return CookieUtil.get('access_token') || localStorage.getItem('access_token');
  },

  /**
   * Get refresh token from cookies (preferred) or localStorage (fallback)
   */
  getRefreshToken(): string | null {
    return CookieUtil.get('refresh_token') || localStorage.getItem('refresh_token');
  },

  /**
   * Set both tokens in cookies and localStorage
   */
  setTokens(accessToken: string, refreshToken: string): void {
    // Cookies (7 days for access, 30 days for refresh)
    CookieUtil.set('access_token', accessToken, 7);
    CookieUtil.set('refresh_token', refreshToken, 30);

    // localStorage as fallback
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },

  /**
   * Clear all tokens from cookies and localStorage
   */
  clearTokens(): void {
    CookieUtil.remove('access_token');
    CookieUtil.remove('refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  /**
   * Check if user has valid tokens
   */
  hasTokens(): boolean {
    return !!this.getAccessToken();
  },
};
