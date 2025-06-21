// PKCE関連の型定義
interface PKCEState {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

// OAuth 2.0レスポンスの型定義
interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface OAuthErrorResponse {
  error: string;
  error_description?: string;
}

// 保存される認証情報の型定義
interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// Global window interface (削除予定: 不要になったら削除)
declare global {
  interface Window {
    google?: {
      accounts: unknown;
    };
  }
}

export class GoogleAuthProvider {
  private static instance: GoogleAuthProvider;
  private tokens: AuthTokens | null = null;
  private isInitialized = false;
  
  private readonly CLIENT_ID: string;
  private readonly SCOPES = 'https://www.googleapis.com/auth/drive.file';
  private readonly REDIRECT_URI = `${window.location.origin}/auth/callback`;
  
  // OAuth 2.0エンドポイント
  private readonly AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private readonly TOKEN_INFO_URL = 'https://www.googleapis.com/oauth2/v1/tokeninfo';
  
  private constructor(clientId?: string) {
    this.CLIENT_ID = clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  }
  
  static getInstance(clientId?: string): GoogleAuthProvider {
    if (!GoogleAuthProvider.instance) {
      GoogleAuthProvider.instance = new GoogleAuthProvider(clientId);
    }
    return GoogleAuthProvider.instance;
  }

  // テスト用のインスタンスリセットメソッド
  static resetInstance(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    GoogleAuthProvider.instance = undefined as any;
  }
  
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    if (!this.CLIENT_ID) {
      throw new Error('Google Client ID not configured');
    }
    
    // 保存済みトークンの復元
    const savedTokens = this.getTokensFromStorage();
    if (savedTokens) {
      this.tokens = savedTokens;
    }
    
    this.isInitialized = true;
  }

  // PKCEユーティリティメソッド
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  
  async authenticate(): Promise<string> {
    // 有効なアクセストークンがある場合はそれを返す
    if (this.tokens && this.isTokenValid()) {
      return this.tokens.accessToken;
    }
    
    // リフレッシュトークンがある場合は自動更新を試す
    if (this.tokens?.refreshToken) {
      try {
        await this.refreshAccessToken();
        return this.tokens.accessToken;
      } catch (error) {
        console.warn('Token refresh failed, starting new authentication flow:', error);
        // リフレッシュに失敗した場合は新しい認証フローを開始
        this.tokens = null;
        this.removeTokensFromStorage();
      }
    }
    
    // 新しい認証フローを開始
    return this.startAuthFlow();
  }

  private async startAuthFlow(): Promise<string> {
    const pkceState = await this.generatePKCEState();
    
    return new Promise((resolve, reject) => {
      
      // PKCE状態を一時保存
      sessionStorage.setItem('nekogata-pkce-state', JSON.stringify(pkceState));
      
      // 認証URLを構築
      const authUrl = this.buildAuthUrl(pkceState);
      
      // 認証コールバックリスナーを設定
      const handleAuthCallback = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }
        
        if (event.data.type === 'OAUTH_SUCCESS') {
          window.removeEventListener('message', handleAuthCallback);
          try {
            // 認証コードをトークンに交換
            await this.handleAuthCallback(event.data.code, event.data.state);
            resolve(this.tokens!.accessToken);
          } catch (error) {
            reject(error);
          }
        } else if (event.data.type === 'OAUTH_ERROR') {
          window.removeEventListener('message', handleAuthCallback);
          reject(new Error(event.data.error));
        }
      };
      
      window.addEventListener('message', handleAuthCallback);
      
      // 新しいウィンドウで認証を開始
      const authWindow = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!authWindow) {
        window.removeEventListener('message', handleAuthCallback);
        reject(new Error('Failed to open authentication window'));
        return;
      }
      
      // ウィンドウが閉じられた場合の処理
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleAuthCallback);
          reject(new Error('Authentication window was closed'));
        }
      }, 1000);
    });
  }

  private async generatePKCEState(): Promise<PKCEState> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();
    return {
      codeVerifier,
      codeChallenge,
      state,
    };
  }

  private buildAuthUrl(pkceState: PKCEState): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      scope: this.SCOPES,
      state: pkceState.state,
      code_challenge: pkceState.codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'consent',
    });
    
    return `${this.AUTH_URL}?${params.toString()}`;
  }
  
  isAuthenticated(): boolean {
    return !!(this.tokens && this.isTokenValid());
  }

  private isTokenValid(): boolean {
    if (!this.tokens) {
      return false;
    }
    
    // トークンの有効期限をチェック（5分のマージンを持たせる）
    const now = Date.now();
    const expiresWithMargin = this.tokens.expiresAt - (5 * 60 * 1000);
    
    return now < expiresWithMargin;
  }

  async validateToken(): Promise<boolean> {
    if (!this.tokens?.accessToken) {
      return false;
    }

    try {
      const response = await fetch(this.TOKEN_INFO_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        this.tokens = null;
        this.removeTokensFromStorage();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      this.tokens = null;
      this.removeTokensFromStorage();
      return false;
    }
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(this.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData: OAuthErrorResponse = await response.json();
        throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`);
      }

      const tokenData: OAuthTokenResponse = await response.json();
      
      // 新しいトークン情報を保存
      this.tokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || this.tokens.refreshToken, // 新しいリフレッシュトークンがない場合は既存のものを保持
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
      };

      this.saveTokensToStorage(this.tokens);
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      // リフレッシュに失敗した場合はトークンをクリア
      this.tokens = null;
      this.removeTokensFromStorage();
      throw error;
    }
  }
  
  signOut(): void {
    if (this.tokens?.accessToken) {
      // Googleへのリボーク要求
      fetch(`https://oauth2.googleapis.com/revoke?token=${this.tokens.accessToken}`, {
        method: 'POST',
      }).catch(error => {
        console.warn('Failed to revoke token:', error);
      });
      
      this.tokens = null;
      this.removeTokensFromStorage();
    }
  }
  
  getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  // 認証コールバック処理（新しいウィンドウから呼ばれる）
  async handleAuthCallback(code: string, state: string): Promise<void> {
    const savedPkceState = sessionStorage.getItem('nekogata-pkce-state');
    if (!savedPkceState) {
      throw new Error('PKCE state not found');
    }

    const pkceState: PKCEState = JSON.parse(savedPkceState);
    
    if (pkceState.state !== state) {
      throw new Error('State mismatch');
    }

    // 認証コードをアクセストークンに交換
    const tokenResponse = await this.exchangeCodeForTokens(code, pkceState.codeVerifier);
    
    // トークンを保存
    this.tokens = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
    };

    this.saveTokensToStorage(this.tokens);
    
    // PKCE状態をクリア
    sessionStorage.removeItem('nekogata-pkce-state');
  }

  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<OAuthTokenResponse> {
    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: this.REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const errorData: OAuthErrorResponse = await response.json();
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
    }

    return response.json();
  }
  
  private saveTokensToStorage(tokens: AuthTokens): void {
    localStorage.setItem('nekogata-auth-tokens', JSON.stringify(tokens));
  }
  
  private getTokensFromStorage(): AuthTokens | null {
    const tokensJson = localStorage.getItem('nekogata-auth-tokens');
    if (!tokensJson) {
      return null;
    }
    
    try {
      return JSON.parse(tokensJson);
    } catch (error) {
      console.error('Failed to parse stored tokens:', error);
      return null;
    }
  }
  
  private removeTokensFromStorage(): void {
    localStorage.removeItem('nekogata-auth-tokens');
    // 旧形式のトークンストレージもクリア
    localStorage.removeItem('nekogata-google-token');
  }
}