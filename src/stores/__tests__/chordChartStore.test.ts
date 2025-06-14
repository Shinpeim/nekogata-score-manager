import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChordChartStore } from '../chordChartStore';
import { createNewChordChart } from '../../utils/chordUtils';

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

describe('chordChartStore integration with storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChordChartStore.setState({
      charts: {},
      currentChartId: null,
      isLoading: false,
      error: null
    });
  });

  describe('async operations', () => {
    it('should handle addChart with storage', async () => {
      (localforage.getItem as any).mockResolvedValue({});
      (localforage.setItem as any).mockResolvedValue(undefined);
      
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
      
      (localforage.setItem as any).mockResolvedValue(undefined);
      
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
      
      (localforage.getItem as any).mockResolvedValue({ [initialChart.id]: initialChart });
      (localforage.setItem as any).mockResolvedValue(undefined);
      
      const { deleteChart } = useChordChartStore.getState();
      
      await deleteChart(initialChart.id);
      
      const state = useChordChartStore.getState();
      expect(state.charts[initialChart.id]).toBeUndefined();
      expect(state.currentChartId).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle createNewChart with storage', async () => {
      (localforage.setItem as any).mockResolvedValue(undefined);
      
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
      (localforage.setItem as any).mockRejectedValue(new Error('Storage error'));
      
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
      
      (localforage.getItem as any).mockResolvedValue(storedCharts);
      
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

    it('should load sample data when storage is empty', async () => {
      (localforage.getItem as any).mockResolvedValue(null);
      (localforage.setItem as any).mockResolvedValue(undefined);
      
      const { loadInitialData } = useChordChartStore.getState();
      
      await loadInitialData();
      
      const state = useChordChartStore.getState();
      expect(Object.keys(state.charts).length).toBeGreaterThan(0);
      expect(state.currentChartId).toBeTruthy();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      
      // Should save sample data to storage
      expect(localforage.setItem).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should set error state when operations fail', async () => {
      (localforage.setItem as any).mockRejectedValue(new Error('Storage full'));
      
      const { addChart } = useChordChartStore.getState();
      
      const newChart = createNewChordChart({
        title: 'Test Chart',
        artist: 'Test Artist'
      });
      
      try {
        await addChart(newChart);
      } catch (error) {
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
});