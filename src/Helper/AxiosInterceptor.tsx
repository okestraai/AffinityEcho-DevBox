// src/lib/AxiosInterceptor.tsx
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { webSocketService } from '../services/websocket.service';
import { TokenUtils } from '../utils/tokenUtils';
import { sessionSync } from '../utils/tabSync';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Ends a sign-in the server no longer accepts: clears it here, tells the other tabs and shows the login form.
const endSessionAndGoToLogin = () => {
  TokenUtils.clearTokens();
  sessionSync.broadcastLogout();
  if (window.location.pathname !== '/login') window.location.href = '/login';
};

// Sign-in calls answer 401 for a wrong password or code, which the form shows; they never end the session.
const isAuthCall = (url: string | undefined) => !!url && /\/auth\//.test(url);

const AxiosInterceptor = (
  accessToken: string | null,
  refreshToken: string | null
): AxiosInstance => {
  const instance = axios.create({
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
  });

  // Request Interceptor
  instance.interceptors.request.use(
    (config) => {
      // The stored token is the current one; after a refresh it is newer than the one this client was made with,
      // so a retried request goes out with the fresh token instead of the expired one.
      const current = TokenUtils.getAccessToken() ?? accessToken;
      if (current) {
        config.headers.Authorization = `Bearer ${current}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
        originalRequest._retry = true;

        if (isRefreshing) {
          // Queue request while refreshing
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return instance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        isRefreshing = true;

        try {
          const newAccessToken = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
            { refreshToken }
          );

          const token = newAccessToken.data?.data?.access_token ?? newAccessToken.data?.access_token;

          // Save refreshed token to cookies
          TokenUtils.setTokens(token, refreshToken);

          // Reconnect WebSocket with the fresh token
          if (webSocketService.isConnected()) {
            webSocketService.reconnectWithFreshToken();
          }

          processQueue(null, token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);

          endSessionAndGoToLogin();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Still refused with no way to refresh, or after a refresh: the sign-in is over, so go to the login form
      // instead of leaving the page on "not authenticated".
      if (error.response?.status === 401 && accessToken && !isAuthCall(originalRequest?.url)) {
        endSessionAndGoToLogin();
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export default AxiosInterceptor;