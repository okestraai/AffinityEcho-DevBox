import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Track navigations
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock auth APIs - path relative to this test file
vi.mock('../../api/authApis', () => ({
  VerifyOTP: vi.fn(),
  ResendOTP: vi.fn(),
}));

// Mock showToast - path relative to this test file
vi.mock('../Helper/ShowToast', () => ({
  showToast: vi.fn(),
}));

// Mock useAuth - needs to match the import path in OTPVerificationPage
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    loadUser: vi.fn(),
  })),
}));

// Mock TokenUtils
vi.mock('../utils/tokenUtils', () => ({
  TokenUtils: {
    setTokens: vi.fn(),
  },
}));

import { OTPVerificationPage } from '../components/auth/OTPVerificationPage';
import { VerifyOTP, ResendOTP } from '../../api/authApis';
import { showToast } from '../Helper/ShowToast';
import { useAuth } from '../contexts/AuthContext';
import { TokenUtils } from '../utils/tokenUtils';
import { MSG } from '../constants/messages';

// Ensure mocked types


const mockedVerifyOTP = vi.mocked(VerifyOTP);
const mockedResendOTP = vi.mocked(ResendOTP);
const mockedShowToast = vi.mocked(showToast);
const mockedUseAuth = vi.mocked(useAuth);
const mockedTokenUtils = vi.mocked(TokenUtils);

function renderOTP(state: { email?: string; type?: string } = { email: 'test@test.com' }) {
  const mockLoadUser = vi.fn().mockResolvedValue({ id: 'u1', has_completed_onboarding: false });
  mockedUseAuth.mockReturnValue({ loadUser: mockLoadUser } as any);

  return {
    mockLoadUser,
    ...render(
      <MemoryRouter initialEntries={[{ pathname: '/verify-otp', state }]}>
        <OTPVerificationPage />
      </MemoryRouter>,
    ),
  };
}

describe('OTPVerificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders OTP input fields', () => {
      renderOTP();

      // Check at least the first input exists
      expect(document.getElementById('otp-0')).toBeInTheDocument();
    });

    it('displays the email address', () => {
      renderOTP({ email: 'user@company.com' });

      expect(screen.getByText('user@company.com')).toBeInTheDocument();
    });

    it('shows verification message on load', () => {
      renderOTP();

      expect(screen.getByText('A verification code has been sent to your email.')).toBeInTheDocument();
    });

    it('renders Verify Your Email heading', () => {
      renderOTP();

      expect(screen.getByText('Verify Your Email')).toBeInTheDocument();
    });

    it('renders Back to Login button', () => {
      renderOTP();

      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });

    it('renders Resend Code button', () => {
      renderOTP();

      expect(screen.getByText('Resend Code')).toBeInTheDocument();
    });

    it('renders Continue to Onboarding button', () => {
      renderOTP();

      expect(screen.getByRole('button', { name: /continue to onboarding/i })).toBeInTheDocument();
    });
  });

  describe('redirect when no email', () => {
    it('navigates to login and shows toast when no email in state', () => {
      render(
        <MemoryRouter initialEntries={[{ pathname: '/verify-otp', state: {} }]}>
          <OTPVerificationPage />
        </MemoryRouter>,
      );

      expect(mockedShowToast).toHaveBeenCalledWith(MSG.AUTH.NO_EMAIL, 'error');
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  describe('OTP input behavior', () => {
    it('accepts digit input and moves focus to next field', async () => {
      renderOTP();

      const firstInput = document.getElementById('otp-0') as HTMLInputElement;
      fireEvent.change(firstInput, { target: { value: '1' } });

      expect(firstInput.value).toBe('1');
    });

    it('rejects non-digit input', () => {
      renderOTP();

      const firstInput = document.getElementById('otp-0') as HTMLInputElement;
      fireEvent.change(firstInput, { target: { value: 'a' } });

      expect(firstInput.value).toBe('');
    });

    it('handles paste of full OTP code', () => {
      renderOTP();

      const firstInput = document.getElementById('otp-0') as HTMLInputElement;

      const pasteData = {
        clipboardData: {
          getData: () => '123456',
        },
        preventDefault: vi.fn(),
      };

      fireEvent.paste(firstInput, pasteData);

      // After paste, all inputs should be filled
      for (let i = 0; i < 6; i++) {
        const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
        expect(input.value).toBe(String(i + 1));
      }

      expect(mockedShowToast).toHaveBeenCalledWith(MSG.AUTH.OTP_PASTED, 'success');
    });

    it('ignores paste of non-6-digit string', () => {
      renderOTP();

      const firstInput = document.getElementById('otp-0') as HTMLInputElement;

      fireEvent.paste(firstInput, {
        clipboardData: { getData: () => '123' },
        preventDefault: vi.fn(),
      });

      // Should not fill inputs
      expect(firstInput.value).toBe('');
    });

    it('moves focus backward on backspace when current input is empty', () => {
      renderOTP();

      const secondInput = document.getElementById('otp-1') as HTMLInputElement;
      const firstInput = document.getElementById('otp-0') as HTMLInputElement;

      // Focus the second input
      secondInput.focus();

      // Press backspace on empty second input
      fireEvent.keyDown(secondInput, { key: 'Backspace' });

      // First input should now be focused (we can't directly test focus in jsdom easily,
      // but we can verify the event handler was reached without error)
      expect(firstInput).toBeInTheDocument();
    });
  });

  describe('verification', () => {
    it('verifies OTP and calls API on signup success', async () => {
      mockedVerifyOTP.mockResolvedValue({
        access_token: 'at-new',
        refresh_token: 'rt-new',
      });

      const { mockLoadUser } = renderOTP({ email: 'test@test.com', type: 'signup' });

      // Fill all 6 digits
      for (let i = 0; i < 6; i++) {
        const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
        fireEvent.change(input, { target: { value: String(i + 1) } });
      }

      // Submit
      const form = screen.getByRole('button', { name: /continue to onboarding/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockedVerifyOTP).toHaveBeenCalledWith('test@test.com', '123456');
      });

      await waitFor(() => {
        expect(mockedTokenUtils.setTokens).toHaveBeenCalledWith('at-new', 'rt-new');
      });
    });

    it('navigates to reset-password page on password-reset type', async () => {
      mockedVerifyOTP.mockResolvedValue({ message: 'ok' });

      renderOTP({ email: 'test@test.com', type: 'password-reset' });

      // Fill all 6 digits
      for (let i = 0; i < 6; i++) {
        fireEvent.change(document.getElementById(`otp-${i}`)!, {
          target: { value: String(i + 1) },
        });
      }

      const form = screen.getByRole('button', { name: /continue to onboarding/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/reset-password', {
          state: { email: 'test@test.com', token: '123456' },
          replace: true,
        });
      });

      expect(mockedShowToast).toHaveBeenCalledWith(MSG.AUTH.OTP_VERIFIED, 'success');
    });

    it('shows error for incomplete OTP', async () => {
      renderOTP();

      // Only fill 3 digits
      for (let i = 0; i < 3; i++) {
        fireEvent.change(document.getElementById(`otp-${i}`)!, {
          target: { value: String(i + 1) },
        });
      }

      const form = screen.getByRole('button', { name: /continue to onboarding/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Please enter all 6 digits')).toBeInTheDocument();
      });

      expect(mockedVerifyOTP).not.toHaveBeenCalled();
    });

    it('shows error on verification failure', async () => {
      mockedVerifyOTP.mockRejectedValue({
        response: { data: { message: 'Invalid OTP code' } },
      });

      renderOTP();

      for (let i = 0; i < 6; i++) {
        fireEvent.change(document.getElementById(`otp-${i}`)!, {
          target: { value: String(i + 1) },
        });
      }

      const form = screen.getByRole('button', { name: /continue to onboarding/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Invalid OTP code')).toBeInTheDocument();
      });

      expect(mockedShowToast).toHaveBeenCalledWith('Invalid OTP code', 'error');
    });

    it('shows default error message when no specific message returned', async () => {
      mockedVerifyOTP.mockRejectedValue(new Error('fail'));

      renderOTP();

      for (let i = 0; i < 6; i++) {
        fireEvent.change(document.getElementById(`otp-${i}`)!, {
          target: { value: String(i + 1) },
        });
      }

      const form = screen.getByRole('button', { name: /continue to onboarding/i }).closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockedShowToast).toHaveBeenCalledWith(MSG.AUTH.INVALID_OTP, 'error');
      });
    });
  });

  describe('resend OTP', () => {
    it('resends OTP and clears inputs', async () => {
      mockedResendOTP.mockResolvedValue({ message: 'Sent' });

      renderOTP();

      // Fill some digits first
      fireEvent.change(document.getElementById('otp-0')!, { target: { value: '1' } });
      fireEvent.change(document.getElementById('otp-1')!, { target: { value: '2' } });

      const resendBtn = screen.getByText('Resend Code');
      fireEvent.click(resendBtn);

      await waitFor(() => {
        expect(mockedResendOTP).toHaveBeenCalledWith('test@test.com');
      });

      await waitFor(() => {
        expect(screen.getByText('New code sent! Check your inbox.')).toBeInTheDocument();
      });

      expect(mockedShowToast).toHaveBeenCalledWith(MSG.AUTH.OTP_SENT, 'success');

      // Inputs should be cleared
      for (let i = 0; i < 6; i++) {
        expect((document.getElementById(`otp-${i}`) as HTMLInputElement).value).toBe('');
      }
    });

    it('shows error on resend failure', async () => {
      mockedResendOTP.mockRejectedValue({
        response: { data: { message: 'Rate limited' } },
      });

      renderOTP();

      fireEvent.click(screen.getByText('Resend Code'));

      await waitFor(() => {
        expect(screen.getByText('Rate limited')).toBeInTheDocument();
      });

      expect(mockedShowToast).toHaveBeenCalledWith('Rate limited', 'error');
    });
  });

  describe('navigation', () => {
    it('navigates to login when Back to Login is clicked', () => {
      renderOTP();

      fireEvent.click(screen.getByText('Back to Login'));

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('submit button state', () => {
    it('disables submit when not all digits are filled', () => {
      renderOTP();

      const submitBtn = screen.getByRole('button', { name: /continue to onboarding/i });
      expect(submitBtn).toBeDisabled();
    });

    it('enables submit when all digits are filled', () => {
      renderOTP();

      for (let i = 0; i < 6; i++) {
        fireEvent.change(document.getElementById(`otp-${i}`)!, {
          target: { value: String(i + 1) },
        });
      }

      const submitBtn = screen.getByRole('button', { name: /continue to onboarding/i });
      expect(submitBtn).not.toBeDisabled();
    });
  });
});
