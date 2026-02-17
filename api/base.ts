// api/base.ts — Shared API utilities
import axiosInstance from "../src/Helper/AxiosInterceptor";
import { TokenUtils } from "../src/utils/tokenUtils";

export const API_URL = import.meta.env.VITE_API_URL;

export const getAuthInstance = () => {
  const accessToken = TokenUtils.getAccessToken();
  const refreshToken = TokenUtils.getRefreshToken();
  return axiosInstance(accessToken, refreshToken);
};

// Unwrap double-wrapped response: { success, data: { success, data } } → inner data
export const unwrap = (res: { data: any }) => res.data?.data ?? res.data;
