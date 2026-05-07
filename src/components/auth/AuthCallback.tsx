import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TokenUtils } from "../../utils/tokenUtils";
import { useAuth } from "../../hooks/useAuth";

/**
 * Handles the OAuth callback redirect from the backend.
 *
 * Backend redirects here with query params:
 *   /auth/callback?access_token=xxx&refresh_token=xxx
 *
 * Flow:
 *   1. Extract tokens from URL
 *   2. Save them
 *   3. Load the user profile
 *   4. Redirect based on onboarding / role
 */
export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const accessToken =
          searchParams.get("access_token") || searchParams.get("token");
        const refreshToken =
          searchParams.get("refresh_token") || searchParams.get("refresh");

        if (!accessToken || !refreshToken) {
          const errMsg = searchParams.get("error") || searchParams.get("message");
          throw new Error(errMsg || "Missing tokens in callback URL");
        }

        // 1. Save tokens
        TokenUtils.setTokens(accessToken, refreshToken);

        // 2. Load user profile (now returns the user directly)
        const user = await loadUser();

        if (!user) {
          throw new Error("Failed to load user profile");
        }

        // 3. Redirect based on user state
        if (!user.has_completed_onboarding) {
          navigate("/onboarding", { replace: true });
        } else if (user.role === "admin" || user.role === "super_admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (err: unknown) {
        console.error("OAuth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setTimeout(() => navigate("/login", { replace: true }), 3000);
      }
    };

    processCallback();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <p className="text-xs text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="animate-logo-pulse">
        <img
          src="/affinity-echo-logo-hd.png"
          alt="Affinity Echo"
          className="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-xl object-contain"
        />
      </div>
      <p className="mt-4 text-sm text-gray-600 font-medium">Signing you in...</p>
      <div className="mt-3 flex items-center gap-1.5">
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:150ms]" />
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
