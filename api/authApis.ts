// src/api/authApis.ts
import axios from "axios";
import axiosInstance from "../src/Helper/AxiosInterceptor";

const API_URL = import.meta.env.VITE_API_URL;

// Public endpoints (no auth needed)
export const registerUser = async (payload: {
  email: string;
  password: string;
  username: string;
}) => {
  const res = await axios.post(`${API_URL}/auth/signup`, payload);
  return res.data;
};

export const loginUser = async (payload: {
  email: string;
  password: string;
}) => {
  const res = await axios.post(`${API_URL}/auth/login`, payload);
  return res.data;
};

export const SocialMediaLogin = async (provider: "google" | "facebook") => {
  const res = await axios.get(`${API_URL}/auth/login/${provider}`);
  return res.data;
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
  return res.data;
};
export const ForgotPassword = async (email: string) => {
  const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
  return res.data;
};

export const ResendOTP = async (email: string) => {
  const res = await axios.post(`${API_URL}/auth/otp/resend`, { email });
  return res.data;
};

export const VerifyOTP = async (email: string, token: string) => {
  const res = await axios.post(`${API_URL}/auth/otp/verify`, { email, token });
  return res.data;
};

// Authenticated endpoints (use interceptor)
const getAuthInstance = () => {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  return axiosInstance(accessToken, refreshToken);
};

export const GetCurrentUser = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/auth/me`);
  return res.data; // returns full user object
};

export const RefreshToken = async (refreshToken: string) => {
  const res = await axios.post(`${API_URL}/auth/refresh-token`, {
    refreshToken,
  });
  return res.data.data.access_token; // adjust based on actual response
};

export const LogoutUser = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/auth/logout`);
  return res.data;
};

export const UpdateOnboardingProfile = async (payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.put(`${API_URL}/auth/profile`, payload);
  return res.data;
};

export const CreateOnboardingProfile = async (payload: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(
    `${API_URL}/auth/onboarding/complete`,
    payload
  );
  return res.data;
};
export const CreateFoundationForums = async (companyName: any) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/forum/bootstrap/${companyName}`);
  return res.data;
};

export const ChangePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.patch(`${API_URL}/auth/change-password`, payload);
  return res.data;
};

export const CheckOnboardingStatus = async () => {
  const authFetch = getAuthInstance();
  const res = await authFetch.get(`${API_URL}/auth/onboarding/status`);
  return res.data;
};
