import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChordChartStore } from '../chordChartStore';
import { createNewChordChart } from '../../utils/chordCreation';
import type { ChordChart } from '../../types';

// Mock localforage
vi.mock('localforage', () => ({
  default: {
    config: vi.fn(),
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn()
  }
}));

import localforage from 'localforage';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.mocked = vi.mocked || ((fn: any) => fn as any);

describe('chordChartStore integration with storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChordChartStore.setState({
      charts: {},
      currentChartId: null,
      isLoading: false,
      error: null,
      syncCallbacks: new Set()
    });
  });

  describe('async operations', () => {
    it('should handle addChart with storage', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue({});
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);
      
      const { addChart } = useChordChartStore.getState();
      
      const newChart = createNewChordChart({
        title: 'Test Chart',
        artist: 'Test Artist',
        key: 'C'
      });
      
      await addChart(newChart);
      
      const state = useChordChartStore.getState();
      expect(state.charts[newChart.id]).toBeDefined();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      
      // Check that storage was called
      expect(localforage.setItem).toHaveBeenCalled();
    });

    it('should handle updateChart with storage', async () => {
      // Setup initial chart
      const initialChart = createNewChordChart({
        title: 'Original Title',
        artist: 'Original Artist'
      });
      
      useChordChartStore.setState({
        charts: { [initialChart.id]: initialChart },
        currentChartId: initialChart.id,
        isLoading: false,
        error: null
      });
      
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);
      
      const { updateChart } = useChordChartStore.getState();
      
      await updateChart(initialChart.id, { title: 'Updated Title' });
      
      const state = useChordChartStore.getState();
      expect(state.charts[initialChart.id].title).toBe('Updated Title');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle deleteChart with storage', async () => {
      // Setup initial chart
      const initialChart = createNewChordChart({
        title: 'Chart to Delete',
        artist: 'Test Artist'
      });
      
      useChordChartStore.setState({
        charts: { [initialChart.id]: initialChart },
        currentChartId: initialChart.id,
        isLoading: false,
        error: null
      });
      
      vi.mocked(localforage.getItem).mockResolvedValue({ [initialChart.id]: initialChart });
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);
      
      const { deleteChart } = useChordChartStore.getState();
      
      await deleteChart(initialChart.id);
      
      const state = useChordChartStore.getState();
      expect(state.charts[initialChart.id]).toBeUndefined();
      expect(state.currentChartId).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle createNewChart with storage', async () => {
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);
      
      const { createNewChart } = useChordChartStore.getState();
      
      const newChart = await createNewChart({
        title: 'Created Chart',
        artist: 'Created Artist',
        key: 'D'
      });
      
      expect(newChart).toBeDefined();
      expect(newChart.title).toBe('Created Chart');
      
      const state = useChordChartStore.getState();
      expect(state.charts[newChart.id]).toBeDefined();
      expect(state.currentChartId).toBe(newChart.id);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle storage errors gracefully', async () => {
      vi.mocked(localforage.setItem).mockRejectedValue(new Error('Storage error'));
      
      const { addChart } = useChordChartStore.getState();
      
      const newChart = createNewChordChart({
        title: 'Test Chart',
        artist: 'Test Artist'
      });
      
      await expect(addChart(newChart)).rejects.toThrow();
      
      const state = useChordChartStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should load initial data from storage when available', async () => {
      const storedCharts = {
        'chart-1': createNewChordChart({ title: 'Stored Chart 1' }),
        'chart-2': createNewChordChart({ title: 'Stored Chart 2' })
      };
      
      vi.mocked(localforage.getItem).mockResolvedValue(storedCharts);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);
      
      const { loadInitialData } = useChordChartStore.getState();
      
      await loadInitialData();
      
      const state = useChordChartStore.getState();
      expect(Object.keys(state.charts)).toHaveLength(2);
      expect(state.charts['chart-1']).toBeDefined();
      expect(state.charts['chart-2']).toBeDefined();
      expect(state.currentChartId).toBeTruthy();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should load empty data when storage is empty and no sample data', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue(null);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);
      
      const { loadInitialData } = useChordChartStore.getState();
      
      await loadInitialData();
      
      const state = useChordChartStore.getState();
      expect(Object.keys(state.charts).length).toBe(0);
      expect(state.currentChartId).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      
      // Should still save (empty) data to storage
      expect(localforage.setItem).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should set error state when operations fail', async () => {
      vi.mocked(localforage.setItem).mockRejectedValue(new Error('Storage full'));
      
      const { addChart } = useChordChartStore.getState();
      
      const newChart = createNewChordChart({
        title: 'Test Chart',
        artist: 'Test Artist'
      });
      
      try {
        await addChart(newChart);
      } catch {
        // Expected to throw
      }
      
      const state = useChordChartStore.getState();
      expect(state.error).toBeTruthy();
      expect(state.isLoading).toBe(false);
    });

    it('should clear error state', () => {
      useChordChartStore.setState({ error: 'Test error' });
      
      const { clearError } = useChordChartStore.getState();
      clearError();
      
      const state = useChordChartStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('sync functionality', () => {
    it('should apply synced charts correctly', async () => {
      const mergedCharts: ChordChart[] = [
        createNewChordChart({ title: 'Synced Chart 1', artist: 'Artist 1' }),
        createNewChordChart({ title: 'Synced Chart 2', artist: 'Artist 2' })
      ];

      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const { applySyncedCharts } = useChordChartStore.getState();

      await applySyncedCharts(mergedCharts);

      const state = useChordChartStore.getState();
      expect(Object.keys(state.charts)).toHaveLength(2);
      expect(state.charts[mergedCharts[0].id]).toBeDefined();
      expect(state.charts[mergedCharts[1].id]).toBeDefined();
      expect(state.currentChartId).toBe(mergedCharts[0].id);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      // Check that storage was called
      expect(localforage.setItem).toHaveBeenCalled();
    });

    it('should preserve current chart if it exists in synced data', async () => {
      const existingChart = createNewChordChart({ title: 'Existing Chart' });
      const newChart = createNewChordChart({ title: 'New Chart' });

      // Set initial state with existing chart selected
      useChordChartStore.setState({
        charts: { [existingChart.id]: existingChart },
        currentChartId: existingChart.id,
        isLoading: false,
        error: null,
        syncCallbacks: new Set()
      });

      const mergedCharts: ChordChart[] = [existingChart, newChart];

      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const { applySyncedCharts } = useChordChartStore.getState();

      await applySyncedCharts(mergedCharts);

      const state = useChordChartStore.getState();
      expect(state.currentChartId).toBe(existingChart.id);
    });

    it('should change current chart if current chart is deleted in sync', async () => {
      const deletedChart = createNewChordChart({ title: 'Deleted Chart' });
      const remainingChart = createNewChordChart({ title: 'Remaining Chart' });

      // Set initial state with chart that will be deleted
      useChordChartStore.setState({
        charts: { [deletedChart.id]: deletedChart },
        currentChartId: deletedChart.id,
        isLoading: false,
        error: null,
        syncCallbacks: new Set()
      });

      const mergedCharts: ChordChart[] = [remainingChart]; // deletedChart is not included

      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const { applySyncedCharts } = useChordChartStore.getState();

      await applySyncedCharts(mergedCharts);

      const state = useChordChartStore.getState();
      expect(state.currentChartId).toBe(remainingChart.id);
      expect(state.charts[deletedChart.id]).toBeUndefined();
    });

    it('should handle empty synced charts', async () => {
      const mergedCharts: ChordChart[] = [];

      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const { applySyncedCharts } = useChordChartStore.getState();

      await applySyncedCharts(mergedCharts);

      const state = useChordChartStore.getState();
      expect(Object.keys(state.charts)).toHaveLength(0);
      expect(state.currentChartId).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle applySyncedCharts storage errors', async () => {
      const mergedCharts: ChordChart[] = [
        createNewChordChart({ title: 'Synced Chart' })
      ];

      vi.mocked(localforage.setItem).mockRejectedValue(new Error('Storage error'));

      const { applySyncedCharts } = useChordChartStore.getState();

      await expect(applySyncedCharts(mergedCharts)).rejects.toThrow();

      const state = useChordChartStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should subscribe and unsubscribe sync notifications', () => {
      const callback = vi.fn();

      const { subscribeSyncNotification } = useChordChartStore.getState();

      const unsubscribe = subscribeSyncNotification(callback);

      // Check callback was added
      const state = useChordChartStore.getState();
      expect(state.syncCallbacks.has(callback)).toBe(true);

      // Unsubscribe
      unsubscribe();

      // Check callback was removed
      const newState = useChordChartStore.getState();
      expect(newState.syncCallbacks.has(callback)).toBe(false);
    });

    it('should notify sync callbacks when charts change', async () => {
      const callback = vi.fn();

      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const { subscribeSyncNotification, addChart } = useChordChartStore.getState();

      subscribeSyncNotification(callback);

      const newChart = createNewChordChart({
        title: 'Test Chart',
        artist: 'Test Artist'
      });

      await addChart(newChart);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith([newChart]);
    });

    it('should handle callback errors gracefully', async () => {
      const faultyCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const { subscribeSyncNotification, addChart } = useChordChartStore.getState();

      subscribeSyncNotification(faultyCallback);
      subscribeSyncNotification(normalCallback);

      const newChart = createNewChordChart({
        title: 'Test Chart',
        artist: 'Test Artist'
      });

      await addChart(newChart);

      // Both callbacks should be called despite one throwing
      expect(faultyCallback).toHaveBeenCalledTimes(1);
      expect(normalCallback).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('同期コールバック実行エラー:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should notify callbacks on updateChart', async () => {
      const callback = vi.fn();
      const initialChart = createNewChordChart({ title: 'Original' });

      useChordChartStore.setState({
        charts: { [initialChart.id]: initialChart },
        currentChartId: initialChart.id,
        isLoading: false,
        error: null,
        syncCallbacks: new Set()
      });

      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const { subscribeSyncNotification, updateChart } = useChordChartStore.getState();

      subscribeSyncNotification(callback);

      await updateChart(initialChart.id, { title: 'Updated' });

      expect(callback).toHaveBeenCalledTimes(1);
      const callArgs = callback.mock.calls[0][0];
      expect(callArgs).toHaveLength(1);
      expect(callArgs[0].title).toBe('Updated');
    });

    it('should notify callbacks on deleteChart', async () => {
      const callback = vi.fn();
      const initialChart = createNewChordChart({ title: 'To Delete' });

      useChordChartStore.setState({
        charts: { [initialChart.id]: initialChart },
        currentChartId: initialChart.id,
        isLoading: false,
        error: null,
        syncCallbacks: new Set()
      });

      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const { subscribeSyncNotification, deleteChart } = useChordChartStore.getState();

      subscribeSyncNotification(callback);

      await deleteChart(initialChart.id);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it('should notify callbacks on createNewChart', async () => {
      const callback = vi.fn();

      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const { subscribeSyncNotification, createNewChart } = useChordChartStore.getState();

      subscribeSyncNotification(callback);

      const newChart = await createNewChart({
        title: 'Created Chart',
        artist: 'Created Artist'
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith([newChart]);
    });

    it('should notify callbacks on deleteMultipleCharts', async () => {
      const callback = vi.fn();
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      const chart2 = createNewChordChart({ title: 'Chart 2' });
      const chart3 = createNewChordChart({ title: 'Chart 3' });

      useChordChartStore.setState({
        charts: { 
          [chart1.id]: chart1, 
          [chart2.id]: chart2,
          [chart3.id]: chart3 
        },
        currentChartId: chart1.id,
        isLoading: false,
        error: null,
        syncCallbacks: new Set()
      });

      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const { subscribeSyncNotification, deleteMultipleCharts } = useChordChartStore.getState();

      subscribeSyncNotification(callback);

      await deleteMultipleCharts([chart1.id, chart2.id]);

      expect(callback).toHaveBeenCalledTimes(1);
      const callArgs = callback.mock.calls[0][0];
      expect(callArgs).toHaveLength(1);
      expect(callArgs[0].id).toBe(chart3.id);
    });
  });
});