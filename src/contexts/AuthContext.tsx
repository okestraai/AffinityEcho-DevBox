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
  role: "user" | "admin" | "super_admin";
  /** Granular permission keys — only populated for role === "admin". super_admin implicitly has all permissions. */
  permissions?: string[];
  has_completed_onboarding: boolean;
  is_deactivated?: boolean;
  company_encrypted?: string;
  company_type?: string;
  demographics?: {
    race?: string;
    gender?: string;
    careerLevel?: string;
    company?: string;
    affinityTags?: string[];
  };
}

interface LoginResponseData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    username: string;
    role: "user" | "admin" | "super_admin";
    has_completed_onboarding: boolean;
    is_deactivated?: boolean;
    first_name?: string;
    last_name?: string;
    avatar?: string | null;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  actionLoading: boolean;
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

// Static arrays for username generation
const USERNAME_ADJECTIVES = [
  "Brave",
  "Quiet",
  "Rising",
  "Bold",
  "True",
  "Free",
];
const USERNAME_NOUNS = ["Lion", "Eagle", "Wolf", "Fox", "Phoenix", "Bear"];
const AVATAR_EMOJIS = [
  "🌟",
  "⭐",
  "✨",
  "💫",
  "🔥",
  "⚡",
  "💎",
  "👑",
  "🏆",
  "🎯",
  "🎨",
  "🎭",
  "🎪",
  "🎬",
  "🎮",
  "🎲",
  "🎸",
  "🎹",
  "🎺",
  "🎻",
  "📦",
  "📚",
  "📖",
  "📝",
  "📌",
  "📍",
  "📎",
  "📐",
  "📏",
  "📊",
  "⚙️",
  "🔧",
  "🔨",
  "⚒️",
  "🛠️",
  "🔩",
  "⚗️",
  "🧪",
  "🧬",
  "🔬",
  "🚀",
  "✈️",
  "🛸",
  "🎈",
  "🎆",
  "🎇",
  "🌈",
  "☀️",
  "🌙",
  "⭐",
  "💼",
  "🎓",
  "🏅",
  "🥇",
  "🥈",
  "🥉",
  "🏵️",
  "🎖️",
  "🔔",
  "🔑",
  "🗝️",
  "💡",
  "🔦",
  "🕯️",
  "🧭",
  "🗺️",
  "⏰",
  "⏱️",
  "⌚",
  "🔮",
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
  const [actionLoading, setActionLoading] = useState(false);
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
     
      
      // Check if the response has the expected structure
      let userData: any = res;
      
      // Handle different response structures
      if (res && typeof res === "object") {
        // If the response has a 'data' property with nested user
        if ('data' in res && res.data && typeof res.data === 'object') {
          userData = res.data;
        }
        
        // Ensure role is set (default to 'user' if not present)
        if (!userData.role) {
          console.warn("User role not found in API response, defaulting to 'user'");
          userData.role = "user";
        }
        
        // Map the response to our User interface
        const mappedUser: User = {
          id: userData.id || userData.userId || '',
          email: userData.email || '',
          username: userData.username || '',
          avatar: userData.avatar || userData.avatar_url || null,
          first_name: userData.first_name || userData.firstName,
          last_name: userData.last_name || userData.lastName,
          role: userData.role as "user" | "admin" | "super_admin",
          permissions: userData.permissions ?? [],
          has_completed_onboarding: userData.has_completed_onboarding ?? userData.hasCompletedOnboarding ?? false,
          is_deactivated: userData.is_deactivated ?? userData.isDeactivated,
          company_encrypted: userData.company_encrypted,
          company_type: userData.company_type,
          demographics: userData.demographics || {},
        };
        
        
        setUser(mappedUser);
      } else {
        console.error("Invalid user data structure:", res);
        clearAuth();
      }
    } catch (error) {
      console.error("Error loading user:", error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setActionLoading(true);
    try {

      const response = await loginUser({ email, password });


      // Handle the response structure
      let loginData: LoginResponseData;

      // Check if response has the ApiResponse wrapper
      if (
        response &&
        typeof response === "object" &&
        "success" in response &&
        response.success === true &&
        "data" in response
      ) {
        loginData = response.data;
      } else if (response && "access_token" in response) {
        // Response is already the data object
        loginData = response;
      } else {
        console.error("Unexpected response structure:", response);
        throw new Error("Invalid login response structure");
      }

      const accessToken = loginData?.access_token;
      const refreshToken = loginData?.refresh_token;

      if (!accessToken || !refreshToken) {
        throw new Error("Invalid login response — missing tokens");
      }

      // Save tokens FIRST before anything else
      saveTokens(accessToken, refreshToken);
 

      // Check if the account is deactivated
      if (loginData.user?.is_deactivated) {
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

      // Set user from login response immediately (don't wait for loadUser)
      const userData: User = {
        id: loginData.user.id,
        email: loginData.user.email,
        username: loginData.user.username,
        avatar: loginData.user.avatar || null,
        first_name: loginData.user.first_name,
        last_name: loginData.user.last_name,
        role: loginData.user.role,
        permissions: (loginData.user as LoginResponseData['user'] & { permissions?: string[] }).permissions ?? [],
        has_completed_onboarding: loginData.user.has_completed_onboarding,
        is_deactivated: loginData.user.is_deactivated,
        demographics: {},
      };

    
      setUser(userData);

      showToast("Welcome back!", "success");

      // Determine redirect path based on role and onboarding
      let redirectPath = "/dashboard"; // default

      if (!userData.has_completed_onboarding) {
        redirectPath = "/onboarding";
      } else {
        // User has completed onboarding, redirect based on role
        if (userData.role === "admin" || userData.role === "super_admin") {
          redirectPath = "/admin";
        } else {
          redirectPath = "/dashboard";
        }
      }

   

      navigate(redirectPath, { replace: true });

      // Load full user profile in background (login response may lack fields like company_encrypted)
      loadUser();
    } catch (err: any) {
      console.error("Login error:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.data?.message ||
        err.message ||
        "Login failed";
      showToast(message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setActionLoading(true);
    try {
      const username = generateUsername();
      const avatar = generateAvatar();
      await registerUser({ email, password, username, avatar });
      showToast("Check your email for the code!", "success");
      navigate("/verify-otp", { state: { email }, replace: true });
    } catch (err: any) {
      showToast(err.response?.data?.message || "Signup failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const socialLogin = async (provider: "google" | "facebook") => {
    setActionLoading(true);
    try {
      const socialData = await SocialMediaLogin(provider);
      // Validate redirect URL to prevent open redirect attacks
      const url = new URL(socialData.url);
      const allowedHosts = [
        window.location.hostname,
        "accounts.google.com",
        "www.facebook.com",
      ];
      if (
        !allowedHosts.some(
          (host) => url.hostname === host || url.hostname.endsWith("." + host),
        )
      ) {
        throw new Error("Invalid redirect URL");
      }
      window.location.href = socialData.url;
    } catch (error) {
      showToast("Social login failed", "error");
      setActionLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setActionLoading(true);
    try {
      await ForgotPassword(email);
      showToast("Check your email", "success");
      navigate("/verify-otp", {
        state: { email, type: "password-reset" },
        replace: true,
      });
    } catch (error) {
      showToast("If email exists, code sent", "info");
    } finally {
      setActionLoading(false);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const logout = () => {
    clearAuth();
    showToast("Logged out", "info");
    navigate("/login", { replace: true });
  };

  const completeOnboarding = async (onboardingData?: any) => {
    setActionLoading(true);
    try {
      // Here you would typically send the onboarding data to your API
      // await submitOnboardingData(onboardingData);

      // Then refresh user to get updated has_completed_onboarding = true
      await loadUser();

      showToast(
        "Welcome to Affinity Echo!",
        "Your profile is complete. Let's get started!",
        "success",
      );

      // After onboarding, redirect based on role
      if (user?.role === "admin" || user?.role === "super_admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      showToast("Something went wrong. Please refresh.", "error");
    } finally {
      setActionLoading(false);
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
        actionLoading,
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
                <svg
                  className="w-7 h-7 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Account Paused
              </h3>
              <p className="text-sm text-gray-600">
                Your account is currently paused. Would you like to reactivate
                it and continue?
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