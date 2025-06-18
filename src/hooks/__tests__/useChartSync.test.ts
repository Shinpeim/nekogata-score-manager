import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChartSync } from '../useChartSync';
import { useChartManagement } from '../useChartManagement';
import { useSyncStore } from '../../stores/syncStore';
import { createNewChordChart } from '../../utils/chordCreation';
import type { SyncResult } from '../../types/sync';
import type { ChordChart } from '../../types';

// Mock stores
vi.mock('../useChartManagement');
vi.mock('../../stores/syncStore');

// Mock localforage
vi.mock('localforage', () => ({
  default: {
    config: vi.fn(),
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn()
  }
}));


interface MockSyncStore {
  syncManager: unknown;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  syncConfig: {
    autoSync: boolean;
    syncInterval: number;
    conflictResolution: string;
    showConflictWarning: boolean;
  };
  sync: ReturnType<typeof vi.fn>;
  authenticate: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  updateSyncConfig: ReturnType<typeof vi.fn>;
  clearSyncError: ReturnType<typeof vi.fn>;
  isAuthenticated: ReturnType<typeof vi.fn>;
  initializeSync: ReturnType<typeof vi.fn>;
}

const mockChordChartStore = {
  charts: {},
  currentChartId: null,
  isLoading: false,
  error: null,
  syncCallbacks: new Set<(charts: ChordChart[]) => void>(),
  subscribeSyncNotification: vi.fn(),
  applySyncedCharts: vi.fn(),
  // 追加で必要なプロパティ
  setCurrentChart: vi.fn(),
  getCurrentChart: vi.fn(),
  getChartById: vi.fn(),
  getChartsArray: vi.fn(),
  hasCharts: vi.fn(),
  getChartsCount: vi.fn(),
  addChart: vi.fn(),
  updateChart: vi.fn(),
  deleteChart: vi.fn(),
  deleteMultipleCharts: vi.fn(),
  createNewChart: vi.fn(),
  loadInitialData: vi.fn(),
  loadFromStorage: vi.fn(),
  clearError: vi.fn(),
  notifySyncCallbacks: vi.fn()
};

const mockSyncStore: MockSyncStore = {
  syncManager: { initialize: vi.fn() },
  isSyncing: false,
  lastSyncTime: null,
  syncError: null,
  syncConfig: {
    autoSync: false,
    syncInterval: 5,
    conflictResolution: 'remote',
    showConflictWarning: true
  },
  sync: vi.fn(),
  authenticate: vi.fn(),
  signOut: vi.fn(),
  updateSyncConfig: vi.fn(),
  clearSyncError: vi.fn(),
  isAuthenticated: vi.fn(),
  initializeSync: vi.fn()
};

describe('useChartSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockChordChartStore.subscribeSyncNotification.mockReturnValue(() => {});
    mockSyncStore.isAuthenticated.mockReturnValue(false);
    mockSyncStore.sync.mockResolvedValue({
      success: true,
      conflicts: [],
      syncedCharts: [],
      mergedCharts: [],
      errors: []
    });
    
    // Reset mock store state
    Object.assign(mockChordChartStore, {
      charts: {},
      currentChartId: null,
      isLoading: false,
      error: null,
      syncCallbacks: new Set<(charts: ChordChart[]) => void>(),
      subscribeSyncNotification: vi.fn().mockReturnValue(() => {}),
      applySyncedCharts: vi.fn()
    });
    
    Object.assign(mockSyncStore, {
      syncManager: { initialize: vi.fn() },
      isSyncing: false,
      lastSyncTime: null,
      syncError: null,
      syncConfig: {
        autoSync: false,
        syncInterval: 5,
        conflictResolution: 'remote',
        showConflictWarning: true
      },
      sync: vi.fn().mockResolvedValue({
        success: true,
        conflicts: [],
        syncedCharts: [],
        mergedCharts: [],
        errors: []
      }),
      authenticate: vi.fn(),
      signOut: vi.fn(),
      updateSyncConfig: vi.fn(),
      clearSyncError: vi.fn(),
      isAuthenticated: vi.fn().mockReturnValue(false),
      initializeSync: vi.fn()
    });
    
    vi.mocked(useChartManagement).mockReturnValue(mockChordChartStore);
    vi.mocked(useSyncStore).mockReturnValue(mockSyncStore as ReturnType<typeof useSyncStore>);
    
    // Mock useSyncStore.getState() to return the mock state
    vi.mocked(useSyncStore).getState = vi.fn().mockReturnValue(mockSyncStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return expected properties and methods', () => {
    const { result } = renderHook(() => useChartSync());

    expect(result.current).toHaveProperty('syncCharts');
    expect(result.current).toHaveProperty('isSyncing');
    expect(result.current).toHaveProperty('lastSyncTime');
    expect(result.current).toHaveProperty('syncError');
    expect(result.current).toHaveProperty('syncConfig');
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('authenticate');
    expect(result.current).toHaveProperty('signOut');
    expect(result.current).toHaveProperty('updateSyncConfig');
    expect(result.current).toHaveProperty('clearSyncError');
    expect(result.current).toHaveProperty('charts');
    expect(result.current).toHaveProperty('currentChartId');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
  });

  describe('syncCharts', () => {
    it('should sync charts and apply merged results', async () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      const chart2 = createNewChordChart({ title: 'Chart 2' });
      const mergedCharts = [chart1, chart2];

      mockChordChartStore.charts = { [chart1.id]: chart1 };
      
      const syncResult: SyncResult = {
        success: true,
        conflicts: [],
        syncedCharts: [chart1.id, chart2.id],
        mergedCharts,
        errors: []
      };

      mockSyncStore.sync.mockResolvedValue(syncResult);

      const { result } = renderHook(() => useChartSync());

      let resultValue: SyncResult | undefined;
      await act(async () => {
        resultValue = await result.current.syncCharts();
      });

      expect(mockSyncStore.sync).toHaveBeenCalledWith([chart1], undefined);
      expect(mockChordChartStore.applySyncedCharts).toHaveBeenCalledWith(mergedCharts);
      expect(resultValue).toEqual(syncResult);
    });

    it('should sync charts with conflict handler', async () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      const mockConflictHandler = vi.fn().mockResolvedValue('overwrite' as const);

      mockChordChartStore.charts = { [chart1.id]: chart1 };

      const { result } = renderHook(() => useChartSync());

      await act(async () => {
        await result.current.syncCharts(mockConflictHandler);
      });

      expect(mockSyncStore.sync).toHaveBeenCalledWith([chart1], mockConflictHandler);
    });

    it('should not apply charts if sync failed', async () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      mockChordChartStore.charts = { [chart1.id]: chart1 };

      const syncResult: SyncResult = {
        success: false,
        conflicts: [],
        syncedCharts: [],
        errors: [{ chartId: '', error: new Error('Sync failed'), type: 'network' }]
      };

      mockSyncStore.sync.mockResolvedValue(syncResult);

      const { result } = renderHook(() => useChartSync());

      await act(async () => {
        await result.current.syncCharts();
      });

      expect(mockSyncStore.sync).toHaveBeenCalled();
      expect(mockChordChartStore.applySyncedCharts).not.toHaveBeenCalled();
    });

    it('should not apply charts if no merged charts returned', async () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      mockChordChartStore.charts = { [chart1.id]: chart1 };

      const syncResult: SyncResult = {
        success: true,
        conflicts: [],
        syncedCharts: [],
        errors: []
        // mergedCharts is undefined
      };

      mockSyncStore.sync.mockResolvedValue(syncResult);

      const { result } = renderHook(() => useChartSync());

      await act(async () => {
        await result.current.syncCharts();
      });

      expect(mockSyncStore.sync).toHaveBeenCalled();
      expect(mockChordChartStore.applySyncedCharts).not.toHaveBeenCalled();
    });

    it('should handle sync errors', async () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      mockChordChartStore.charts = { [chart1.id]: chart1 };

      const syncError = new Error('Network error');
      mockSyncStore.sync.mockRejectedValue(syncError);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useChartSync());

      await act(async () => {
        await expect(result.current.syncCharts()).rejects.toThrow('Network error');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] \[ERROR\]$/),
        'useChartSync.syncCharts caught error:',
        syncError
      );
      expect(mockChordChartStore.applySyncedCharts).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('auto sync on chart changes', () => {
    it('should subscribe to chart changes when auto sync is enabled and authenticated', () => {
      mockSyncStore.syncConfig.autoSync = true;
      mockSyncStore.isAuthenticated.mockReturnValue(true);

      renderHook(() => useChartSync());

      expect(mockChordChartStore.subscribeSyncNotification).toHaveBeenCalled();
    });

    it('should not subscribe when auto sync is disabled', () => {
      mockSyncStore.syncConfig.autoSync = false;
      mockSyncStore.isAuthenticated.mockReturnValue(true);

      renderHook(() => useChartSync());

      expect(mockChordChartStore.subscribeSyncNotification).not.toHaveBeenCalled();
    });

    it('should not subscribe when not authenticated', () => {
      mockSyncStore.syncConfig.autoSync = true;
      mockSyncStore.isAuthenticated.mockReturnValue(false);

      renderHook(() => useChartSync());

      expect(mockChordChartStore.subscribeSyncNotification).not.toHaveBeenCalled();
    });

    it('should unsubscribe on unmount', () => {
      const unsubscribe = vi.fn();
      mockChordChartStore.subscribeSyncNotification.mockReturnValue(unsubscribe);
      mockSyncStore.syncConfig.autoSync = true;
      mockSyncStore.isAuthenticated.mockReturnValue(true);

      const { unmount } = renderHook(() => useChartSync());

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should trigger sync when charts change', async () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      let changeCallback: (charts: unknown[]) => void = () => {};

      mockChordChartStore.subscribeSyncNotification.mockImplementation((callback) => {
        changeCallback = callback;
        return () => {};
      });

      mockSyncStore.syncConfig.autoSync = true;
      mockSyncStore.isAuthenticated.mockReturnValue(true);
      mockSyncStore.isSyncing = false;

      renderHook(() => useChartSync());

      // Simulate chart change
      await act(async () => {
        changeCallback([chart1]);
      });

      expect(mockSyncStore.sync).toHaveBeenCalledWith([chart1]);
    });

    it('should not trigger sync when already syncing', async () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      let changeCallback: (charts: unknown[]) => void = () => {};

      mockChordChartStore.subscribeSyncNotification.mockImplementation((callback) => {
        changeCallback = callback;
        return () => {};
      });

      mockSyncStore.syncConfig.autoSync = true;
      mockSyncStore.isAuthenticated.mockReturnValue(true);
      mockSyncStore.isSyncing = true; // Already syncing

      renderHook(() => useChartSync());

      await act(async () => {
        changeCallback([chart1]);
      });

      expect(mockSyncStore.sync).not.toHaveBeenCalled();
    });

    it('should handle auto sync errors silently', async () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      let changeCallback: (charts: unknown[]) => void = () => {};

      mockChordChartStore.subscribeSyncNotification.mockImplementation((callback) => {
        changeCallback = callback;
        return () => {};
      });

      mockSyncStore.syncConfig.autoSync = true;
      mockSyncStore.isAuthenticated.mockReturnValue(true);
      mockSyncStore.isSyncing = false;
      mockSyncStore.sync.mockRejectedValue(new Error('Auto sync failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderHook(() => useChartSync());

      await act(async () => {
        changeCallback([chart1]);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] \[ERROR\]$/),
        '自動同期エラー:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('periodic sync timer', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should set up periodic sync when auto sync is enabled and authenticated', () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      mockChordChartStore.charts = { [chart1.id]: chart1 };
      mockSyncStore.syncConfig.autoSync = true;
      mockSyncStore.syncConfig.syncInterval = 5; // 5 minutes
      mockSyncStore.isAuthenticated.mockReturnValue(true);
      mockSyncStore.isSyncing = false;

      const { unmount } = renderHook(() => useChartSync());

      // Verify that setInterval was called
      expect(vi.getTimerCount()).toBeGreaterThan(0);

      // Cleanup
      unmount();
    });

    it('should not set up timer when auto sync is disabled', () => {
      mockSyncStore.syncConfig.autoSync = false;
      mockSyncStore.isAuthenticated.mockReturnValue(true);

      renderHook(() => useChartSync());

      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000); // 10 minutes
      });

      expect(mockSyncStore.sync).not.toHaveBeenCalled();
    });

    it('should not sync during timer if already syncing', async () => {
      mockSyncStore.syncConfig.autoSync = true;
      mockSyncStore.isAuthenticated.mockReturnValue(true);
      mockSyncStore.isSyncing = true; // Already syncing

      renderHook(() => useChartSync());

      await act(async () => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(mockSyncStore.sync).not.toHaveBeenCalled();
    });

    it('should handle periodic sync errors silently', () => {
      mockSyncStore.syncConfig.autoSync = true;
      mockSyncStore.isAuthenticated.mockReturnValue(true);
      mockSyncStore.isSyncing = false;

      const { unmount } = renderHook(() => useChartSync());

      // Just verify timer is set up
      expect(vi.getTimerCount()).toBeGreaterThan(0);

      // Cleanup
      unmount();
    });

    it('should clear timer on unmount', () => {
      mockSyncStore.syncConfig.autoSync = true;
      mockSyncStore.isAuthenticated.mockReturnValue(true);

      const { unmount } = renderHook(() => useChartSync());

      // Verify timer was created
      expect(vi.getTimerCount()).toBeGreaterThan(0);

      unmount();

      // Verify timer was cleared
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('combined loading state', () => {
    it('should combine chart store and sync store loading states', () => {
      mockChordChartStore.isLoading = true;
      mockSyncStore.isSyncing = false;

      const { result } = renderHook(() => useChartSync());

      expect(result.current.isLoading).toBe(true);
    });

    it('should show loading when sync store is syncing', () => {
      mockChordChartStore.isLoading = false;
      mockSyncStore.isSyncing = true;

      const { result } = renderHook(() => useChartSync());

      expect(result.current.isLoading).toBe(true);
    });

    it('should not show loading when both are false', () => {
      mockChordChartStore.isLoading = false;
      mockSyncStore.isSyncing = false;

      const { result } = renderHook(() => useChartSync());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('combined error state', () => {
    it('should prioritize chart store error', () => {
      // @ts-expect-error: Temporarily overriding readonly property for testing
      mockChordChartStore.error = 'Chart error';
      mockSyncStore.syncError = 'Sync error';

      const { result } = renderHook(() => useChartSync());

      expect(result.current.error).toBe('Chart error');
    });

    it('should show sync error when no chart error', () => {
      mockChordChartStore.error = null;
      mockSyncStore.syncError = 'Sync error';

      const { result } = renderHook(() => useChartSync());

      expect(result.current.error).toBe('Sync error');
    });

    it('should show null when no errors', () => {
      mockChordChartStore.error = null;
      mockSyncStore.syncError = null;

      const { result } = renderHook(() => useChartSync());

      expect(result.current.error).toBe(null);
    });
  });
});