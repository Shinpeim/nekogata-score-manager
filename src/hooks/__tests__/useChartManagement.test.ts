import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChartManagement } from '../useChartManagement';
import { useChartDataStore } from '../../stores/chartDataStore';
import { useChartCrudStore } from '../../stores/chartCrudStore';
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

describe('useChartManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset stores
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

  it('should provide all expected properties and methods', () => {
    const { result } = renderHook(() => useChartManagement());

    // Data store properties
    expect(result.current).toHaveProperty('charts');
    expect(result.current).toHaveProperty('currentChartId');
    expect(result.current).toHaveProperty('setCurrentChart');
    expect(result.current).toHaveProperty('getCurrentChart');
    expect(result.current).toHaveProperty('getChartById');
    expect(result.current).toHaveProperty('getChartsArray');
    expect(result.current).toHaveProperty('hasCharts');
    expect(result.current).toHaveProperty('getChartsCount');

    // CRUD store properties
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('addChart');
    expect(result.current).toHaveProperty('updateChart');
    expect(result.current).toHaveProperty('deleteChart');
    expect(result.current).toHaveProperty('deleteMultipleCharts');
    expect(result.current).toHaveProperty('createNewChart');
    expect(result.current).toHaveProperty('loadInitialData');
    expect(result.current).toHaveProperty('loadFromStorage');
    expect(result.current).toHaveProperty('clearError');

    // Sync properties
    expect(result.current).toHaveProperty('applySyncedCharts');
    expect(result.current).toHaveProperty('subscribeSyncNotification');
    expect(result.current).toHaveProperty('notifySyncCallbacks');
    expect(result.current).toHaveProperty('syncCallbacks');
  });

  it('should reflect data store state changes', () => {
    const chart = createNewChordChart({ title: 'Test Chart' });
    
    const { result, rerender } = renderHook(() => useChartManagement());

    // Initially empty
    expect(result.current.charts).toEqual({});
    expect(result.current.currentChartId).toBeNull();
    expect(result.current.hasCharts()).toBe(false);
    expect(result.current.getChartsCount()).toBe(0);

    // Add chart to data store
    useChartDataStore.getState().addChartToData(chart);
    useChartDataStore.getState().setCurrentChart(chart.id);
    
    rerender();

    // Should reflect changes
    expect(result.current.charts[chart.id]).toEqual(chart);
    expect(result.current.currentChartId).toBe(chart.id);
    expect(result.current.getCurrentChart()).toEqual(chart);
    expect(result.current.getChartById(chart.id)).toEqual(chart);
    expect(result.current.hasCharts()).toBe(true);
    expect(result.current.getChartsCount()).toBe(1);
    expect(result.current.getChartsArray()).toContain(chart);
  });

  it('should reflect crud store state changes', () => {
    const { result, rerender } = renderHook(() => useChartManagement());

    // Initially not loading, no error
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // Set loading and error
    useChartCrudStore.setState({
      isLoading: true,
      error: 'Test error'
    });
    
    rerender();

    // Should reflect changes
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Test error');
  });

  it('should provide working CRUD methods', () => {
    const { result } = renderHook(() => useChartManagement());

    // Should have all CRUD methods
    expect(typeof result.current.addChart).toBe('function');
    expect(typeof result.current.updateChart).toBe('function');
    expect(typeof result.current.deleteChart).toBe('function');
    expect(typeof result.current.deleteMultipleCharts).toBe('function');
    expect(typeof result.current.createNewChart).toBe('function');
    expect(typeof result.current.loadInitialData).toBe('function');
    expect(typeof result.current.loadFromStorage).toBe('function');
    expect(typeof result.current.applySyncedCharts).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should provide working sync methods', () => {
    const { result } = renderHook(() => useChartManagement());

    // Should have sync methods
    expect(typeof result.current.subscribeSyncNotification).toBe('function');
    expect(typeof result.current.notifySyncCallbacks).toBe('function');
    expect(result.current.syncCallbacks).toBeInstanceOf(Set);
  });

  it('should work as a drop-in replacement for useChordChartStore', () => {
    // This test ensures interface compatibility
    const { result } = renderHook(() => useChartManagement());

    // Check that all required properties from the original interface exist
    const requiredProperties = [
      'charts', 'currentChartId', 'isLoading', 'error', 'syncCallbacks',
      'addChart', 'updateChart', 'deleteChart', 'deleteMultipleCharts',
      'setCurrentChart', 'loadInitialData', 'loadFromStorage', 'createNewChart',
      'clearError', 'applySyncedCharts', 'subscribeSyncNotification', 'notifySyncCallbacks'
    ];

    requiredProperties.forEach(prop => {
      expect(result.current).toHaveProperty(prop);
    });
  });

  it('should maintain reactivity between stores', () => {
    const chart = createNewChordChart({ title: 'Test Chart' });
    
    const { result, rerender } = renderHook(() => useChartManagement());

    // Initially empty
    expect(result.current.getChartsCount()).toBe(0);
    expect(result.current.isLoading).toBe(false);

    // Simulate CRUD operation effect on both stores
    useChartDataStore.getState().addChartToData(chart);
    useChartCrudStore.setState({ isLoading: true });
    
    rerender();

    // Both changes should be reflected
    expect(result.current.getChartsCount()).toBe(1);
    expect(result.current.isLoading).toBe(true);
  });
});