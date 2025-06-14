import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChordChartStore } from '../chordChartStore';
import { createNewChordChart } from '../../utils/chordUtils';
// ChordChart type is used in the mock data and test functions

// Mock the sampleCharts to avoid dependency on external data
vi.mock('../../data/sampleCharts', () => ({
  sampleCharts: [
    {
      id: 'sample-1',
      title: 'Sample Chart 1',
      artist: 'Test Artist',
      key: 'C',
      tempo: 120,
      timeSignature: '4/4',
      sections: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      tags: ['test'],
      notes: 'Test notes'
    },
    {
      id: 'sample-2',
      title: 'Sample Chart 2',
      artist: 'Test Artist 2',
      key: 'G',
      tempo: 140,
      timeSignature: '4/4',
      sections: [],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      tags: ['test2'],
      notes: 'Test notes 2'
    }
  ]
}));

describe('chordChartStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useChordChartStore.setState({
      charts: {},
      currentChartId: null
    });
  });

  describe('Initial State', () => {
    it('should have empty initial state', () => {
      const state = useChordChartStore.getState();
      expect(state.charts).toEqual({});
      expect(state.currentChartId).toBeNull();
    });
  });

  describe('loadInitialData', () => {
    it('should load sample charts and set current chart', () => {
      const { loadInitialData } = useChordChartStore.getState();
      
      loadInitialData();
      
      const state = useChordChartStore.getState();
      expect(Object.keys(state.charts)).toHaveLength(2);
      expect(state.charts['sample-1']).toBeDefined();
      expect(state.charts['sample-2']).toBeDefined();
      expect(state.currentChartId).toBe('sample-1');
    });
  });

  describe('addChart', () => {
    it('should add a new chart to the store', () => {
      const { addChart } = useChordChartStore.getState();
      const newChart = createNewChordChart({
        title: 'New Test Chart',
        artist: 'Test Artist'
      });

      addChart(newChart);

      const state = useChordChartStore.getState();
      expect(state.charts[newChart.id]).toEqual(newChart);
    });

    it('should not affect other charts when adding new one', () => {
      const { loadInitialData, addChart } = useChordChartStore.getState();
      
      loadInitialData();
      const initialState = useChordChartStore.getState();
      const initialChartsCount = Object.keys(initialState.charts).length;

      const newChart = createNewChordChart({ title: 'Additional Chart' });
      addChart(newChart);

      const finalState = useChordChartStore.getState();
      expect(Object.keys(finalState.charts)).toHaveLength(initialChartsCount + 1);
      expect(finalState.charts['sample-1']).toBeDefined();
      expect(finalState.charts[newChart.id]).toBeDefined();
    });
  });

  describe('updateChart', () => {
    beforeEach(() => {
      const { loadInitialData } = useChordChartStore.getState();
      loadInitialData();
    });

    it('should update an existing chart', () => {
      const { updateChart } = useChordChartStore.getState();
      
      const updates = {
        title: 'Updated Title',
        artist: 'Updated Artist'
      };

      updateChart('sample-1', updates);

      const state = useChordChartStore.getState();
      const updatedChart = state.charts['sample-1'];
      
      expect(updatedChart.title).toBe('Updated Title');
      expect(updatedChart.artist).toBe('Updated Artist');
      expect(updatedChart.key).toBe('C'); // unchanged
      expect(updatedChart.updatedAt).toBeInstanceOf(Date);
    });

    it('should not update non-existent chart', () => {
      const { updateChart } = useChordChartStore.getState();
      const initialState = useChordChartStore.getState();

      updateChart('non-existent-id', { title: 'Should not work' });

      const finalState = useChordChartStore.getState();
      expect(finalState.charts).toEqual(initialState.charts);
    });

    it('should update the updatedAt timestamp', () => {
      const { updateChart } = useChordChartStore.getState();
      const originalChart = useChordChartStore.getState().charts['sample-1'];
      const originalUpdatedAt = originalChart.updatedAt;

      // Wait a bit to ensure different timestamp
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      updateChart('sample-1', { title: 'New Title' });

      const updatedChart = useChordChartStore.getState().charts['sample-1'];
      expect(updatedChart.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      
      vi.useRealTimers();
    });
  });

  describe('deleteChart', () => {
    beforeEach(() => {
      const { loadInitialData } = useChordChartStore.getState();
      loadInitialData();
    });

    it('should delete an existing chart', () => {
      const { deleteChart } = useChordChartStore.getState();
      
      deleteChart('sample-1');

      const state = useChordChartStore.getState();
      expect(state.charts['sample-1']).toBeUndefined();
      expect(state.charts['sample-2']).toBeDefined();
    });

    it('should clear currentChartId if deleted chart was current', () => {
      const { deleteChart, setCurrentChart } = useChordChartStore.getState();
      
      setCurrentChart('sample-1');
      expect(useChordChartStore.getState().currentChartId).toBe('sample-1');

      deleteChart('sample-1');

      expect(useChordChartStore.getState().currentChartId).toBeNull();
    });

    it('should keep currentChartId if deleted chart was not current', () => {
      const { deleteChart, setCurrentChart } = useChordChartStore.getState();
      
      setCurrentChart('sample-2');
      deleteChart('sample-1');

      expect(useChordChartStore.getState().currentChartId).toBe('sample-2');
    });

    it('should handle deletion of non-existent chart gracefully', () => {
      const { deleteChart } = useChordChartStore.getState();
      const initialState = useChordChartStore.getState();

      deleteChart('non-existent-id');

      const finalState = useChordChartStore.getState();
      expect(finalState.charts).toEqual(initialState.charts);
      expect(finalState.currentChartId).toBe(initialState.currentChartId);
    });
  });

  describe('setCurrentChart', () => {
    beforeEach(() => {
      const { loadInitialData } = useChordChartStore.getState();
      loadInitialData();
    });

    it('should set current chart ID', () => {
      const { setCurrentChart } = useChordChartStore.getState();
      
      setCurrentChart('sample-2');

      expect(useChordChartStore.getState().currentChartId).toBe('sample-2');
    });

    it('should allow setting current chart to null', () => {
      const { setCurrentChart } = useChordChartStore.getState();
      
      setCurrentChart('sample-1');
      expect(useChordChartStore.getState().currentChartId).toBe('sample-1');

      setCurrentChart(null);
      expect(useChordChartStore.getState().currentChartId).toBeNull();
    });
  });

  describe('createNewChart', () => {
    it('should create and add new chart, then set it as current', () => {
      const { createNewChart } = useChordChartStore.getState();
      
      const chartData = {
        title: 'Created Chart',
        artist: 'Created Artist',
        key: 'D'
      };

      const newChart = createNewChart(chartData);

      const state = useChordChartStore.getState();
      expect(state.charts[newChart.id]).toEqual(newChart);
      expect(state.currentChartId).toBe(newChart.id);
      expect(newChart.title).toBe('Created Chart');
      expect(newChart.artist).toBe('Created Artist');
      expect(newChart.key).toBe('D');
    });

    it('should return the created chart', () => {
      const { createNewChart } = useChordChartStore.getState();
      
      const result = createNewChart({ title: 'Test Return' });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe('Test Return');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Store Integration', () => {
    it('should maintain data integrity across multiple operations', () => {
      const { loadInitialData, createNewChart, updateChart, setCurrentChart, deleteChart } = useChordChartStore.getState();

      // Load initial data
      loadInitialData();
      expect(Object.keys(useChordChartStore.getState().charts)).toHaveLength(2);

      // Create new chart
      const newChart = createNewChart({ title: 'Integration Test' });
      expect(Object.keys(useChordChartStore.getState().charts)).toHaveLength(3);
      expect(useChordChartStore.getState().currentChartId).toBe(newChart.id);

      // Update chart
      updateChart(newChart.id, { artist: 'Updated Artist' });
      expect(useChordChartStore.getState().charts[newChart.id].artist).toBe('Updated Artist');

      // Change current chart
      setCurrentChart('sample-1');
      expect(useChordChartStore.getState().currentChartId).toBe('sample-1');

      // Delete chart
      deleteChart(newChart.id);
      expect(Object.keys(useChordChartStore.getState().charts)).toHaveLength(2);
      expect(useChordChartStore.getState().currentChartId).toBe('sample-1'); // unchanged
    });
  });
});