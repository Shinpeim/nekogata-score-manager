import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChartCrudStore } from '../chartCrudStore';
import { useChartDataStore } from '../chartDataStore';
import { createNewChordChart } from '../../utils/chordCreation';

// Mock storage service
vi.mock('../../utils/storage', () => ({
  storageService: {
    saveChart: vi.fn(),
    deleteChart: vi.fn(),
    deleteMultipleCharts: vi.fn(),
    loadCharts: vi.fn(),
    saveCharts: vi.fn()
  }
}));

// Mock localforage
vi.mock('localforage', () => ({
  default: {
    config: vi.fn(),
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn()
  }
}));

import { storageService } from '../../utils/storage';

describe('chartCrudStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset both stores
    useChartCrudStore.setState({
      isLoading: false,
      error: null,
      syncCallbacks: new Set()
    });
    
    useChartDataStore.setState({
      charts: {},
      currentChartId: null
    });
  });

  describe('CRUD operations', () => {
    it('should add chart successfully', async () => {
      const chart = createNewChordChart({ title: 'Test Chart' });
      
      vi.mocked(storageService.saveChart).mockResolvedValue(undefined);
      
      const { addChart } = useChartCrudStore.getState();
      
      await addChart(chart);
      
      const crudState = useChartCrudStore.getState();
      const dataState = useChartDataStore.getState();
      
      expect(crudState.isLoading).toBe(false);
      expect(crudState.error).toBeNull();
      expect(dataState.charts[chart.id]).toEqual(chart);
      expect(storageService.saveChart).toHaveBeenCalledWith(chart);
    });

    it('should handle add chart error', async () => {
      const chart = createNewChordChart({ title: 'Test Chart' });
      const error = new Error('Storage error');
      
      vi.mocked(storageService.saveChart).mockRejectedValue(error);
      
      const { addChart } = useChartCrudStore.getState();
      
      await expect(addChart(chart)).rejects.toThrow('Storage error');
      
      const crudState = useChartCrudStore.getState();
      expect(crudState.isLoading).toBe(false);
      expect(crudState.error).toBe('Storage error');
    });

    it('should update chart successfully', async () => {
      const chart = createNewChordChart({ title: 'Original Title' });
      const update = { title: 'Updated Title' };
      
      // Setup initial data
      useChartDataStore.getState().addChartToData(chart);
      
      vi.mocked(storageService.saveChart).mockResolvedValue(undefined);
      
      const { updateChart } = useChartCrudStore.getState();
      
      await updateChart(chart.id, update);
      
      const crudState = useChartCrudStore.getState();
      const dataState = useChartDataStore.getState();
      
      expect(crudState.isLoading).toBe(false);
      expect(crudState.error).toBeNull();
      expect(dataState.charts[chart.id].title).toBe('Updated Title');
      expect(storageService.saveChart).toHaveBeenCalled();
    });

    it('should handle update chart error for non-existent chart', async () => {
      const { updateChart } = useChartCrudStore.getState();
      
      await expect(updateChart('non-existent-id', { title: 'Updated' })).rejects.toThrow('更新対象のコード譜が見つかりません');
      
      const crudState = useChartCrudStore.getState();
      expect(crudState.isLoading).toBe(false);
      expect(crudState.error).toBe('更新対象のコード譜が見つかりません');
    });

    it('should delete chart successfully', async () => {
      const chart = createNewChordChart({ title: 'Chart to Delete' });
      
      // Setup initial data
      useChartDataStore.getState().addChartToData(chart);
      useChartDataStore.getState().setCurrentChart(chart.id);
      
      vi.mocked(storageService.deleteChart).mockResolvedValue(undefined);
      
      const { deleteChart } = useChartCrudStore.getState();
      
      await deleteChart(chart.id);
      
      const crudState = useChartCrudStore.getState();
      const dataState = useChartDataStore.getState();
      
      expect(crudState.isLoading).toBe(false);
      expect(crudState.error).toBeNull();
      expect(dataState.charts[chart.id]).toBeUndefined();
      expect(dataState.currentChartId).toBeNull();
      expect(storageService.deleteChart).toHaveBeenCalledWith(chart.id);
    });

    it('should delete multiple charts successfully', async () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      const chart2 = createNewChordChart({ title: 'Chart 2' });
      const chart3 = createNewChordChart({ title: 'Chart 3' });
      
      // Setup initial data
      const dataStore = useChartDataStore.getState();
      dataStore.addChartToData(chart1);
      dataStore.addChartToData(chart2);
      dataStore.addChartToData(chart3);
      dataStore.setCurrentChart(chart1.id);
      
      vi.mocked(storageService.deleteMultipleCharts).mockResolvedValue(undefined);
      
      const { deleteMultipleCharts } = useChartCrudStore.getState();
      
      await deleteMultipleCharts([chart1.id, chart2.id]);
      
      const crudState = useChartCrudStore.getState();
      const dataState = useChartDataStore.getState();
      
      expect(crudState.isLoading).toBe(false);
      expect(crudState.error).toBeNull();
      expect(dataState.charts[chart1.id]).toBeUndefined();
      expect(dataState.charts[chart2.id]).toBeUndefined();
      expect(dataState.charts[chart3.id]).toBeDefined();
      expect(dataState.currentChartId).toBe(chart3.id);
      expect(storageService.deleteMultipleCharts).toHaveBeenCalledWith([chart1.id, chart2.id]);
    });

    it('should create new chart successfully', async () => {
      const chartData = { title: 'New Chart', artist: 'New Artist' };
      
      vi.mocked(storageService.saveChart).mockResolvedValue(undefined);
      
      const { createNewChart } = useChartCrudStore.getState();
      
      const newChart = await createNewChart(chartData);
      
      const crudState = useChartCrudStore.getState();
      const dataState = useChartDataStore.getState();
      
      expect(crudState.isLoading).toBe(false);
      expect(crudState.error).toBeNull();
      expect(newChart.title).toBe('New Chart');
      expect(dataState.charts[newChart.id]).toEqual(newChart);
      expect(dataState.currentChartId).toBe(newChart.id);
      expect(storageService.saveChart).toHaveBeenCalledWith(newChart);
    });
  });

  describe('storage operations', () => {
    it('should load initial data when storage has data', async () => {
      const chart1 = createNewChordChart({ title: 'Stored Chart 1' });
      const chart2 = createNewChordChart({ title: 'Stored Chart 2' });
      const storedCharts = { [chart1.id]: chart1, [chart2.id]: chart2 };
      
      vi.mocked(storageService.loadCharts).mockResolvedValue(storedCharts);
      
      const { loadInitialData } = useChartCrudStore.getState();
      
      await loadInitialData();
      
      const crudState = useChartCrudStore.getState();
      const dataState = useChartDataStore.getState();
      
      expect(crudState.isLoading).toBe(false);
      expect(crudState.error).toBeNull();
      expect(dataState.charts).toEqual(storedCharts);
      expect(dataState.currentChartId).toBeTruthy();
    });

    it('should load initial data when storage is empty', async () => {
      vi.mocked(storageService.loadCharts).mockResolvedValue(null);
      vi.mocked(storageService.saveCharts).mockResolvedValue(undefined);
      
      const { loadInitialData } = useChartCrudStore.getState();
      
      await loadInitialData();
      
      const crudState = useChartCrudStore.getState();
      const dataState = useChartDataStore.getState();
      
      expect(crudState.isLoading).toBe(false);
      expect(crudState.error).toBeNull();
      expect(dataState.charts).toEqual({});
      expect(dataState.currentChartId).toBeNull();
      expect(storageService.saveCharts).toHaveBeenCalledWith({});
    });

    it('should apply synced charts', async () => {
      const chart1 = createNewChordChart({ title: 'Synced Chart 1' });
      const chart2 = createNewChordChart({ title: 'Synced Chart 2' });
      const mergedCharts = [chart1, chart2];
      
      vi.mocked(storageService.saveCharts).mockResolvedValue(undefined);
      
      const { applySyncedCharts } = useChartCrudStore.getState();
      
      await applySyncedCharts(mergedCharts);
      
      const crudState = useChartCrudStore.getState();
      const dataState = useChartDataStore.getState();
      
      expect(crudState.isLoading).toBe(false);
      expect(crudState.error).toBeNull();
      expect(Object.keys(dataState.charts)).toHaveLength(2);
      expect(dataState.charts[chart1.id]).toBeDefined();
      expect(dataState.charts[chart2.id]).toBeDefined();
      expect(dataState.currentChartId).toBe(chart1.id);
    });
  });

  describe('sync notifications', () => {
    it('should subscribe and notify sync callbacks', async () => {
      const callback = vi.fn();
      const chart = createNewChordChart({ title: 'Test Chart' });
      
      vi.mocked(storageService.saveChart).mockResolvedValue(undefined);
      
      const { subscribeSyncNotification, addChart } = useChartCrudStore.getState();
      
      const unsubscribe = subscribeSyncNotification(callback);
      
      await addChart(chart);
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith([chart]);
      
      // Test unsubscribe
      unsubscribe();
      
      await addChart(createNewChordChart({ title: 'Another Chart' }));
      
      // Callback should not be called again
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle callback errors gracefully', async () => {
      const faultyCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const chart = createNewChordChart({ title: 'Test Chart' });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(storageService.saveChart).mockResolvedValue(undefined);
      
      const { subscribeSyncNotification, addChart } = useChartCrudStore.getState();
      
      subscribeSyncNotification(faultyCallback);
      
      await addChart(chart);
      
      expect(consoleSpy).toHaveBeenCalledWith('同期コールバック実行エラー:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should clear error', () => {
      useChartCrudStore.setState({ error: 'Test error' });
      
      const { clearError } = useChartCrudStore.getState();
      clearError();
      
      const state = useChartCrudStore.getState();
      expect(state.error).toBeNull();
    });
  });
});