interface GoogleAccounts {
  oauth2: {
    initTokenClient(config: {
      client_id: string;
      scope: string;
      callback: (response: TokenResponse) => void;
    }): TokenClient;
    revoke(token: string): void;
  };
}

interface TokenClient {
  requestAccessToken(): void;
  callback: (response: TokenResponse) => void;
}

interface TokenResponse {
  access_token?: string;
  error?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

export class GoogleAuthProvider {
  private static instance: GoogleAuthProvider;
  private tokenClient: TokenClient | null = null;
  private accessToken: string | null = null;
  
  private readonly CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  private readonly SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email';
  
  private constructor() {}
  
  static getInstance(): GoogleAuthProvider {
    if (!GoogleAuthProvider.instance) {
      GoogleAuthProvider.instance = new GoogleAuthProvider();
    }
    return GoogleAuthProvider.instance;
  }
  
  async initialize(): Promise<void> {
    if (!this.CLIENT_ID) {
      throw new Error('Google Client ID not configured');
    }
    
    await this.loadGoogleScript();
    
    this.tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: this.CLIENT_ID,
      scope: this.SCOPES,
      callback: (response: TokenResponse) => {
        if (response.error) {
          throw new Error(response.error);
        }
        this.accessToken = response.access_token || null;
        if (response.access_token) {
          this.saveTokenToStorage(response.access_token);
        }
      },
    });
    
    // 保存済みトークンの復元
    const savedToken = this.getTokenFromStorage();
    if (savedToken) {
      this.accessToken = savedToken;
    }
  }
  
  private async loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }
  
  async authenticate(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.accessToken) {
        resolve(this.accessToken);
        return;
      }
      
      const originalCallback = this.tokenClient!.callback;
      this.tokenClient!.callback = (response: TokenResponse) => {
        originalCallback(response);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.access_token || '');
        }
      };
      
      this.tokenClient?.requestAccessToken();
    });
  }
  
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  async validateToken(): Promise<boolean> {
    if (!this.accessToken) {
      return false;
    }

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        this.accessToken = null;
        this.removeTokenFromStorage();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      this.accessToken = null;
      this.removeTokenFromStorage();
      return false;
    }
  }
  
  signOut(): void {
    if (this.accessToken) {
      window.google?.accounts.oauth2.revoke(this.accessToken);
      this.accessToken = null;
      this.removeTokenFromStorage();
    }
  }
  
  getAccessToken(): string | null {
    return this.accessToken;
  }

  async getUserEmail(): Promise<string | null> {
    if (!this.accessToken) {
      return null;
    }

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.accessToken = null;
          this.removeTokenFromStorage();
          throw new Error('認証が無効です。再度サインインしてください。');
        }
        throw new Error(`ユーザー情報の取得に失敗しました (${response.status})`);
      }

      const userInfo = await response.json();
      return userInfo.email || null;
    } catch (error) {
      console.error('Error fetching user email:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('ユーザー情報の取得中にエラーが発生しました');
    }
  }
  
  private saveTokenToStorage(token: string): void {
    sessionStorage.setItem('nekogata-google-token', token);
  }
  
  private getTokenFromStorage(): string | null {
    return sessionStorage.getItem('nekogata-google-token');
  }
  
  private removeTokenFromStorage(): void {
    sessionStorage.removeItem('nekogata-google-token');
  }
}