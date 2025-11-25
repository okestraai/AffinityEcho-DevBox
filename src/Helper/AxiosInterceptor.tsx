// src/lib/AxiosInterceptor.tsx
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const AxiosInterceptor = (
  accessToken: string | null,
  refreshToken: string | null
): AxiosInstance => {
  const instance = axios.create({
    withCredentials: true,
  });

  // Request Interceptor
  instance.interceptors.request.use(
    (config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
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

          const token = newAccessToken.data.data.access_token;
          localStorage.setItem('access_token', token);

          processQueue(null, token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export default AxiosInterceptor;