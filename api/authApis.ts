// api/authApis.ts
import axios from "axios";
import { getAuthInstance, API_URL, unwrap } from "./base";

// Public endpoints (no auth needed)
export const registerUser = async (payload: {
  email: string;
  password: string;
  username: string;
}) => {
  const res = await axios.post(`${API_URL}/auth/signup`, payload);
  return unwrap(res);
};

export const loginUser = async (payload: {
  email: string;
  password: string;
}) => {
  const res = await axios.post(`${API_URL}/auth/login`, payload);
  return unwrap(res);
};

export const SocialMediaLogin = async (provider: "google" | "facebook") => {
  const res = await axios.get(`${API_URL}/auth/login/${provider}`);
  return unwrap(res);
};

export const ResetPassword = async (
  email: string,
  password: string,
  otp: string
) => {
  const res = await axios.post(`${API_URL}/auth/reset-password`, {
    email,
    password,
    otp,
  });
  return unwrap(res);
};
export const ForgotPassword = async (email: string) => {
  const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
  return unwrap(res);
};

export const ResendOTP = async (email: string) => {
  const res = await axios.post(`${API_URL}/auth/otp/resend`, { email });
  return unwrap(res);
};

export const VerifyOTP = async (email: string, token: string) => {
  const res = await axios.post(`${API_URL}/auth/otp/verify`, { email, token });
  return unwrap(res);
};

// Authenticated endpoints (use interceptor)
export const GetCurrentUser = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/auth/me`);
  return unwrap(res);
};

export const RefreshToken = async (refreshToken: string) => {
  const res = await axios.post(`${API_URL}/auth/refresh-token`, {
    refreshToken,
  });
  return unwrap(res).access_token;
};

export const LogoutUser = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/auth/logout`);
  return unwrap(res);
};

export const UpdateOnboardingProfile = async (payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.put(`${API_URL}/auth/profile`, payload);
  return unwrap(res);
};

export const CreateOnboardingProfile = async (payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/auth/onboarding/complete`,
    payload
  );
  return unwrap(res);
};
export const CreateFoundationForums = async (companyName: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/forum/bootstrap/${companyName}`);
  return unwrap(res);
};

export const ChangePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.patch(`${API_URL}/auth/change-password`, payload);
  return unwrap(res);
};

export const CheckOnboardingStatus = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/auth/onboarding/status`);
  return unwrap(res);
};
