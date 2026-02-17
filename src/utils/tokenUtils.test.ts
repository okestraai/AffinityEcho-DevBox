import { TokenUtils } from './tokenUtils';
import { CookieUtil } from './cookies';

vi.mock('./cookies', () => ({
  CookieUtil: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    has: vi.fn(),
  },
}));

const mockedCookie = vi.mocked(CookieUtil);

describe('TokenUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getAccessToken()', () => {
    it('returns cookie value when present', () => {
      mockedCookie.get.mockReturnValue('cookie_access_token');
      expect(TokenUtils.getAccessToken()).toBe('cookie_access_token');
    });

    it('falls back to localStorage when cookie is empty', () => {
      mockedCookie.get.mockReturnValue(null);
      localStorage.setItem('access_token', 'ls_access_token');
      expect(TokenUtils.getAccessToken()).toBe('ls_access_token');
    });

    it('returns null when both sources are empty', () => {
      mockedCookie.get.mockReturnValue(null);
      expect(TokenUtils.getAccessToken()).toBeNull();
    });
  });

  describe('getRefreshToken()', () => {
    it('returns cookie value when present', () => {
      mockedCookie.get.mockReturnValue('cookie_refresh_token');
      expect(TokenUtils.getRefreshToken()).toBe('cookie_refresh_token');
    });

    it('falls back to localStorage when cookie is empty', () => {
      mockedCookie.get.mockReturnValue(null);
      localStorage.setItem('refresh_token', 'ls_refresh_token');
      expect(TokenUtils.getRefreshToken()).toBe('ls_refresh_token');
    });
  });

  describe('setTokens()', () => {
    it('stores tokens in both cookies and localStorage', () => {
      TokenUtils.setTokens('my_access', 'my_refresh');

      expect(mockedCookie.set).toHaveBeenCalledWith('access_token', 'my_access', 7);
      expect(mockedCookie.set).toHaveBeenCalledWith('refresh_token', 'my_refresh', 30);
      expect(localStorage.getItem('access_token')).toBe('my_access');
      expect(localStorage.getItem('refresh_token')).toBe('my_refresh');
    });
  });

  describe('clearTokens()', () => {
    it('removes tokens from both cookies and localStorage', () => {
      localStorage.setItem('access_token', 'a');
      localStorage.setItem('refresh_token', 'r');

      TokenUtils.clearTokens();

      expect(mockedCookie.remove).toHaveBeenCalledWith('access_token');
      expect(mockedCookie.remove).toHaveBeenCalledWith('refresh_token');
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('hasTokens()', () => {
    it('returns true when access token exists', () => {
      mockedCookie.get.mockReturnValue('token_value');
      expect(TokenUtils.hasTokens()).toBe(true);
    });

    it('returns false when no access token', () => {
      mockedCookie.get.mockReturnValue(null);
      expect(TokenUtils.hasTokens()).toBe(false);
    });
  });
});
