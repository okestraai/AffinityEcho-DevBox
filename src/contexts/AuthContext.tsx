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
import { showToast } from "../Helper/ShowToast";

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
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
  completeOnboarding: (data?: any) => Promise<void>; // ← NEW METHOD
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const generateUsername = () => {
    const adj = ["Brave", "Quiet", "Rising", "Bold", "True", "Free"];
    const noun = ["Lion", "Eagle", "Wolf", "Fox", "Phoenix", "Bear"];
    const emojis = ["rocket", "fire", "star2", "gem", "crown", "lightning"];
    const num = Math.floor(Math.random() * 9999);
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    return `${adj[Math.floor(Math.random() * adj.length)]}${
      noun[Math.floor(Math.random() * noun.length)]
    }${num}${emoji}`;
  };

  const saveTokens = (access: string, refresh: string) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  };

  const clearAuth = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  const loadUser = async () => {
    try {
      const res = await GetCurrentUser();
      setUser(res.data);
    } catch {
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await loginUser({ email, password });
      saveTokens(data.access_token, data.refresh_token);
      await loadUser();
      showToast("Welcome back!", "success");
      navigate(data.has_completed_onboarding ? "/dashboard" : "/onboarding");
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
      await registerUser({ email, password, username });
      showToast("Check your email for the code!", "success");
      navigate(`/verify-otp?email=${email}`, { replace: true });
    } catch (err: any) {
      showToast(err.response?.data?.message || "Signup failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin = async (provider: "google" | "facebook") => {
    setIsLoading(true);
    try {
      const { data } = await SocialMediaLogin(provider);
      window.location.href = data.url;
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
      navigate(`/reset-password?email=${email}`);
    } catch {
      showToast("If email exists, code sent", "info");
    } finally {
      setIsLoading(false);
    }
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
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      showToast("Something went wrong. Please refresh.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) loadUser();
    else setIsLoading(false);
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
        completeOnboarding, // ← EXPOSED
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
