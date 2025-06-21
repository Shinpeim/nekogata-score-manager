import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GoogleAuthProvider } from '../googleAuth';

// モック設定
const mockFetch = vi.fn();
global.fetch = mockFetch;

// crypto.getRandomValues のモック
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
});

// btoa のモック
global.btoa = vi.fn((str: string) => Buffer.from(str, 'binary').toString('base64'));

// sessionStorage と localStorage のモック
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// window.open のモック
const mockWindow = {
  closed: false,
  close: vi.fn(),
};
global.window.open = vi.fn().mockReturnValue(mockWindow);


describe('GoogleAuthProvider', () => {
  let authProvider: GoogleAuthProvider;

  beforeEach(() => {
    // シングルトンのリセット
    GoogleAuthProvider.resetInstance();
    authProvider = GoogleAuthProvider.getInstance('test-client-id');
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    sessionStorageMock.removeItem.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('initialize', () => {
    it('CLIENT_IDが設定されていない場合エラーを投げる', async () => {
      GoogleAuthProvider.resetInstance();
      const provider = GoogleAuthProvider.getInstance(''); // 空のクライアントID
      
      await expect(provider.initialize()).rejects.toThrow('Google Client ID not configured');
    });

    it('正常に初期化される', async () => {
      GoogleAuthProvider.resetInstance();
      const provider = GoogleAuthProvider.getInstance('test-client-id');
      
      await expect(provider.initialize()).resolves.not.toThrow();
    });

    it('保存されたトークンを復元する', async () => {
      const savedTokens = {
        accessToken: 'saved-token',
        refreshToken: 'saved-refresh-token',
        expiresAt: Date.now() + 3600000, // 1時間後
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedTokens));
      GoogleAuthProvider.resetInstance();
      const provider = GoogleAuthProvider.getInstance('test-client-id');
      
      await provider.initialize();
      
      expect(provider.getAccessToken()).toBe('saved-token');
    });
  });

  describe('isAuthenticated', () => {
    it('有効なトークンがある場合trueを返す', async () => {
      const tokens = {
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000, // 1時間後
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(tokens));
      GoogleAuthProvider.resetInstance();
      const provider = GoogleAuthProvider.getInstance('test-client-id');
      
      await provider.initialize();
      
      expect(provider.isAuthenticated()).toBe(true);
    });

    it('期限切れのトークンの場合falseを返す', async () => {
      const tokens = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 3600000, // 1時間前（期限切れ）
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(tokens));
      GoogleAuthProvider.resetInstance();
      const provider = GoogleAuthProvider.getInstance('test-client-id');
      
      await provider.initialize();
      
      expect(provider.isAuthenticated()).toBe(false);
    });

    it('トークンがない場合falseを返す', () => {
      expect(authProvider.isAuthenticated()).toBe(false);
    });
  });

  describe('refreshAccessToken', () => {
    it('リフレッシュトークンが成功する', async () => {
      const initialTokens = {
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 1000, // 期限切れ
      };

      const newTokenResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'https://www.googleapis.com/auth/drive.file',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTokens));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newTokenResponse),
      });

      GoogleAuthProvider.resetInstance();
      const provider = GoogleAuthProvider.getInstance('test-client-id');
      await provider.initialize();
      
      await provider.refreshAccessToken();
      
      expect(provider.getAccessToken()).toBe('new-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'nekogata-auth-tokens',
        expect.stringContaining('new-access-token')
      );
    });

    it('リフレッシュトークンがない場合エラーを投げる', async () => {
      // トークンが保存されていない状態でテスト
      localStorageMock.getItem.mockReturnValue(null);
      
      GoogleAuthProvider.resetInstance();
      const provider = GoogleAuthProvider.getInstance('test-client-id');
      await provider.initialize();
      
      await expect(provider.refreshAccessToken()).rejects.toThrow('No refresh token available');
    });

    it('リフレッシュが失敗した場合トークンをクリアする', async () => {
      const initialTokens = {
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 1000,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTokens));
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'invalid_grant' }),
      });

      GoogleAuthProvider.resetInstance();
      const provider = GoogleAuthProvider.getInstance('test-client-id');
      await provider.initialize();
      
      await expect(provider.refreshAccessToken()).rejects.toThrow();
      expect(provider.getAccessToken()).toBeNull();
    });
  });

  describe('validateToken', () => {
    it('有効なトークンの場合trueを返す', async () => {
      const tokens = {
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(tokens));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ aud: 'test-client-id' }),
      });

      GoogleAuthProvider.resetInstance();
      const provider = GoogleAuthProvider.getInstance('test-client-id');
      await provider.initialize();
      
      const isValid = await provider.validateToken();
      
      expect(isValid).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v1/tokeninfo',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
          }),
        })
      );
    });

    it('無効なトークンの場合falseを返しトークンをクリアする', async () => {
      const tokens = {
        accessToken: 'invalid-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(tokens));
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      GoogleAuthProvider.resetInstance();
      const provider = GoogleAuthProvider.getInstance('test-client-id');
      await provider.initialize();
      
      const isValid = await provider.validateToken();
      
      expect(isValid).toBe(false);
      expect(provider.getAccessToken()).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('nekogata-auth-tokens');
    });
  });

  describe('signOut', () => {
    it('トークンをリボークしローカルストレージをクリアする', async () => {
      const tokens = {
        accessToken: 'token-to-revoke',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(tokens));
      mockFetch.mockResolvedValueOnce({ ok: true });

      GoogleAuthProvider.resetInstance();
      const provider = GoogleAuthProvider.getInstance('test-client-id');
      await provider.initialize();
      
      provider.signOut();
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/revoke?token=token-to-revoke',
        { method: 'POST' }
      );
      expect(provider.getAccessToken()).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('nekogata-auth-tokens');
    });
  });
});