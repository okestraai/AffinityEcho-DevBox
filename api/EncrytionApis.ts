// api/EncrytionApis.ts
import { getAuthInstance, API_URL, unwrap } from "./base";


export const EncryptData = async (data: string | object) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/encryption/encrypt/master`, data);
  return unwrap(res);
};

export const DecryptData = async (encryptedData: string | object) => {
  const authFetch = getAuthInstance();
  const res = await authFetch.post(`${API_URL}/encryption/decrypt/master`, encryptedData);
  return unwrap(res);
};