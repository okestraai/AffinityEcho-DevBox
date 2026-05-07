import { describe, it, expect, beforeEach } from 'vitest';

// Mock websocket service
vi.mock('../services/websocket.service', () => ({
  webSocketService: {
    isConnected: vi.fn(() => false),
    reconnectWithFreshToken: vi.fn(),
  },
}));

// Mock TokenUtils
vi.mock('../utils/tokenUtils', () => ({
  TokenUtils: {
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    hasTokens: vi.fn(),
  },
}));

// We need to mock import.meta.env
vi.stubEnv('VITE_API_URL', 'http://test-api.com');

import axios from 'axios';
import AxiosInterceptor from '../Helper/AxiosInterceptor';
import { TokenUtils } from '../utils/tokenUtils';

describe('AxiosInterceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset location mock
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });
  });

  it('creates an axios instance', () => {
    const instance = AxiosInterceptor('test-token', 'refresh-token');
    expect(instance).toBeDefined();
    expect(instance.interceptors).toBeDefined();
  });

  it('attaches auth token to requests via request interceptor', async () => {
    const instance = AxiosInterceptor('my-access-token', 'my-refresh-token');

    // Simulate a request interceptor call by accessing the instance's interceptors
    // The request interceptor was added; we can test by examining the config
    // We use the instance's internal interceptors to verify
    const requestInterceptors = (instance.interceptors.request as any).handlers;
    expect(requestInterceptors.length).toBeGreaterThan(0);

    // Get the fulfilled handler from the first interceptor
    const fulfilledHandler = requestInterceptors[0].fulfilled;
    const config = { headers: {} as Record<string, string> };
    const result = fulfilledHandler(config);

    expect(result.headers.Authorization).toBe('Bearer my-access-token');
  });

  it('does not attach auth header when no access token is provided', () => {
    const instance = AxiosInterceptor(null, null);

    const requestInterceptors = (instance.interceptors.request as any).handlers;
    const fulfilledHandler = requestInterceptors[0].fulfilled;
    const config = { headers: {} as Record<string, string> };
    const result = fulfilledHandler(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('has a response interceptor that passes through successful responses', async () => {
    const instance = AxiosInterceptor('token', 'refresh');
    const responseInterceptors = (instance.interceptors.response as any).handlers;
    expect(responseInterceptors.length).toBeGreaterThan(0);

    const fulfilledHandler = responseInterceptors[0].fulfilled;
    const mockResponse = { status: 200, data: { ok: true } };
    const result = fulfilledHandler(mockResponse);

    expect(result).toEqual(mockResponse);
  });

  it('rejects non-401 errors without attempting refresh', async () => {
    const instance = AxiosInterceptor('token', 'refresh');
    const responseInterceptors = (instance.interceptors.response as any).handlers;
    const rejectedHandler = responseInterceptors[0].rejected;

    const error = {
      response: { status: 500 },
      config: {},
    };

    await expect(rejectedHandler(error)).rejects.toEqual(error);
  });

  it('attempts token refresh on 401 error', async () => {
    const instance = AxiosInterceptor('old-token', 'my-refresh');
    const responseInterceptors = (instance.interceptors.response as any).handlers;
    const rejectedHandler = responseInterceptors[0].rejected;

    // Mock the axios.post for refresh
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { data: { access_token: 'new-token' } },
    });

    const error = {
      response: { status: 401 },
      config: {
        headers: {} as Record<string, string>,
        _retry: false,
      },
    };

    // This will try to refresh and retry; the instance call will fail but that's ok
    // The important thing is the refresh was attempted
    try {
      await rejectedHandler(error);
    } catch {
      // Instance retry may fail in test env, that's expected
    }

    expect(postSpy).toHaveBeenCalledWith(
      'http://test-api.com/auth/refresh-token',
      { refreshToken: 'my-refresh' },
    );

    postSpy.mockRestore();
  });

  it('clears tokens and redirects to login on refresh failure', async () => {
    const instance = AxiosInterceptor('old-token', 'my-refresh');
    const responseInterceptors = (instance.interceptors.response as any).handlers;
    const rejectedHandler = responseInterceptors[0].rejected;

    const postSpy = vi.spyOn(axios, 'post').mockRejectedValue(new Error('Refresh failed'));

    const error = {
      response: { status: 401 },
      config: {
        headers: {} as Record<string, string>,
        _retry: false,
      },
    };

    await expect(rejectedHandler(error)).rejects.toThrow('Refresh failed');

    expect(TokenUtils.clearTokens).toHaveBeenCalled();
    expect(window.location.href).toBe('/login');

    postSpy.mockRestore();
  });

  it('does not attempt refresh when no refresh token is provided', async () => {
    const instance = AxiosInterceptor('token', null);
    const responseInterceptors = (instance.interceptors.response as any).handlers;
    const rejectedHandler = responseInterceptors[0].rejected;

    const postSpy = vi.spyOn(axios, 'post');

    const error = {
      response: { status: 401 },
      config: {
        headers: {} as Record<string, string>,
        _retry: false,
      },
    };

    await expect(rejectedHandler(error)).rejects.toEqual(error);
    expect(postSpy).not.toHaveBeenCalled();

    postSpy.mockRestore();
  });

  it('does not retry a request that has already been retried', async () => {
    const instance = AxiosInterceptor('token', 'refresh');
    const responseInterceptors = (instance.interceptors.response as any).handlers;
    const rejectedHandler = responseInterceptors[0].rejected;

    const postSpy = vi.spyOn(axios, 'post');

    const error = {
      response: { status: 401 },
      config: {
        headers: {} as Record<string, string>,
        _retry: true, // already retried
      },
    };

    await expect(rejectedHandler(error)).rejects.toEqual(error);
    expect(postSpy).not.toHaveBeenCalled();

    postSpy.mockRestore();
  });
});
