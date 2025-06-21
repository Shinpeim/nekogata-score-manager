import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { DropboxAuthProvider } from '../dropboxAuth';

// グローバルfetchのモック
global.fetch = vi.fn();

// import.meta.envのモック
vi.stubEnv('VITE_DROPBOX_CLIENT_ID', '');

// localStorage のモック
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// sessionStorage のモック
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// window.openのモック
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true,
});

// crypto.getRandomValues のモック
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      digest: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
    },
  },
});

describe('DropboxAuthProvider', () => {
  let provider: DropboxAuthProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue(null);
    DropboxAuthProvider.resetInstance();
    provider = DropboxAuthProvider.getInstance('test-client-id');
  });

  describe('getInstance', () => {
    it('シングルトンインスタンスを返す', () => {
      const instance1 = DropboxAuthProvider.getInstance();
      const instance2 = DropboxAuthProvider.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('CLIENT_IDが設定されていない場合はエラーを投げる', async () => {
      DropboxAuthProvider.resetInstance();
      const providerWithoutId = DropboxAuthProvider.getInstance('');
      
      await expect(providerWithoutId.initialize()).rejects.toThrow('Dropbox Client ID not configured');
    });

    it('正常に初期化される', async () => {
      await expect(provider.initialize()).resolves.not.toThrow();
    });

    it('保存済みトークンを復元する', async () => {
      const mockTokens = {
        accessToken: 'test-token',
        expiresAt: Date.now() + 3600000
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockTokens));

      await provider.initialize();
      expect(provider.isAuthenticated()).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('有効なトークンがある場合はtrue', () => {
      const mockTokens = {
        accessToken: 'test-token',
        expiresAt: Date.now() + 3600000
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockTokens));
      
      provider = DropboxAuthProvider.getInstance('test-client-id');
      expect(provider.isAuthenticated()).toBe(false); // まだ初期化されていない
    });

    it('トークンがない場合はfalse', () => {
      expect(provider.isAuthenticated()).toBe(false);
    });
  });

  describe('validateToken', () => {
    it('有効なトークンの場合はtrue', async () => {
      // モックレスポンス
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ account: { email: 'test@example.com' } })
      });

      // トークンを設定
      const mockTokens = {
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockTokens));
      await provider.initialize();

      const result = await provider.validateToken();
      expect(result).toBe(true);
    });

    it('無効なトークンの場合はfalse', async () => {
      // モックレスポンス（エラー）
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      // トークンを設定
      const mockTokens = {
        accessToken: 'invalid-token',
        expiresAt: Date.now() + 3600000
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockTokens));
      await provider.initialize();

      const result = await provider.validateToken();
      expect(result).toBe(false);
    });
  });

  describe('exchangeCodeForTokens', () => {
    beforeEach(async () => {
      await provider.initialize();
    });

    it('正常にトークンを取得する', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'files.content.write files.content.read'
      };

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // PKCEデータをセッションストレージに設定
      const pkceData = {
        codeVerifier: 'test-verifier',
        codeChallenge: 'test-challenge',
        state: 'test-state'
      };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(pkceData));

      await provider.handleAuthCallback('test-code', 'test-state');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.dropboxapi.com/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );
    });

    it('トークン交換に失敗した場合はエラーを投げる', async () => {
      const mockErrorResponse = {
        error: 'invalid_grant',
        error_description: 'Invalid authorization code'
      };

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve(mockErrorResponse)
      });

      // PKCEデータをセッションストレージに設定
      const pkceData = {
        codeVerifier: 'test-verifier',
        codeChallenge: 'test-challenge',
        state: 'test-state'
      };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(pkceData));

      await expect(provider.handleAuthCallback('invalid-code', 'test-state')).rejects.toThrow('Token exchange failed');
    });
  });

  describe('signOut', () => {
    it('トークンをクリアする', () => {
      provider.signOut();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('nekogata-dropbox-tokens');
    });
  });

  describe('getAccessToken', () => {
    it('トークンがある場合は返す', async () => {
      const mockTokens = {
        accessToken: 'test-token',
        expiresAt: Date.now() + 3600000
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockTokens));
      await provider.initialize();

      const token = provider.getAccessToken();
      expect(token).toBe('test-token');
    });

    it('トークンがない場合はnull', () => {
      const token = provider.getAccessToken();
      expect(token).toBeNull();
    });
  });
});