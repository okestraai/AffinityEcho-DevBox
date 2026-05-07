import { describe, it, expect, beforeEach } from 'vitest';

// Mock axios before importing the module under test
vi.mock('axios', () => {
  const mockAxios = {
    post: vi.fn(),
    get: vi.fn(),
    create: vi.fn(() => mockAxios),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return { default: mockAxios };
});

// Mock the base module
vi.mock('../../api/base', () => ({
  API_URL: 'http://test-api.com',
  getAuthInstance: vi.fn(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  })),
  unwrap: vi.fn((res: any) => res.data?.data ?? res.data),
}));

import axios from 'axios';
import { getAuthInstance } from '../../api/base';
import {
  registerUser,
  loginUser,
  SocialMediaLogin,
  ResetPassword,
  ForgotPassword,
  ResendOTP,
  VerifyOTP,
  GetCurrentUser,
  RefreshToken,
  LogoutUser,
  UpdateOnboardingProfile,
  CreateOnboardingProfile,
  ChangePassword,
  CheckOnboardingStatus,
} from '../../api/authApis';

const mockedAxios = vi.mocked(axios);
const mockedGetAuthInstance = vi.mocked(getAuthInstance);

describe('authApis', () => {
  let mockAuthInstance: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    };
    mockedGetAuthInstance.mockReturnValue(mockAuthInstance as any);
  });

  describe('registerUser', () => {
    it('calls POST /auth/signup with payload', async () => {
      const payload = { email: 'a@b.com', password: 'pass', username: 'user1' };
      mockedAxios.post.mockResolvedValue({ data: { data: { message: 'ok' } } });

      const result = await registerUser(payload);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://test-api.com/auth/signup',
        payload,
      );
      expect(result).toEqual({ message: 'ok' });
    });

    it('propagates errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));
      await expect(registerUser({ email: 'a@b.com', password: 'p', username: 'u' })).rejects.toThrow('Network Error');
    });
  });

  describe('loginUser', () => {
    it('calls POST /auth/login with email and password', async () => {
      const loginData = {
        access_token: 'at',
        refresh_token: 'rt',
        user: { id: '1', email: 'a@b.com' },
      };
      mockedAxios.post.mockResolvedValue({ data: { data: loginData } });

      const result = await loginUser({ email: 'a@b.com', password: 'pass' });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://test-api.com/auth/login',
        { email: 'a@b.com', password: 'pass' },
      );
      expect(result).toEqual(loginData);
    });
  });

  describe('SocialMediaLogin', () => {
    it('calls GET /auth/login/google', async () => {
      mockedAxios.get.mockResolvedValue({ data: { data: { url: 'https://accounts.google.com/...' } } });

      const result = await SocialMediaLogin('google');

      expect(mockedAxios.get).toHaveBeenCalledWith('http://test-api.com/auth/login/google');
      expect(result).toEqual({ url: 'https://accounts.google.com/...' });
    });

    it('calls GET /auth/login/facebook', async () => {
      mockedAxios.get.mockResolvedValue({ data: { data: { url: 'https://facebook.com/...' } } });

      const result = await SocialMediaLogin('facebook');

      expect(mockedAxios.get).toHaveBeenCalledWith('http://test-api.com/auth/login/facebook');
      expect(result).toEqual({ url: 'https://facebook.com/...' });
    });
  });

  describe('ResetPassword', () => {
    it('calls POST /auth/reset-password with email, password and otp', async () => {
      mockedAxios.post.mockResolvedValue({ data: { data: { message: 'Password reset' } } });

      const result = await ResetPassword('a@b.com', 'newpass', '123456');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://test-api.com/auth/reset-password',
        { email: 'a@b.com', password: 'newpass', otp: '123456' },
      );
      expect(result).toEqual({ message: 'Password reset' });
    });
  });

  describe('ForgotPassword', () => {
    it('calls POST /auth/forgot-password with email', async () => {
      mockedAxios.post.mockResolvedValue({ data: { data: { message: 'OTP sent' } } });

      const result = await ForgotPassword('a@b.com');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://test-api.com/auth/forgot-password',
        { email: 'a@b.com' },
      );
      expect(result).toEqual({ message: 'OTP sent' });
    });
  });

  describe('ResendOTP', () => {
    it('calls POST /auth/otp/resend with email', async () => {
      mockedAxios.post.mockResolvedValue({ data: { data: { message: 'Resent' } } });

      const result = await ResendOTP('a@b.com');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://test-api.com/auth/otp/resend',
        { email: 'a@b.com' },
      );
      expect(result).toEqual({ message: 'Resent' });
    });
  });

  describe('VerifyOTP', () => {
    it('calls POST /auth/otp/verify with email and token', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { data: { access_token: 'at', refresh_token: 'rt' } },
      });

      const result = await VerifyOTP('a@b.com', '123456');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://test-api.com/auth/otp/verify',
        { email: 'a@b.com', token: '123456' },
      );
      expect(result).toEqual({ access_token: 'at', refresh_token: 'rt' });
    });
  });

  describe('GetCurrentUser', () => {
    it('calls GET /auth/me with auth instance', async () => {
      mockAuthInstance.get.mockResolvedValue({ data: { data: { id: '1', email: 'a@b.com' } } });

      await GetCurrentUser();

      expect(mockedGetAuthInstance).toHaveBeenCalled();
      expect(mockAuthInstance.get).toHaveBeenCalledWith('http://test-api.com/auth/me');
    });
  });

  describe('RefreshToken', () => {
    it('calls POST /auth/refresh-token and returns access_token', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { data: { access_token: 'new-at' } },
      });

      const result = await RefreshToken('old-rt');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://test-api.com/auth/refresh-token',
        { refreshToken: 'old-rt' },
      );
      expect(result).toBe('new-at');
    });
  });

  describe('LogoutUser', () => {
    it('calls POST /auth/logout with auth instance', async () => {
      mockAuthInstance.post.mockResolvedValue({ data: { data: { message: 'Logged out' } } });

      await LogoutUser();

      expect(mockAuthInstance.post).toHaveBeenCalledWith('http://test-api.com/auth/logout');
    });
  });

  describe('UpdateOnboardingProfile', () => {
    it('calls PUT /auth/profile with auth instance', async () => {
      const payload = { bio: 'Hello' };
      mockAuthInstance.put.mockResolvedValue({ data: { data: { message: 'Updated' } } });

      await UpdateOnboardingProfile(payload);

      expect(mockAuthInstance.put).toHaveBeenCalledWith('http://test-api.com/auth/profile', payload);
    });
  });

  describe('CreateOnboardingProfile', () => {
    it('calls POST /auth/onboarding/complete with auth instance', async () => {
      const payload = { bio: 'Hello', company: 'TechCo' };
      mockAuthInstance.post.mockResolvedValue({ data: { data: { message: 'Created' } } });

      await CreateOnboardingProfile(payload);

      expect(mockAuthInstance.post).toHaveBeenCalledWith(
        'http://test-api.com/auth/onboarding/complete',
        payload,
      );
    });
  });

  describe('ChangePassword', () => {
    it('calls PATCH /auth/change-password with auth instance', async () => {
      const payload = { currentPassword: 'old', newPassword: 'new' };
      mockAuthInstance.patch.mockResolvedValue({ data: { data: { message: 'Changed' } } });

      await ChangePassword(payload);

      expect(mockAuthInstance.patch).toHaveBeenCalledWith(
        'http://test-api.com/auth/change-password',
        payload,
      );
    });
  });

  describe('CheckOnboardingStatus', () => {
    it('calls GET /auth/onboarding/status with auth instance', async () => {
      mockAuthInstance.get.mockResolvedValue({ data: { data: { completed: true } } });

      await CheckOnboardingStatus();

      expect(mockAuthInstance.get).toHaveBeenCalledWith('http://test-api.com/auth/onboarding/status');
    });
  });
});
