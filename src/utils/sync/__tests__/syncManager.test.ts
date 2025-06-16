import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncManager } from '../syncManager';
import { GoogleDriveSyncAdapter } from '../googleDriveAdapter';
import type { ChordChart } from '../../../types/chord';
import type { SyncMetadata } from '../../../types/sync';

vi.mock('../googleDriveAdapter');
vi.mock('../deviceId', () => ({
  getDeviceId: () => 'test-device-id'
}));

describe('SyncManager', () => {
  let syncManager: SyncManager;
  let mockAdapter: GoogleDriveSyncAdapter;

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
    } as unknown as GoogleDriveSyncAdapter;
    (syncManager as unknown as { adapter: GoogleDriveSyncAdapter }).adapter = mockAdapter;
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
        metadata: mockRemoteMetadata
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
        }
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
        }
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
        syncInterval: 5,
        conflictResolution: 'remote',
        showConflictWarning: true
      });
    });

    it('should save and load config', () => {
      const newConfig = {
        autoSync: true,
        syncInterval: 10,
        conflictResolution: 'local' as const,
        showConflictWarning: false
      };
      
      syncManager.saveConfig(newConfig);
      
      expect(syncManager.getConfig()).toEqual(newConfig);
      expect(localStorage.getItem('nekogata-sync-config')).toBe(JSON.stringify(newConfig));
    });
  });
});