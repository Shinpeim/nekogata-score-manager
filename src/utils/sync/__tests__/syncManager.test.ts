import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncManager } from '../syncManager';
import { DropboxSyncAdapter } from '../dropboxAdapter';
import type { ChordChart } from '../../../types/chord';
import type { SyncMetadata } from '../../../types/sync';

vi.mock('../dropboxAdapter');
vi.mock('../deviceId', () => ({
  getDeviceId: () => 'test-device-id'
}));
vi.mock('../../storage', () => ({
  storageService: {
    loadDeletedCharts: vi.fn().mockResolvedValue([])
  }
}));

import { storageService } from '../../storage';

describe('SyncManager', () => {
  let syncManager: SyncManager;
  let mockAdapter: DropboxSyncAdapter;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    syncManager = SyncManager.getInstance();
    mockAdapter = {
      isAuthenticated: vi.fn(),
      authenticate: vi.fn(),
      signOut: vi.fn(),
      pull: vi.fn(),
      push: vi.fn(),
      getRemoteMetadata: vi.fn(),
      updateMetadata: vi.fn(),
      getStorageInfo: vi.fn(),
      initialize: vi.fn()
    } as unknown as DropboxSyncAdapter;
    (syncManager as unknown as { adapter: DropboxSyncAdapter }).adapter = mockAdapter;
  });

  describe('authentication', () => {
    it('should check authentication status', () => {
      (mockAdapter.isAuthenticated as ReturnType<typeof vi.fn>).mockReturnValue(true);
      
      expect(syncManager.isAuthenticated()).toBe(true);
      expect(mockAdapter.isAuthenticated).toHaveBeenCalled();
    });

    it('should authenticate user', async () => {
      (mockAdapter.authenticate as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      
      await syncManager.authenticate();
      
      expect(mockAdapter.authenticate).toHaveBeenCalled();
    });

    it('should sign out user', async () => {
      (mockAdapter.signOut as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      
      await syncManager.signOut();
      
      expect(mockAdapter.signOut).toHaveBeenCalled();
    });
  });

  describe('sync operation', () => {
    const mockLocalCharts: ChordChart[] = [
      {
        id: 'chart-1',
        title: 'Test Chart',
        artist: 'Test Artist',
        key: 'C',
        tempo: 120,
        timeSignature: '4/4',
        sections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '2.0.0'
      }
    ];

    const mockRemoteCharts: ChordChart[] = [];
    const mockRemoteMetadata: Record<string, SyncMetadata> = {};

    beforeEach(() => {
      (mockAdapter.pull as ReturnType<typeof vi.fn>).mockResolvedValue({
        charts: mockRemoteCharts,
        metadata: mockRemoteMetadata,
        deletedCharts: []
      });
      (mockAdapter.push as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    });

    it('should sync successfully without conflicts', async () => {
      const result = await syncManager.sync(mockLocalCharts);
      
      expect(result.success).toBe(true);
      expect(result.conflicts).toHaveLength(0);
      expect(result.syncedCharts).toContain('chart-1');
      expect(mockAdapter.pull).toHaveBeenCalled();
      expect(mockAdapter.push).toHaveBeenCalled();
    });

    it('should detect conflicts when both local and remote changed', async () => {
      const lastSync = new Date(Date.now() - 60000).toISOString(); // 1分前
      const remoteModified = new Date(Date.now() - 30000).toISOString(); // 30秒前
      
      localStorage.setItem('nekogata-last-sync', lastSync);
      
      const remoteChart = { ...mockLocalCharts[0], title: 'Remote Title' };
      (mockAdapter.pull as ReturnType<typeof vi.fn>).mockResolvedValue({
        charts: [remoteChart],
        metadata: {
          'chart-1': {
            lastSyncedAt: lastSync,
            lastModifiedAt: remoteModified,
            deviceId: 'other-device'
          }
        },
        deletedCharts: []
      });

      const onConflict = vi.fn().mockResolvedValue('overwrite');
      const result = await syncManager.sync(mockLocalCharts, onConflict);
      
      expect(result.conflicts).toHaveLength(1);
      expect(onConflict).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          localChart: mockLocalCharts[0],
          remoteChart
        })
      ]));
    });

    it('should handle sync cancellation on conflict', async () => {
      const remoteChart = { ...mockLocalCharts[0], title: 'Remote Title' };
      (mockAdapter.pull as ReturnType<typeof vi.fn>).mockResolvedValue({
        charts: [remoteChart],
        metadata: {
          'chart-1': {
            lastSyncedAt: new Date(0).toISOString(),
            lastModifiedAt: new Date().toISOString(),
            deviceId: 'other-device'
          }
        },
        deletedCharts: []
      });

      const onConflict = vi.fn().mockResolvedValue('cancel');
      const result = await syncManager.sync(mockLocalCharts, onConflict);
      
      expect(result.success).toBe(false);
      expect(mockAdapter.push).not.toHaveBeenCalled();
    });

    it('should handle sync errors', async () => {
      (mockAdapter.pull as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed to fetch'));
      
      const result = await syncManager.sync(mockLocalCharts);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('network');
    });

    it('should prevent concurrent sync operations', async () => {
      // 最初の同期を開始（完了しない）
      const firstSync = syncManager.sync(mockLocalCharts);
      
      // 2回目の同期を試みる
      await expect(syncManager.sync(mockLocalCharts)).rejects.toThrow('Sync already in progress');
      
      // 最初の同期を完了させる
      await firstSync;
    });
  });

  describe('config management', () => {
    it('should load default config', () => {
      const config = syncManager.getConfig();
      
      expect(config).toEqual({
        autoSync: false,
        showConflictWarning: true
      });
    });

    it('should save and load config', () => {
      const newConfig = {
        autoSync: true,
        showConflictWarning: false
      };
      
      syncManager.saveConfig(newConfig);
      
      expect(syncManager.getConfig()).toEqual(newConfig);
      expect(localStorage.getItem('nekogata-sync-config')).toBe(JSON.stringify(newConfig));
    });
  });

  describe('deleted charts synchronization', () => {
    const mockLocalCharts: ChordChart[] = [
      {
        id: 'chart-1',
        title: 'Local Chart',
        artist: 'Local Artist',
        key: 'C',
        tempo: 120,
        timeSignature: '4/4',
        sections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '2.0.0'
      }
    ];

    const mockRemoteCharts: ChordChart[] = [
      {
        id: 'chart-2',
        title: 'Remote Chart',
        artist: 'Remote Artist',
        key: 'G',
        tempo: 140,
        timeSignature: '4/4',
        sections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '2.0.0'
      }
    ];

    it('should exclude deleted charts from sync result', async () => {
      const deletedCharts = [
        { id: 'chart-2', deletedAt: new Date().toISOString(), deviceId: 'device-1' }
      ];
      
      (mockAdapter.pull as ReturnType<typeof vi.fn>).mockResolvedValue({
        charts: mockRemoteCharts,
        metadata: {},
        deletedCharts
      });

      const result = await syncManager.sync(mockLocalCharts);

      expect(result.success).toBe(true);
      expect(result.mergedCharts).toHaveLength(1);
      expect(result.mergedCharts?.[0].id).toBe('chart-1');
      expect(result.mergedCharts?.find(c => c.id === 'chart-2')).toBeUndefined();
    });

    it('should merge deleted charts from local and remote', async () => {
      const localDeletedCharts = [
        { id: 'chart-3', deletedAt: '2024-01-01T00:00:00.000Z', deviceId: 'device-1' }
      ];
      const remoteDeletedCharts = [
        { id: 'chart-4', deletedAt: '2024-01-02T00:00:00.000Z', deviceId: 'device-2' }
      ];

      vi.mocked(storageService.loadDeletedCharts).mockResolvedValue(localDeletedCharts);
      
      (mockAdapter.pull as ReturnType<typeof vi.fn>).mockResolvedValue({
        charts: [],
        metadata: {},
        deletedCharts: remoteDeletedCharts
      });

      await syncManager.sync([]);

      expect(mockAdapter.push).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Object),
        expect.arrayContaining([
          expect.objectContaining({ id: 'chart-3' }),
          expect.objectContaining({ id: 'chart-4' })
        ])
      );
    });

    it('should handle newer deleted chart records', async () => {
      const olderDeletedChart = { id: 'chart-5', deletedAt: '2024-01-01T00:00:00.000Z', deviceId: 'device-1' };
      const newerDeletedChart = { id: 'chart-5', deletedAt: '2024-01-02T00:00:00.000Z', deviceId: 'device-2' };

      vi.mocked(storageService.loadDeletedCharts).mockResolvedValue([olderDeletedChart]);
      
      (mockAdapter.pull as ReturnType<typeof vi.fn>).mockResolvedValue({
        charts: [],
        metadata: {},
        deletedCharts: [newerDeletedChart]
      });

      await syncManager.sync([]);

      expect(mockAdapter.push).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Object),
        expect.arrayContaining([
          expect.objectContaining({ 
            id: 'chart-5', 
            deletedAt: '2024-01-02T00:00:00.000Z',
            deviceId: 'device-2'
          })
        ])
      );
    });

    it('should handle deletion conflicts correctly', async () => {
      // ローカルで削除されたが、リモートで更新されたチャート
      const remoteChart: ChordChart = {
        id: 'conflicted-chart',
        title: 'Updated Remotely',
        artist: 'Remote Artist',
        key: 'G',
        tempo: 140,
        timeSignature: '4/4',
        sections: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-03'), // リモートで更新
        version: '2.0.0'
      };

      const localDeletedChart = {
        id: 'conflicted-chart',
        deletedAt: '2024-01-02T00:00:00.000Z', // ローカルで削除
        deviceId: 'local-device'
      };

      vi.mocked(storageService.loadDeletedCharts).mockResolvedValue([localDeletedChart]);
      
      (mockAdapter.pull as ReturnType<typeof vi.fn>).mockResolvedValue({
        charts: [remoteChart],
        metadata: {
          'conflicted-chart': {
            lastSyncedAt: '2024-01-01T00:00:00.000Z',
            lastModifiedAt: '2024-01-03T00:00:00.000Z',
            deviceId: 'remote-device'
          }
        },
        deletedCharts: []
      });

      const result = await syncManager.sync([]);

      // 削除が優先されるため、チャートは同期結果に含まれない
      expect(result.success).toBe(true);
      expect(result.mergedCharts?.find(c => c.id === 'conflicted-chart')).toBeUndefined();
      
      // 削除記録は保持される
      expect(mockAdapter.push).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Object),
        expect.arrayContaining([
          expect.objectContaining({ id: 'conflicted-chart' })
        ])
      );
    });

    it('should exclude charts deleted on multiple devices', async () => {
      const localDeletedCharts = [
        { id: 'chart-a', deletedAt: '2024-01-01T00:00:00.000Z', deviceId: 'device-1' }
      ];
      const remoteDeletedCharts = [
        { id: 'chart-b', deletedAt: '2024-01-02T00:00:00.000Z', deviceId: 'device-2' }
      ];

      const remoteCharts: ChordChart[] = [
        { id: 'chart-a', title: 'Chart A' } as ChordChart, // ローカルで削除済み
        { id: 'chart-b', title: 'Chart B' } as ChordChart, // リモートで削除済み
        { id: 'chart-c', title: 'Chart C' } as ChordChart  // 削除されていない
      ];

      vi.mocked(storageService.loadDeletedCharts).mockResolvedValue(localDeletedCharts);
      
      (mockAdapter.pull as ReturnType<typeof vi.fn>).mockResolvedValue({
        charts: remoteCharts,
        metadata: {},
        deletedCharts: remoteDeletedCharts
      });

      const result = await syncManager.sync([]);

      expect(result.success).toBe(true);
      expect(result.mergedCharts).toHaveLength(1);
      expect(result.mergedCharts?.[0].id).toBe('chart-c');
    });
  });
});