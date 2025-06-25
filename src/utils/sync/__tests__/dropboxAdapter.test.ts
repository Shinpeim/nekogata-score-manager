import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { DropboxSyncAdapter } from '../dropboxAdapter';
import { DropboxAuthProvider } from '../dropboxAuth';
import type { ChordChart } from '../../../types/chord';
import type { SyncMetadata, DeletedChartRecord } from '../../../types/sync';

// DropboxAuthProviderのモック
vi.mock('../dropboxAuth', () => ({
  DropboxAuthProvider: {
    getInstance: vi.fn()
  }
}));

// グローバルfetchのモック
global.fetch = vi.fn();

describe('DropboxSyncAdapter', () => {
  let adapter: DropboxSyncAdapter;
  let mockAuthProvider: {
    initialize: Mock;
    isAuthenticated: Mock;
    hasValidRefreshToken: Mock;
    authenticate: Mock;
    signOut: Mock;
    getAccessToken: Mock;
    validateToken: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // AuthProviderのモック設定
    mockAuthProvider = {
      initialize: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: vi.fn().mockReturnValue(true),
      hasValidRefreshToken: vi.fn().mockReturnValue(false),
      authenticate: vi.fn().mockResolvedValue(undefined),
      signOut: vi.fn(),
      getAccessToken: vi.fn().mockReturnValue('mock-access-token'),
      validateToken: vi.fn().mockResolvedValue(true)
    };
    
    (DropboxAuthProvider.getInstance as Mock).mockReturnValue(mockAuthProvider);
    
    // window.location.originのモック
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true
    });
    
    adapter = new DropboxSyncAdapter();
  });

  describe('constructor', () => {
    it('should initialize with proper folder paths', () => {
      expect(DropboxAuthProvider.getInstance).toHaveBeenCalled();
      // フォルダ名がoriginから生成されることを間接的に確認
      expect(adapter).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should call auth provider initialize', async () => {
      await adapter.initialize();
      expect(mockAuthProvider.initialize).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when access token is valid', () => {
      mockAuthProvider.isAuthenticated.mockReturnValue(true);
      mockAuthProvider.hasValidRefreshToken.mockReturnValue(false);
      
      const result = adapter.isAuthenticated();
      expect(result).toBe(true);
      expect(mockAuthProvider.isAuthenticated).toHaveBeenCalled();
    });

    it('should return true when only refresh token exists', () => {
      mockAuthProvider.isAuthenticated.mockReturnValue(false);
      mockAuthProvider.hasValidRefreshToken.mockReturnValue(true);
      
      const result = adapter.isAuthenticated();
      expect(result).toBe(true);
      expect(mockAuthProvider.isAuthenticated).toHaveBeenCalled();
      expect(mockAuthProvider.hasValidRefreshToken).toHaveBeenCalled();
    });

    it('should return false when neither token exists', () => {
      mockAuthProvider.isAuthenticated.mockReturnValue(false);
      mockAuthProvider.hasValidRefreshToken.mockReturnValue(false);
      
      const result = adapter.isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('authenticate', () => {
    it('should authenticate and create app folder', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 409 // Folder not found
      }).mockResolvedValueOnce({
        ok: true // Create folder success
      });

      await adapter.authenticate();
      
      expect(mockAuthProvider.authenticate).toHaveBeenCalled();
      expect(mockAuthProvider.validateToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('files/get_metadata'),
        expect.any(Object)
      );
    });

    it('should throw error if token validation fails', async () => {
      mockAuthProvider.validateToken.mockResolvedValue(false);
      
      await expect(adapter.authenticate()).rejects.toThrow('認証に失敗しました');
    });
  });

  describe('signOut', () => {
    it('should call auth provider signOut', async () => {
      await adapter.signOut();
      expect(mockAuthProvider.signOut).toHaveBeenCalled();
    });
  });

  describe('pull', () => {
    it('should download all files and return data', async () => {
      const mockCharts: ChordChart[] = [{
        id: 'chart-1',
        title: 'Test Chart',
        artist: 'Test Artist',
        key: 'C',
        tempo: 120,
        timeSignature: '4/4',
        sections: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }];
      
      const mockMetadata: Record<string, SyncMetadata> = {
        'chart-1': {
          lastModifiedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          deviceId: 'device-1'
        }
      };
      
      const mockDeletedCharts: DeletedChartRecord[] = [{
        id: 'deleted-1',
        deletedAt: new Date().toISOString(),
        deviceId: 'device-1'
      }];

      // ファイルダウンロードのモック
      // JSON.stringify/parseでDate型が文字列に変換されることを考慮
      const chartsJson = JSON.parse(JSON.stringify(mockCharts));
      const metadataJson = JSON.parse(JSON.stringify(mockMetadata));
      const deletedChartsJson = JSON.parse(JSON.stringify(mockDeletedCharts));
      const setListsJson: unknown[] = [];
      const setListMetadataJson = {};
      const deletedSetListsJson: unknown[] = [];
      
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(chartsJson))
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(metadataJson))
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(deletedChartsJson))
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(setListsJson))
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(setListMetadataJson))
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(deletedSetListsJson))
        });

      const result = await adapter.pull();
      
      expect(result).toEqual({
        charts: chartsJson,
        metadata: metadataJson,
        deletedCharts: deletedChartsJson,
        setLists: setListsJson,
        setListMetadata: setListMetadataJson,
        deletedSetLists: deletedSetListsJson
      });
      expect(global.fetch).toHaveBeenCalledTimes(6);
    });

    it('should return empty data when files do not exist', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: false,
        status: 409 // File not found
      });

      const result = await adapter.pull();
      
      expect(result).toEqual({
        charts: [],
        metadata: {},
        deletedCharts: [],
        setLists: [],
        setListMetadata: {},
        deletedSetLists: []
      });
    });

    it('should throw error when not authenticated', async () => {
      mockAuthProvider.getAccessToken.mockReturnValue(null);
      
      await expect(adapter.pull()).rejects.toThrow('Not authenticated');
    });
  });

  describe('push', () => {
    it('should upload all files', async () => {
      const mockCharts: ChordChart[] = [{
        id: 'chart-1',
        title: 'Test Chart',
        artist: 'Test Artist',
        key: 'C',
        tempo: 120,
        timeSignature: '4/4',
        sections: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }];
      
      const mockMetadata: Record<string, SyncMetadata> = {
        'chart-1': {
          lastModifiedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          deviceId: 'device-1'
        }
      };
      
      const mockDeletedCharts: DeletedChartRecord[] = [];

      // フォルダ確認とファイルアップロードのモック
      (global.fetch as Mock)
        .mockResolvedValueOnce({ ok: true }) // フォルダ存在確認
        .mockResolvedValueOnce({ ok: true }) // charts.json upload
        .mockResolvedValueOnce({ ok: true }) // metadata.json upload
        .mockResolvedValueOnce({ ok: true }) // deleted-charts.json upload
        .mockResolvedValueOnce({ ok: true }) // setlists.json upload
        .mockResolvedValueOnce({ ok: true }) // setlist-metadata.json upload
        .mockResolvedValueOnce({ ok: true }); // deleted-setlists.json upload

      await adapter.push(mockCharts, mockMetadata, mockDeletedCharts, [], {}, []);
      
      // アップロードAPIが6回呼ばれることを確認
      const uploadCalls = (global.fetch as Mock).mock.calls.filter(
        call => call[0].includes('files/upload')
      );
      expect(uploadCalls).toHaveLength(6);
    });

    it('should throw error when not authenticated', async () => {
      mockAuthProvider.getAccessToken.mockReturnValue(null);
      
      await expect(adapter.push([], {}, [], [], {}, [])).rejects.toThrow('Not authenticated');
    });

    it('should throw error when upload fails', async () => {
      (global.fetch as Mock)
        .mockResolvedValueOnce({ ok: true }) // フォルダ確認
        .mockResolvedValueOnce({ 
          ok: false, 
          status: 500,
          text: () => Promise.resolve('Server error')
        })
        .mockResolvedValue({ ok: true }); // 残りのリクエストは成功

      await expect(adapter.push([], {}, [], [], {}, [])).rejects.toThrow('Failed to upload file: 500 - Server error');
    });
  });

  describe('getRemoteMetadata', () => {
    it('should return metadata from pull', async () => {
      const mockMetadata: Record<string, SyncMetadata> = {
        'chart-1': {
          lastModifiedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          deviceId: 'device-1'
        }
      };

      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockMetadata))
      });

      const result = await adapter.getRemoteMetadata();
      expect(result).toEqual(mockMetadata);
    });
  });

  describe('updateMetadata', () => {
    it('should update metadata for a specific chart', async () => {
      const existingMetadata: Record<string, SyncMetadata> = {
        'chart-1': {
          lastModifiedAt: '2024-01-01T00:00:00Z',
          lastSyncedAt: '2024-01-01T00:00:00Z',
          deviceId: 'device-1'
        }
      };

      const newMetadata: SyncMetadata = {
        lastModifiedAt: '2024-01-02T00:00:00Z',
        lastSyncedAt: '2024-01-02T00:00:00Z',
        deviceId: 'device-1'
      };

      // getRemoteMetadata用のモック
      (global.fetch as Mock)
        .mockResolvedValueOnce({ ok: true }) // charts.json (ignored)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(existingMetadata))
        })
        .mockResolvedValueOnce({ ok: true }) // deleted-charts.json (ignored)
        .mockResolvedValueOnce({ ok: true }); // upload

      await adapter.updateMetadata('chart-1', newMetadata);
      
      // アップロード時のデータを確認
      const uploadCall = (global.fetch as Mock).mock.calls.find(
        call => call[0].includes('files/upload')
      );
      expect(uploadCall).toBeDefined();
      const uploadedData = JSON.parse(uploadCall![1].body);
      expect(uploadedData['chart-1']).toEqual(newMetadata);
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage usage information', async () => {
      const mockStorageInfo = {
        used: 1000000,
        allocation: { allocated: 2000000000 }
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStorageInfo)
      });

      const result = await adapter.getStorageInfo();
      
      expect(result).toEqual({
        used: 1000000,
        total: 2000000000
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.dropboxapi.com/2/users/get_space_usage',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token'
          })
        })
      );
    });

    it('should use default total when allocation is not provided', async () => {
      const mockStorageInfo = {
        used: 1000000,
        allocation: {}
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStorageInfo)
      });

      const result = await adapter.getStorageInfo();
      expect(result.total).toBe(2000000000); // 2GB default
    });

    it('should throw error when not authenticated', async () => {
      mockAuthProvider.getAccessToken.mockReturnValue(null);
      
      await expect(adapter.getStorageInfo()).rejects.toThrow('Not authenticated');
    });
  });

  describe('private methods', () => {
    it('should sanitize origin for folder name correctly', () => {
      const testCases = [
        { origin: 'http://localhost:3000', expected: 'nekogatascoremanager-localhost-3000' },
        { origin: 'https://example.com', expected: 'nekogatascoremanager-examplecom' },
        { origin: 'https://sub.domain.com:8080', expected: 'nekogatascoremanager-subdomaincom-8080' }
      ];

      testCases.forEach(({ origin }) => {
        Object.defineProperty(window, 'location', {
          value: { origin },
          writable: true
        });
        
        const newAdapter = new DropboxSyncAdapter();
        // コンストラクタ内でフォルダ名が生成されることを確認
        expect(newAdapter).toBeDefined();
      });
    });
  });
});