// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  registerUser,
  loginUser,
  SocialMediaLogin,
  ForgotPassword,
  GetCurrentUser,
} from "../../api/authApis";
import { ReactivateAccount } from "../../api/profileApis";
import { showToast } from "../Helper/ShowToast";
import { TokenUtils } from "../utils/tokenUtils";

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  first_name?: string;
  last_name?: string;
  has_completed_onboarding: boolean;
  demographics: {
    race?: string;
    gender?: string;
    careerLevel?: string;
    company?: string;
    affinityTags?: string[];
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: "google" | "facebook") => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: (data?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// Static arrays hoisted outside component to avoid re-creation on every render
const USERNAME_ADJECTIVES = ["Brave", "Quiet", "Rising", "Bold", "True", "Free"];
const USERNAME_NOUNS = ["Lion", "Eagle", "Wolf", "Fox", "Phoenix", "Bear"];
const AVATAR_EMOJIS = [
  "🌟", "⭐", "✨", "💫", "🔥", "⚡", "💎", "👑", "🏆", "🎯",
  "🎨", "🎭", "🎪", "🎬", "🎮", "🎲", "🎸", "🎹", "🎺", "🎻",
  "📦", "📚", "📖", "📝", "📌", "📍", "📎", "📐", "📏", "📊",
  "⚙️", "🔧", "🔨", "⚒️", "🛠️", "🔩", "⚗️", "🧪", "🧬", "🔬",
  "🚀", "✈️", "🛸", "🎈", "🎆", "🎇", "🌈", "☀️", "🌙", "⭐",
  "💼", "🎓", "🏅", "🥇", "🥈", "🥉", "🏵️", "🎖️", "🔔", "🔑",
  "🗝️", "💡", "🔦", "🕯️", "🧭", "🗺️", "⏰", "⏱️", "⌚", "🔮"
];

const generateUsername = () => {
  const num = Math.floor(Math.random() * 9999);
  return `${USERNAME_ADJECTIVES[Math.floor(Math.random() * USERNAME_ADJECTIVES.length)]}${
    USERNAME_NOUNS[Math.floor(Math.random() * USERNAME_NOUNS.length)]
  }${num}`;
};

const generateAvatar = () => {
  return AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [reactivateResolver, setReactivateResolver] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);
  const navigate = useNavigate();

  const saveTokens = (access: string, refresh: string) => {
    TokenUtils.setTokens(access, refresh);
  };

  const clearAuth = () => {
    TokenUtils.clearTokens();
    setUser(null);
  };

  const loadUser = async () => {
    try {
      const res = await GetCurrentUser();
      setUser(res);
    } catch {
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const loginData = await loginUser({ email, password });
      saveTokens(loginData.access_token, loginData.refresh_token);

      // Check if the account is deactivated (returned from backend login response)
      if (loginData.is_deactivated) {
        const shouldReactivate = await new Promise<boolean>((resolve) => {
          setReactivateResolver({ resolve });
          setShowReactivateModal(true);
        });
        setShowReactivateModal(false);
        setReactivateResolver(null);

        if (shouldReactivate) {
          try {
            await ReactivateAccount();
            showToast("Account reactivated! Welcome back!", "success");
          } catch {
            showToast("Failed to reactivate. Please try again.", "error");
            clearAuth();
            return;
          }
        } else {
          clearAuth();
          showToast("Login cancelled. Your account remains paused.", "info");
          return;
        }
      }

      await loadUser();
      showToast("Welcome back!", "success");
      navigate(loginData.has_completed_onboarding ? "/dashboard" : "/onboarding");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Login failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const username = generateUsername();
      const avatar = generateAvatar();
      await registerUser({ email, password, username, avatar });
      showToast("Check your email for the code!", "success");
      navigate('/verify-otp', { state: { email }, replace: true });
    } catch (err: any) {
      showToast(err.response?.data?.message || "Signup failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin = async (provider: "google" | "facebook") => {
    setIsLoading(true);
    try {
      const socialData = await SocialMediaLogin(provider);
      // Validate redirect URL to prevent open redirect attacks
      const url = new URL(socialData.url);
      const allowedHosts = [
        window.location.hostname,
        'accounts.google.com',
        'www.facebook.com',
      ];
      if (!allowedHosts.some(host => url.hostname === host || url.hostname.endsWith('.' + host))) {
        throw new Error('Invalid redirect URL');
      }
      window.location.href = socialData.url;
    } catch {
      showToast("Social login failed", "error");
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      await ForgotPassword(email);
      showToast("Check your email", "success");
      navigate('/verify-otp', { state: { email, type: 'password-reset' }, replace: true });
    } catch {
      showToast("If email exists, code sent", "info");
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const logout = () => {
    clearAuth();
    showToast("Logged out", "info");
    navigate("/login");
  };

  // NEW: Complete onboarding flow
  const completeOnboarding = async (onboardingData?: any) => {
    setIsLoading(true);
    try {
      await loadUser(); // Refresh user to get updated has_completed_onboarding = true
      showToast(
        "Welcome to Affinity Echo!",
        "Your profile is complete. Let’s get started!",
        "success"
      );
      navigate("/dashboard");
    } catch {
      showToast("Something went wrong. Please refresh.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check for token (cookies first, localStorage as fallback)
    if (TokenUtils.hasTokens()) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        hasCompletedOnboarding: user?.has_completed_onboarding ?? false,
        login,
        signup,
        socialLogin,
        forgotPassword,
        logout,
        loadUser,
        updateUser,
        completeOnboarding,
      }}
    >
      {children}

      {/* Reactivate Account Modal */}
      {showReactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Account Paused</h3>
              <p className="text-sm text-gray-600">
                Your account is currently paused. Would you like to reactivate it and continue?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => reactivateResolver?.resolve(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => reactivateResolver?.resolve(true)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all text-sm"
              >
                Reactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
