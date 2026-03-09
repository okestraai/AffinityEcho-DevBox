// src/services/secure-encryption.service.ts
import { getAuthInstance, API_URL } from '../../api/base';

const ENC = `${API_URL}/encryption`;

class SecureEncryptionService {
  async encrypt(data: string): Promise<string> {
    const api = getAuthInstance();
    const res = await api.post(`${ENC}/encrypt/master`, { data });
    const payload = res.data?.data ?? res.data;
    return payload.encryptedData;
  }

  async decrypt(encryptedData: string): Promise<string> {
    const api = getAuthInstance();
    const res = await api.post(`${ENC}/decrypt/master`, { encryptedData });
    const payload = res.data?.data ?? res.data;
    return payload.decryptedData;
  }
}

export const secureEncryptionService = new SecureEncryptionService();
