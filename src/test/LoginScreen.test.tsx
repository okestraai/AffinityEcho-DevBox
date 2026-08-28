import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginScreen } from '../components/auth/LoginScreen';
import { renderWithRouter } from './testUtils';

// Mock useAuth hook
const mockLogin = vi.fn();
const mockSignup = vi.fn();
const mockSocialLogin = vi.fn();
const mockForgotPassword = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    login: mockLogin,
    signup: mockSignup,
    socialLogin: mockSocialLogin,
    forgotPassword: mockForgotPassword,
    actionLoading: false,
  })),
}));

// Mock PasswordStrengthIndicator
vi.mock('../components/shared/PasswordStrengthIndicator', () => ({
  default: ({ password }: { password: string }) =>
    password ? <div data-testid="password-strength">Strength indicator</div> : null,
}));

// Mock TrimInput - strip required to avoid jsdom blocking form submission
vi.mock('../components/shared/TrimInput', () => ({
  TrimInput: ({ onTrim, required: _required, ...props }: any) => <input {...props} />,
}));

// Mock validatePassword
vi.mock('../utils/passwordUtils', () => ({
  validatePassword: vi.fn((pw: string) => {
    if (pw.length < 8) return 'Password must contain: at least 8 characters';
    return null;
  }),
}));

import { useAuth } from '../hooks/useAuth';
const mockedUseAuth = vi.mocked(useAuth);

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      login: mockLogin,
      signup: mockSignup,
      socialLogin: mockSocialLogin,
      forgotPassword: mockForgotPassword,
      actionLoading: false,
    } as any);
  });

  describe('rendering', () => {
    it('renders email and password inputs', () => {
      renderWithRouter(<LoginScreen />);

      expect(screen.getByPlaceholderText('your.email@company.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('renders Sign In button in login mode', () => {
      renderWithRouter(<LoginScreen />);

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('renders Forgot password link in login mode', () => {
      renderWithRouter(<LoginScreen />);

      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    });

    it('renders Google login button', () => {
      renderWithRouter(<LoginScreen />);

      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    });

    it('renders sign up toggle link', () => {
      renderWithRouter(<LoginScreen />);

      expect(screen.getByText("Don't have an account? Sign up")).toBeInTheDocument();
    });

    it('renders Welcome Back heading in login mode', () => {
      renderWithRouter(<LoginScreen />);

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });
  });

  describe('toggle between login and signup', () => {
    it('switches to signup mode when clicking sign up link', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginScreen />);

      await user.click(screen.getByText("Don't have an account? Sign up"));

      expect(screen.getByText('Join the Community')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    });

    it('switches back to login mode', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginScreen />);

      await user.click(screen.getByText("Don't have an account? Sign up"));
      await user.click(screen.getByText('Already have an account? Sign in'));

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    it('clears form fields when toggling modes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginScreen />);

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      await user.type(passwordInput, 'testpass');

      await user.click(screen.getByText("Don't have an account? Sign up"));

      expect(screen.getByPlaceholderText('Enter your password')).toHaveValue('');
    });
  });

  describe('password visibility toggle', () => {
    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginScreen />);

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(screen.getByLabelText('Show password'));
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(screen.getByLabelText('Hide password'));
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('toggles confirm password visibility in signup mode', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginScreen />);

      await user.click(screen.getByText("Don't have an account? Sign up"));

      const confirmInput = screen.getByPlaceholderText('Confirm your password');
      expect(confirmInput).toHaveAttribute('type', 'password');

      await user.click(screen.getByLabelText('Show confirm password'));
      expect(confirmInput).toHaveAttribute('type', 'text');
    });
  });

  describe('validation', () => {
    it('shows error when submitting empty login form', async () => {
      renderWithRouter(<LoginScreen />);

      // Use fireEvent.submit to bypass HTML5 required validation in jsdom
      const form = screen.getByRole('button', { name: 'Sign In' }).closest('form')!;
      fireEvent.submit(form);

      expect(await screen.findByText('Please fill in all fields')).toBeInTheDocument();
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('shows error when passwords do not match in signup mode', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginScreen />);

      await user.click(screen.getByText("Don't have an account? Sign up"));

      fireEvent.change(screen.getByPlaceholderText('your.email@company.com'), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'StrongPass1!' },
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), {
        target: { value: 'DifferentPass1!' },
      });

      const form = screen.getByRole('button', { name: 'Create Account' }).closest('form')!;
      fireEvent.submit(form);

      expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
      expect(mockSignup).not.toHaveBeenCalled();
    });

    it('shows password validation error in signup mode for weak password', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginScreen />);

      await user.click(screen.getByText("Don't have an account? Sign up"));

      fireEvent.change(screen.getByPlaceholderText('your.email@company.com'), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'short' },
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), {
        target: { value: 'short' },
      });

      const form = screen.getByRole('button', { name: 'Create Account' }).closest('form')!;
      fireEvent.submit(form);

      expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
      expect(mockSignup).not.toHaveBeenCalled();
    });
  });

  describe('form submission', () => {
    it('calls login with email and password', () => {
      renderWithRouter(<LoginScreen />);

      fireEvent.change(screen.getByPlaceholderText('your.email@company.com'), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'MyPassword123!' },
      });

      const form = screen.getByRole('button', { name: 'Sign In' }).closest('form')!;
      fireEvent.submit(form);

      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'MyPassword123!');
    });

    it('calls signup with email and password when form is valid', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginScreen />);

      await user.click(screen.getByText("Don't have an account? Sign up"));

      fireEvent.change(screen.getByPlaceholderText('your.email@company.com'), {
        target: { value: 'new@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'StrongPass1!' },
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm your password'), {
        target: { value: 'StrongPass1!' },
      });

      // Accept the terms — the submit button is disabled without it, so a signup that skips this
      // is a path no real user can take. The test used to submit the form directly, bypassing the
      // disabled button, and then assert two arguments while the component passes three.
      fireEvent.click(screen.getByRole('checkbox'));

      const form = screen.getByRole('button', { name: 'Create Account' }).closest('form')!;
      fireEvent.submit(form);

      expect(mockSignup).toHaveBeenCalledWith('new@test.com', 'StrongPass1!', true);
    });

    it('does not call login when only email is filled', async () => {
      renderWithRouter(<LoginScreen />);

      fireEvent.change(screen.getByPlaceholderText('your.email@company.com'), {
        target: { value: 'test@test.com' },
      });

      const form = screen.getByRole('button', { name: 'Sign In' }).closest('form')!;
      fireEvent.submit(form);

      expect(mockLogin).not.toHaveBeenCalled();
      expect(await screen.findByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  describe('social login', () => {
    it('calls socialLogin with google on button click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginScreen />);

      await user.click(screen.getByRole('button', { name: /google/i }));

      expect(mockSocialLogin).toHaveBeenCalledWith('google');
    });
  });

  describe('forgot password', () => {
    it('shows forgot password form', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginScreen />);

      await user.click(screen.getByText('Forgot password?'));

      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.getByText("We'll send you a verification code")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument();
    });

    it('shows error when submitting forgot password form with empty email', async () => {
      renderWithRouter(<LoginScreen />);

      // Switch to forgot password view
      fireEvent.click(screen.getByText('Forgot password?'));

      // Submit the form without filling email
      const form = screen.getByRole('button', { name: /send reset code/i }).closest('form')!;
      fireEvent.submit(form);

      expect(await screen.findByText('Please enter your email')).toBeInTheDocument();
      expect(mockForgotPassword).not.toHaveBeenCalled();
    });

    it('calls forgotPassword with email', async () => {
      renderWithRouter(<LoginScreen />);

      fireEvent.click(screen.getByText('Forgot password?'));

      fireEvent.change(screen.getByPlaceholderText('your.email@company.com'), {
        target: { value: 'forgot@test.com' },
      });

      const form = screen.getByRole('button', { name: /send reset code/i }).closest('form')!;
      fireEvent.submit(form);

      expect(mockForgotPassword).toHaveBeenCalledWith('forgot@test.com');
    });

    it('navigates back to login from forgot password', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginScreen />);

      await user.click(screen.getByText('Forgot password?'));
      expect(screen.getByText('Reset Password')).toBeInTheDocument();

      await user.click(screen.getByText('Back to Login'));

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading state when actionLoading is true', () => {
      mockedUseAuth.mockReturnValue({
        login: mockLogin,
        signup: mockSignup,
        socialLogin: mockSocialLogin,
        forgotPassword: mockForgotPassword,
        actionLoading: true,
      } as any);

      renderWithRouter(<LoginScreen />);

      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('disables submit button when actionLoading', () => {
      mockedUseAuth.mockReturnValue({
        login: mockLogin,
        signup: mockSignup,
        socialLogin: mockSocialLogin,
        forgotPassword: mockForgotPassword,
        actionLoading: true,
      } as any);

      renderWithRouter(<LoginScreen />);

      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find((b) => b.getAttribute('type') === 'submit');
      expect(submitBtn).toBeDisabled();
    });
  });

  describe('footer links', () => {
    it('renders terms, privacy, and FAQ links', () => {
      renderWithRouter(<LoginScreen />);

      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('FAQ')).toBeInTheDocument();
    });

    it('shows anonymity message', () => {
      renderWithRouter(<LoginScreen />);

      expect(screen.getByText('Your identity remains completely anonymous')).toBeInTheDocument();
    });
  });
});
