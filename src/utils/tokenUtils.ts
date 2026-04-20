// src/utils/tokenUtils.ts
import { CookieUtil } from './cookies';

export const TokenUtils = {
  /**
   * Get access token from cookies
   */
  getAccessToken(): string | null {
    return CookieUtil.get('access_token');
  },

  /**
   * Get refresh token from cookies
   */
  getRefreshToken(): string | null {
    return CookieUtil.get('refresh_token');
  },

  /**
   * Set both tokens in cookies
   */
  setTokens(accessToken: string, refreshToken: string): void {
    CookieUtil.set('access_token', accessToken, 7);
    CookieUtil.set('refresh_token', refreshToken, 30);
  },

  /**
   * Clear all tokens from cookies and localStorage (cleanup of old installs)
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
