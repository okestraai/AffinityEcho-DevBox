import axiosInstance from "../src/Helper/AxiosInterceptor";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthInstance = () => {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  return axiosInstance(accessToken, refreshToken);
};


export const EncryptData = async (data: string | object) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/encryption/encrypt/master`, data);
  return res.data;
};

export const DecryptData = async (encryptedData: string | object) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/encryption/decrypt/master`, encryptedData);
  return res.data;
};