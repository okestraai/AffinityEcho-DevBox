// api/EncrytionApis.ts
import { getAuthInstance, API_URL } from "./base";


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