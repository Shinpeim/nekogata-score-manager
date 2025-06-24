import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { DropboxAuthProvider } from '../dropboxAuth';

// グローバルオブジェクトのモック
global.fetch = vi.fn();

// cryptoのモック
vi.stubGlobal('crypto', {
  getRandomValues: vi.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  subtle: {
    digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
  }
});

// localStorageのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// sessionStorageのモック
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// window.openのモック
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true
});

// import.meta.envのモック
vi.mock('import.meta', () => ({
  env: {
    VITE_DROPBOX_CLIENT_ID: 'test-client-id'
  }
}));

describe('DropboxAuthProvider', () => {
  let authProvider: DropboxAuthProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
    DropboxAuthProvider.resetInstance();
    authProvider = DropboxAuthProvider.getInstance('test-client-id');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DropboxAuthProvider.getInstance();
      const instance2 = DropboxAuthProvider.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should use provided client ID', () => {
      DropboxAuthProvider.resetInstance();
      const provider = DropboxAuthProvider.getInstance('custom-client-id');
      expect(provider).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should initialize successfully with client ID', async () => {
      await authProvider.initialize();
      // 初期化後は再度呼んでも問題ないことを確認
      await authProvider.initialize();
    });

    it('should restore saved tokens from storage', async () => {
      const savedTokens = {
        accessToken: 'saved-token',
        refreshToken: 'saved-refresh-token',
        expiresAt: Date.now() + 3600000
      };
      localStorageMock.setItem('nekogata-dropbox-tokens', JSON.stringify(savedTokens));
      
      await authProvider.initialize();
      expect(authProvider.getAccessToken()).toBe('saved-token');
    });

  });

  describe('isAuthenticated', () => {
    it('should return false when no tokens', () => {
      expect(authProvider.isAuthenticated()).toBe(false);
    });

    it('should return true when valid token exists', async () => {
      const validToken = {
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000
      };
      localStorageMock.setItem('nekogata-dropbox-tokens', JSON.stringify(validToken));
      await authProvider.initialize();
      
      expect(authProvider.isAuthenticated()).toBe(true);
    });

    it('should return false when token is expired', async () => {
      const expiredToken = {
        accessToken: 'expired-token',
        expiresAt: Date.now() - 3600000
      };
      localStorageMock.setItem('nekogata-dropbox-tokens', JSON.stringify(expiredToken));
      await authProvider.initialize();
      
      expect(authProvider.isAuthenticated()).toBe(false);
    });
  });

  describe('hasValidRefreshToken', () => {
    it('should return false when no tokens', () => {
      expect(authProvider.hasValidRefreshToken()).toBe(false);
    });

    it('should return true when refresh token exists', async () => {
      const tokenWithRefresh = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000
      };
      localStorageMock.setItem('nekogata-dropbox-tokens', JSON.stringify(tokenWithRefresh));
      await authProvider.initialize();
      
      expect(authProvider.hasValidRefreshToken()).toBe(true);
    });

    it('should return false when no refresh token', async () => {
      const tokenWithoutRefresh = {
        accessToken: 'access-token',
        expiresAt: Date.now() + 3600000
      };
      localStorageMock.setItem('nekogata-dropbox-tokens', JSON.stringify(tokenWithoutRefresh));
      await authProvider.initialize();
      
      expect(authProvider.hasValidRefreshToken()).toBe(false);
    });

    it('should return true even when access token is expired but refresh token exists', async () => {
      const expiredTokenWithRefresh = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 3600000
      };
      localStorageMock.setItem('nekogata-dropbox-tokens', JSON.stringify(expiredTokenWithRefresh));
      await authProvider.initialize();
      
      expect(authProvider.hasValidRefreshToken()).toBe(true);
      expect(authProvider.isAuthenticated()).toBe(false); // アクセストークンは期限切れ
    });
  });

  describe('authenticate', () => {
    it('should return existing valid token', async () => {
      const validToken = {
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000
      };
      localStorageMock.setItem('nekogata-dropbox-tokens', JSON.stringify(validToken));
      await authProvider.initialize();
      
      const token = await authProvider.authenticate();
      expect(token).toBe('valid-token');
    });

    it('should refresh token when expired but refresh token exists', async () => {
      const expiredToken = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 3600000
      };
      localStorageMock.setItem('nekogata-dropbox-tokens', JSON.stringify(expiredToken));
      await authProvider.initialize();
      
      // リフレッシュトークンのレスポンスモック
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-token',
          token_type: 'bearer',
          expires_in: 3600
        })
      });
      
      const token = await authProvider.authenticate();
      expect(token).toBe('new-token');
    });

    it('should start new auth flow when no valid tokens', async () => {
      await authProvider.initialize();
      
      const mockAuthWindow = {
        closed: false,
        close: vi.fn()
      };
      (window.open as Mock).mockReturnValue(mockAuthWindow);
      
      // 認証フローを開始（Promiseを保持）
      const authPromise = authProvider.authenticate();
      
      // 少し待ってからPKCE stateをチェック
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const pkceStateStr = sessionStorageMock.getItem('nekogata-pkce-state');
      expect(pkceStateStr).toBeTruthy();
      
      const pkceState = JSON.parse(pkceStateStr!);
      
      // 認証成功のメッセージを送信
      const event = new MessageEvent('message', {
        origin: window.location.origin,
        data: {
          type: 'OAUTH_SUCCESS',
          code: 'auth-code',
          state: pkceState.state
        }
      });
      
      // トークン交換のレスポンスモック
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'new-refresh-token'
        })
      });
      
      window.dispatchEvent(event);
      
      const token = await authPromise;
      expect(token).toBe('new-token');
    });

    it('should handle popup blocker', async () => {
      await authProvider.initialize();
      (window.open as Mock).mockReturnValue(null);
      
      await expect(authProvider.authenticate()).rejects.toThrow('ポップアップがブロックされました');
    });

    it('should handle authentication error', async () => {
      await authProvider.initialize();
      
      const mockAuthWindow = { closed: false };
      (window.open as Mock).mockReturnValue(mockAuthWindow);
      
      const authPromise = authProvider.authenticate();
      
      // 少し待ってからエラーメッセージを送信
      setTimeout(() => {
        const event = new MessageEvent('message', {
          origin: window.location.origin,
          data: {
            type: 'OAUTH_ERROR',
            error: 'access_denied'
          }
        });
        window.dispatchEvent(event);
      }, 10);
      
      await expect(authPromise).rejects.toThrow('access_denied');
    });
  });

  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      const validToken = {
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000
      };
      localStorageMock.setItem('nekogata-dropbox-tokens', JSON.stringify(validToken));
      await authProvider.initialize();
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ account_id: 'user123' })
      });
      
      const isValid = await authProvider.validateToken();
      expect(isValid).toBe(true);
    });

    it('should return false and clear tokens for invalid token', async () => {
      const invalidToken = {
        accessToken: 'invalid-token',
        expiresAt: Date.now() + 3600000
      };
      localStorageMock.setItem('nekogata-dropbox-tokens', JSON.stringify(invalidToken));
      await authProvider.initialize();
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 401
      });
      
      const isValid = await authProvider.validateToken();
      expect(isValid).toBe(false);
      expect(authProvider.getAccessToken()).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('nekogata-dropbox-tokens');
    });

    it('should return false when no token exists', async () => {
      await authProvider.initialize();
      const isValid = await authProvider.validateToken();
      expect(isValid).toBe(false);
    });

    it('should handle network errors', async () => {
      const validToken = {
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000
      };
      localStorageMock.setItem('nekogata-dropbox-tokens', JSON.stringify(validToken));
      await authProvider.initialize();
      
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const isValid = await authProvider.validateToken();
      expect(isValid).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should clear tokens and remove from storage', async () => {
      const savedToken = {
        accessToken: 'saved-token',
        expiresAt: Date.now() + 3600000
      };
      localStorageMock.setItem('nekogata-dropbox-tokens', JSON.stringify(savedToken));
      await authProvider.initialize();
      
      authProvider.signOut();
      
      expect(authProvider.getAccessToken()).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('nekogata-dropbox-tokens');
    });
  });

  describe('handleAuthCallback', () => {
    it('should exchange code for tokens', async () => {
      await authProvider.initialize();
      
      const pkceState = {
        codeVerifier: 'test-verifier',
        codeChallenge: 'test-challenge',
        state: 'test-state'
      };
      sessionStorageMock.setItem('nekogata-pkce-state', JSON.stringify(pkceState));
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-token',
          refresh_token: 'new-refresh-token',
          token_type: 'bearer',
          expires_in: 3600
        })
      });
      
      await authProvider.handleAuthCallback('auth-code', 'test-state');
      
      expect(authProvider.getAccessToken()).toBe('new-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'nekogata-dropbox-tokens',
        expect.stringContaining('new-token')
      );
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('nekogata-pkce-state');
    });

    it('should throw error on state mismatch', async () => {
      await authProvider.initialize();
      
      const pkceState = {
        codeVerifier: 'test-verifier',
        codeChallenge: 'test-challenge',
        state: 'test-state'
      };
      sessionStorageMock.setItem('nekogata-pkce-state', JSON.stringify(pkceState));
      
      await expect(authProvider.handleAuthCallback('auth-code', 'wrong-state'))
        .rejects.toThrow('State mismatch');
    });

    it('should throw error when PKCE state not found', async () => {
      await authProvider.initialize();
      
      await expect(authProvider.handleAuthCallback('auth-code', 'test-state'))
        .rejects.toThrow('PKCE state not found');
    });

    it('should handle token exchange error', async () => {
      await authProvider.initialize();
      
      const pkceState = {
        codeVerifier: 'test-verifier',
        codeChallenge: 'test-challenge',
        state: 'test-state'
      };
      sessionStorageMock.setItem('nekogata-pkce-state', JSON.stringify(pkceState));
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code'
        })
      });
      
      await expect(authProvider.handleAuthCallback('auth-code', 'test-state'))
        .rejects.toThrow('Token exchange failed: Invalid authorization code');
    });
  });

  describe('PKCE methods', () => {
    it('should generate valid code verifier', async () => {
      await authProvider.initialize();
      // Private methodのテストは、authenticateを通じて間接的に実行される
      const mockAuthWindow = { closed: false };
      (window.open as Mock).mockReturnValue(mockAuthWindow);
      
      // 認証フローを開始してPKCE stateが生成されることを確認
      authProvider.authenticate().catch(() => {}); // Promiseのエラーは無視
      
      // 少し待ってからチェック
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const pkceStateStr = sessionStorageMock.getItem('nekogata-pkce-state');
      expect(pkceStateStr).toBeTruthy();
      
      const pkceState = JSON.parse(pkceStateStr!);
      expect(pkceState).toHaveProperty('codeVerifier');
      expect(pkceState).toHaveProperty('codeChallenge');
      expect(pkceState).toHaveProperty('state');
    });
  });

  describe('storage operations', () => {
    it('should handle localStorage errors gracefully', async () => {
      // localStorageのsetItemでエラーを発生させる
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });
      
      await authProvider.initialize();
      
      // handleAuthCallbackを直接テスト
      const pkceState = {
        codeVerifier: 'test-verifier',
        codeChallenge: 'test-challenge',
        state: 'test-state'
      };
      sessionStorageMock.setItem('nekogata-pkce-state', JSON.stringify(pkceState));
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-token',
          refresh_token: 'new-refresh-token',
          token_type: 'bearer',
          expires_in: 3600
        })
      });
      
      // エラーが発生してもクラッシュしないことを確認
      await expect(authProvider.handleAuthCallback('auth-code', 'test-state')).resolves.not.toThrow();
    });

    it('should handle corrupted stored tokens', async () => {
      localStorageMock.setItem('nekogata-dropbox-tokens', 'invalid-json');
      await authProvider.initialize();
      
      expect(authProvider.getAccessToken()).toBeNull();
    });
  });
});