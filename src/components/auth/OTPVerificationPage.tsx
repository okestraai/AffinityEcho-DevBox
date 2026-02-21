// src/components/auth/OTPVerificationPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { VerifyOTP, ResendOTP } from '../../../api/authApis';
import { showToast } from '../../Helper/ShowToast';
import { useAuth } from '../../contexts/AuthContext';

export function OTPVerificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loadUser } = useAuth();

  const state = location.state as { email?: string; type?: string } | null;
  const email = state?.email || '';
  const type = state?.type || 'signup';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      showToast('No email provided', 'error');
      navigate('/login', { replace: true });
    } else {
      setMessage('A verification code has been sent to your email.');
    }
  }, [email, navigate]);

  // Paste full OTP
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
      showToast('OTP pasted!', 'success');
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      setLoading(false);
      return;
    }

    try {
      const response = await VerifyOTP(email, code);

      if (type === 'password-reset') {
        showToast('Code verified!', 'success');
        navigate('/reset-password', { state: { email, token: code }, replace: true });
        return;
      }

      // SAVE TOKENS
      const { access_token, refresh_token } = response;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // THIS MAKES isAuthenticated = true
      await loadUser();

      showToast('Welcome! Let’s complete your profile', 'success');

      // ALWAYS GO TO ONBOARDING — NEW USER!
      navigate('/onboarding');

    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid or expired code';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await ResendOTP(email);
      setMessage('New code sent! Check your inbox.');
      showToast('Code resent!', 'success');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to resend';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/50 p-5 sm:p-8">
          <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 font-medium min-h-[44px]">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>

          <div className="text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
            <p className="text-gray-600">We sent a 6-digit code to</p>
            <p className="text-purple-600 font-semibold mt-1 break-all">{email}</p>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-sm text-green-700">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex gap-2 sm:gap-3 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="w-10 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-lg sm:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.some(d => !d)}
              className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 min-h-[48px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Continue to Onboarding'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-3">Didn't receive it?</p>
            <button onClick={handleResend} disabled={loading} className="text-purple-600 hover:text-purple-700 font-semibold disabled:opacity-50 min-h-[44px] px-4">
              {loading ? 'Sending...' : 'Resend Code'}
            </button>
          </div>

         <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800 text-center">
              💡 Check your spam folder if you don't see the email
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}