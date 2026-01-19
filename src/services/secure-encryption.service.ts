// src/services/secure-encryption.service.ts
class SecureEncryptionService {
  private sessionId: string | null = null;
  private expiresAt: Date | null = null;

  async initializeSession(): Promise<void> {
    try {
      const response = await fetch('/api/v1/api/encryption/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({}), // Empty object for session creation
      });

      if (!response.ok) {
        throw new Error(`Failed to create encryption session: ${response.statusText}`);
      }

      const { sessionId, expiresAt } = await response.json();
      this.sessionId = sessionId;
      this.expiresAt = new Date(expiresAt);
      
      console.log('Encryption session initialized:', { sessionId, expiresAt });
    } catch (error) {
      console.error('Failed to initialize encryption session:', error);
      throw error;
    }
  }

  async encrypt(data: string): Promise<string> {
    try {
      await this.ensureValidSession();

      const requestBody = {
        data: data,
        sessionId: this.sessionId,
      };

      console.log('Sending encrypt request:', requestBody);

      const response = await fetch('/api/v1/api/encryption/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Encryption failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const { encryptedData } = await response.json();
      console.log('Encryption successful, encrypted data length:', encryptedData.length);
      return encryptedData;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    try {
      await this.ensureValidSession();

      const requestBody = {
        encryptedData: encryptedData,
        sessionId: this.sessionId,
      };

      console.log('Sending decrypt request:', { 
        encryptedDataLength: encryptedData.length,
        sessionId: this.sessionId 
      });

      const response = await fetch('/api/v1/api/encryption/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Decryption failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const { decryptedData } = await response.json();
      console.log('Decryption successful, decrypted data:', decryptedData);
      return decryptedData;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }

  async decryptLegacy(encryptedData: string): Promise<string> {
    try {
      const requestBody = {
        encryptedData: encryptedData,
      };

      const response = await fetch('/api/v1/api/encryption/decrypt/legacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Legacy decryption failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const { decryptedData } = await response.json();
      return decryptedData;
    } catch (error) {
      console.error('Legacy decryption failed:', error);
      throw error;
    }
  }

  async checkSession(): Promise<boolean> {
    if (!this.sessionId) return false;

    try {
      const requestBody = {
        sessionId: this.sessionId,
      };

      const response = await fetch('/api/v1/api/encryption/session/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) return false;

      const { valid } = await response.json();
      return valid;
    } catch (error) {
      console.error('Session check failed:', error);
      return false;
    }
  }

  async refreshSession(): Promise<void> {
    if (!this.sessionId) {
      await this.initializeSession();
      return;
    }

    try {
      const requestBody = {
        sessionId: this.sessionId,
      };

      const response = await fetch('/api/v1/api/encryption/session/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh session');
      }

      const { expiresAt } = await response.json();
      this.expiresAt = new Date(expiresAt);
      console.log('Session refreshed, new expiry:', expiresAt);
    } catch (error) {
      console.error('Session refresh failed:', error);
      // If refresh fails, create a new session
      await this.initializeSession();
    }
  }

  private async ensureValidSession(): Promise<void> {
    if (!this.sessionId || !this.expiresAt) {
      await this.initializeSession();
      return;
    }

    // Refresh if session expires in less than 5 minutes
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    if (this.expiresAt <= fiveMinutesFromNow) {
      await this.refreshSession();
    }
  }

  private async getAuthToken(): Promise<string> {
    // Implement your token retrieval logic
    // This could be from localStorage, cookies, or auth context
    const token = localStorage.getItem('auth_token') || '';
    if (!token) {
      console.warn('No auth token found');
    }
    return token;
  }

  // Getter for session ID (useful for debugging)
  getCurrentSessionId(): string | null {
    return this.sessionId;
  }

  // Clear session (for logout)
  clearSession(): void {
    this.sessionId = null;
    this.expiresAt = null;
  }
}

export const secureEncryptionService = new SecureEncryptionService();