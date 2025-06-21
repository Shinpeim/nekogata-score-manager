import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useSyncStore } from '../syncStore';
import { SyncManager } from '../../utils/sync/syncManager';
import type { ChordChart } from '../../types';
import type { SyncResult } from '../../types/sync';

// SyncManagerのモック
vi.mock('../../utils/sync/syncManager', () => ({
  SyncManager: {
    getInstance: vi.fn()
  }
}));

// localStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('syncStore', () => {
  let mockSyncManager: {
    initialize: ReturnType<typeof vi.fn>;
    authenticate: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    sync: ReturnType<typeof vi.fn>;
    isAuthenticated: ReturnType<typeof vi.fn>;
    getConfig: ReturnType<typeof vi.fn>;
    saveConfig: ReturnType<typeof vi.fn>;
    getLastSyncTimeAsDate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // モックSyncManagerインスタンスの作成
    mockSyncManager = {
      initialize: vi.fn(),
      authenticate: vi.fn(),
      signOut: vi.fn(),
      sync: vi.fn(),
      isAuthenticated: vi.fn(),
      getConfig: vi.fn(),
      saveConfig: vi.fn(),
      getLastSyncTimeAsDate: vi.fn()
    };

    // SyncManager.getInstanceがモックインスタンスを返すように設定
    vi.mocked(SyncManager.getInstance).mockReturnValue(mockSyncManager as unknown as SyncManager);

    // localStorageのモック初期化
    localStorageMock.getItem.mockReturnValue(null);
    
    // ストアの初期化
    useSyncStore.setState({
      syncManager: null,
      isSyncing: false,
      lastSyncTime: null,
      syncError: null,
      syncConfig: {
        autoSync: false,
        showConflictWarning: true
      }
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      const state = useSyncStore.getState();
      
      expect(state.syncManager).toBeNull();
      expect(state.isSyncing).toBe(false);
      expect(state.lastSyncTime).toBeNull();
      expect(state.syncError).toBeNull();
      expect(state.syncConfig).toEqual({
        autoSync: false,
        showConflictWarning: true
      });
    });
  });

  describe('initializeSync', () => {
    it('正常に初期化される', async () => {
      const mockConfig = {
        autoSync: true,
        showConflictWarning: false
      };
      const mockLastSyncTime = new Date('2023-01-01T00:00:00Z');

      mockSyncManager.initialize.mockResolvedValue(undefined);
      mockSyncManager.getConfig.mockReturnValue(mockConfig);
      mockSyncManager.getLastSyncTimeAsDate.mockReturnValue(mockLastSyncTime);

      await useSyncStore.getState().initializeSync();

      expect(mockSyncManager.initialize).toHaveBeenCalledTimes(1);
      expect(mockSyncManager.getConfig).toHaveBeenCalledTimes(1);
      expect(mockSyncManager.getLastSyncTimeAsDate).toHaveBeenCalledTimes(1);

      const state = useSyncStore.getState();
      expect(state.syncManager).toBe(mockSyncManager);
      expect(state.syncConfig).toEqual(mockConfig);
      expect(state.lastSyncTime).toEqual(mockLastSyncTime);
      expect(state.syncError).toBeNull();
    });

    it('初期化エラー時にエラー状態が設定される', async () => {
      const errorMessage = '初期化に失敗しました';
      mockSyncManager.initialize.mockRejectedValue(new Error(errorMessage));

      await useSyncStore.getState().initializeSync();

      const state = useSyncStore.getState();
      expect(state.syncError).toBe(errorMessage);
      expect(state.syncManager).toBeNull();
    });

    it('最終同期時刻が0の場合はnullが設定される', async () => {
      const mockConfig = {
        autoSync: false,
        showConflictWarning: true
      };
      const mockLastSyncTime = new Date(0);

      mockSyncManager.initialize.mockResolvedValue(undefined);
      mockSyncManager.getConfig.mockReturnValue(mockConfig);
      mockSyncManager.getLastSyncTimeAsDate.mockReturnValue(mockLastSyncTime);

      await useSyncStore.getState().initializeSync();

      const state = useSyncStore.getState();
      expect(state.lastSyncTime).toBeNull();
    });
  });

  describe('authenticate', () => {
    beforeEach(async () => {
      mockSyncManager.initialize.mockResolvedValue(undefined);
      mockSyncManager.getConfig.mockReturnValue({
        autoSync: false,
        showConflictWarning: true
      });
      mockSyncManager.getLastSyncTimeAsDate.mockReturnValue(new Date());
      
      await useSyncStore.getState().initializeSync();
    });

    it('正常に認証される', async () => {
      mockSyncManager.authenticate.mockResolvedValue(undefined);

      await useSyncStore.getState().authenticate();

      expect(mockSyncManager.authenticate).toHaveBeenCalledTimes(1);
      
      const state = useSyncStore.getState();
      expect(state.syncError).toBeNull();
    });

    it('syncManagerが未初期化の場合エラーが発生する', async () => {
      // syncManagerをnullに設定
      useSyncStore.setState({ syncManager: null });

      await expect(useSyncStore.getState().authenticate()).rejects.toThrow('同期機能が初期化されていません');
    });

    it('認証エラー時にエラー状態が設定される', async () => {
      const errorMessage = '認証に失敗しました';
      mockSyncManager.authenticate.mockRejectedValue(new Error(errorMessage));

      await expect(useSyncStore.getState().authenticate()).rejects.toThrow(errorMessage);

      const state = useSyncStore.getState();
      expect(state.syncError).toBe(errorMessage);
    });
  });

  describe('signOut', () => {
    beforeEach(async () => {
      mockSyncManager.initialize.mockResolvedValue(undefined);
      mockSyncManager.getConfig.mockReturnValue({
        autoSync: false,
        showConflictWarning: true
      });
      mockSyncManager.getLastSyncTimeAsDate.mockReturnValue(new Date());
      
      await useSyncStore.getState().initializeSync();
    });

    it('正常にサインアウトされる', async () => {
      mockSyncManager.signOut.mockResolvedValue(undefined);

      await useSyncStore.getState().signOut();

      expect(mockSyncManager.signOut).toHaveBeenCalledTimes(1);
      
      const state = useSyncStore.getState();
      expect(state.syncError).toBeNull();
    });

    it('syncManagerがnullの場合何もしない', async () => {
      useSyncStore.setState({ syncManager: null });

      await useSyncStore.getState().signOut();

      expect(mockSyncManager.signOut).not.toHaveBeenCalled();
    });

    it('サインアウトエラー時にエラー状態が設定される', async () => {
      const errorMessage = 'サインアウトに失敗しました';
      mockSyncManager.signOut.mockRejectedValue(new Error(errorMessage));

      await expect(useSyncStore.getState().signOut()).rejects.toThrow(errorMessage);

      const state = useSyncStore.getState();
      expect(state.syncError).toBe(errorMessage);
    });
  });

  describe('sync', () => {
    const mockCharts: ChordChart[] = [
      {
        id: 'chart1',
        title: 'Test Chart 1',
        artist: 'Artist 1',
        key: 'C',
        timeSignature: '4/4',
        sections: [],
        tags: [],
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'chart2',
        title: 'Test Chart 2',
        artist: 'Artist 2',
        key: 'G',
        timeSignature: '4/4',
        sections: [],
        tags: [],
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    beforeEach(async () => {
      mockSyncManager.initialize.mockResolvedValue(undefined);
      mockSyncManager.getConfig.mockReturnValue({
        autoSync: false,
        showConflictWarning: true
      });
      mockSyncManager.getLastSyncTimeAsDate.mockReturnValue(new Date());
      
      await useSyncStore.getState().initializeSync();
    });

    it('正常に同期される', async () => {
      const mockResult: SyncResult = {
        success: true,
        conflicts: [],
        syncedCharts: ['chart1', 'chart2'],
        errors: []
      };
      const mockLastSyncTime = new Date('2023-01-01T12:00:00Z');

      mockSyncManager.sync.mockResolvedValue(mockResult);
      mockSyncManager.getLastSyncTimeAsDate.mockReturnValue(mockLastSyncTime);

      const result = await useSyncStore.getState().sync(mockCharts);

      expect(mockSyncManager.sync).toHaveBeenCalledWith(mockCharts, undefined);
      expect(result).toEqual(mockResult);

      const state = useSyncStore.getState();
      expect(state.isSyncing).toBe(false);
      expect(state.lastSyncTime).toEqual(mockLastSyncTime);
      expect(state.syncError).toBeNull();
    });

    it('コンフリクトコールバック付きで同期される', async () => {
      const mockResult: SyncResult = {
        success: true,
        conflicts: [],
        syncedCharts: ['chart1'],
        errors: []
      };
      const onConflict = vi.fn().mockResolvedValue('overwrite' as const);

      mockSyncManager.sync.mockResolvedValue(mockResult);
      mockSyncManager.getLastSyncTimeAsDate.mockReturnValue(new Date());

      await useSyncStore.getState().sync(mockCharts, onConflict);

      expect(mockSyncManager.sync).toHaveBeenCalledWith(mockCharts, onConflict);
    });

    it('同期失敗時にエラー状態が設定される', async () => {
      const mockResult: SyncResult = {
        success: false,
        conflicts: [],
        syncedCharts: [],
        errors: [
          {
            chartId: 'chart1',
            error: new Error('同期エラー'),
            type: 'network'
          }
        ]
      };

      mockSyncManager.sync.mockResolvedValue(mockResult);

      const result = await useSyncStore.getState().sync(mockCharts);

      expect(result).toEqual(mockResult);

      const state = useSyncStore.getState();
      expect(state.isSyncing).toBe(false);
      expect(state.syncError).toBe('同期エラー');
    });

    it('syncManagerが未初期化の場合エラーが発生する', async () => {
      useSyncStore.setState({ syncManager: null });

      await expect(useSyncStore.getState().sync(mockCharts)).rejects.toThrow('同期機能が初期化されていません');
    });
  });

  describe('設定管理', () => {
    beforeEach(async () => {
      mockSyncManager.initialize.mockResolvedValue(undefined);
      mockSyncManager.getConfig.mockReturnValue({
        autoSync: false,
        showConflictWarning: true
      });
      mockSyncManager.getLastSyncTimeAsDate.mockReturnValue(new Date());
      
      await useSyncStore.getState().initializeSync();
    });

    it('設定が正常に更新される', () => {
      const configUpdate = { autoSync: true };

      useSyncStore.getState().updateSyncConfig(configUpdate);

      expect(mockSyncManager.saveConfig).toHaveBeenCalledWith({
        autoSync: true,
        showConflictWarning: true
      });

      const state = useSyncStore.getState();
      expect(state.syncConfig.autoSync).toBe(true);
    });

    it('syncManagerがnullの場合でも設定は更新される', () => {
      useSyncStore.setState({ syncManager: null });
      
      const configUpdate = { autoSync: true };
      useSyncStore.getState().updateSyncConfig(configUpdate);

      expect(mockSyncManager.saveConfig).not.toHaveBeenCalled();

      const state = useSyncStore.getState();
      expect(state.syncConfig.autoSync).toBe(true);
    });
  });

  describe('ユーティリティ', () => {
    beforeEach(async () => {
      mockSyncManager.initialize.mockResolvedValue(undefined);
      mockSyncManager.getConfig.mockReturnValue({
        autoSync: false,
        showConflictWarning: true
      });
      mockSyncManager.getLastSyncTimeAsDate.mockReturnValue(new Date());
      
      await useSyncStore.getState().initializeSync();
    });

    it('認証状態が正しく取得される', () => {
      // 認証状態をセット
      useSyncStore.setState({ isAuthenticated: true });

      const isAuthenticated = useSyncStore.getState().isAuthenticated;

      expect(isAuthenticated).toBe(true);
    });

    it('syncManagerがnullの場合はfalseを返す', () => {
      useSyncStore.setState({ syncManager: null, isAuthenticated: false });

      const isAuthenticated = useSyncStore.getState().isAuthenticated;

      expect(isAuthenticated).toBe(false);
    });

    it('同期エラーがクリアされる', () => {
      useSyncStore.setState({ syncError: 'テストエラー' });

      useSyncStore.getState().clearSyncError();

      const state = useSyncStore.getState();
      expect(state.syncError).toBeNull();
    });
  });
});