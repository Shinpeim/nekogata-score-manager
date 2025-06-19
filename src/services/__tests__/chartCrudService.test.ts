import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chartCrudService } from '../chartCrudService';
import { createNewChordChart } from '../../utils/chordCreation';
import type { ChordChart } from '../../types/chord';

// Mock dependencies
vi.mock('../../utils/storage', () => ({
  storageService: {
    saveChart: vi.fn().mockResolvedValue(undefined),
    deleteChart: vi.fn().mockResolvedValue(undefined),
    deleteMultipleCharts: vi.fn().mockResolvedValue(undefined),
    loadCharts: vi.fn().mockResolvedValue({}),
    saveCharts: vi.fn().mockResolvedValue(undefined),
    addDeletedChart: vi.fn().mockResolvedValue(undefined),
    addMultipleDeletedCharts: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../../utils/sync/deviceId', () => ({
  getDeviceId: vi.fn().mockReturnValue('test-device-id')
}));

vi.mock('../../utils/chordCreation');

import { storageService } from '../../utils/storage';
import { getDeviceId } from '../../utils/sync/deviceId';

describe('ChartCrudService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createChart', () => {
    it('should create and save a new chart', async () => {
      const chartData = { title: 'Test Chart', artist: 'Test Artist' };
      const mockChart = { id: 'test-id', ...chartData } as ChordChart;
      
      vi.mocked(createNewChordChart).mockReturnValue(mockChart);
      
      const result = await chartCrudService.createChart(chartData);
      
      expect(createNewChordChart).toHaveBeenCalledWith(chartData);
      expect(storageService.saveChart).toHaveBeenCalledWith(mockChart);
      expect(result).toBe(mockChart);
    });
  });

  describe('updateChart', () => {
    it('should update existing chart with new data', async () => {
      const existingChart: ChordChart = {
        id: 'test-id',
        title: 'Original Title',
        artist: 'Original Artist',
        key: 'C',
        tempo: 120,
        timeSignature: '4/4',
        sections: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        version: '2.0.0'
      };

      const updates = { title: 'Updated Title', artist: 'Updated Artist' };
      
      const result = await chartCrudService.updateChart(existingChart, updates);
      
      expect(result.title).toBe('Updated Title');
      expect(result.artist).toBe('Updated Artist');
      expect(result.id).toBe('test-id');
      expect(result.updatedAt.getTime()).toBeGreaterThan(existingChart.updatedAt.getTime());
      expect(storageService.saveChart).toHaveBeenCalledWith(result);
    });
  });

  describe('deleteChart', () => {
    it('should delete chart and add deletion record', async () => {
      const chartId = 'chart-to-delete';
      
      await chartCrudService.deleteChart(chartId);
      
      expect(storageService.deleteChart).toHaveBeenCalledWith(chartId);
      expect(storageService.addDeletedChart).toHaveBeenCalledWith(chartId, 'test-device-id');
      expect(getDeviceId).toHaveBeenCalled();
    });

    it('should handle deletion errors properly', async () => {
      const chartId = 'chart-to-delete';
      const error = new Error('Storage deletion failed');
      
      vi.mocked(storageService.deleteChart).mockRejectedValue(error);
      
      await expect(chartCrudService.deleteChart(chartId)).rejects.toThrow(error);
      expect(storageService.addDeletedChart).not.toHaveBeenCalled();
    });
  });

  describe('deleteMultipleCharts', () => {
    it('should delete multiple charts and add deletion records', async () => {
      const chartIds = ['chart-1', 'chart-2', 'chart-3'];
      
      await chartCrudService.deleteMultipleCharts(chartIds);
      
      expect(storageService.deleteMultipleCharts).toHaveBeenCalledWith(chartIds);
      expect(storageService.addMultipleDeletedCharts).toHaveBeenCalledWith(chartIds, 'test-device-id');
      expect(getDeviceId).toHaveBeenCalled();
    });

    it('should handle multiple deletion errors properly', async () => {
      const chartIds = ['chart-1', 'chart-2'];
      const error = new Error('Multiple deletion failed');
      
      vi.mocked(storageService.deleteMultipleCharts).mockRejectedValueOnce(error);
      
      await expect(chartCrudService.deleteMultipleCharts(chartIds)).rejects.toThrow(error);
      expect(storageService.addMultipleDeletedCharts).not.toHaveBeenCalled();
    });

    it('should work with empty array', async () => {
      const chartIds: string[] = [];
      
      // リセットしてから実行
      vi.mocked(storageService.deleteMultipleCharts).mockResolvedValue(undefined);
      
      await chartCrudService.deleteMultipleCharts(chartIds);
      
      expect(storageService.deleteMultipleCharts).toHaveBeenCalledWith(chartIds);
      expect(storageService.addMultipleDeletedCharts).toHaveBeenCalledWith(chartIds, 'test-device-id');
    });
  });

  describe('loadInitialData', () => {
    it('should load charts from storage', async () => {
      const mockCharts = {
        'chart-1': { id: 'chart-1', title: 'Chart 1' } as ChordChart,
        'chart-2': { id: 'chart-2', title: 'Chart 2' } as ChordChart
      };
      
      vi.mocked(storageService.loadCharts).mockResolvedValue(mockCharts);
      
      const result = await chartCrudService.loadInitialData();
      
      expect(result).toBe(mockCharts);
      expect(storageService.loadCharts).toHaveBeenCalled();
    });

    it('should initialize empty storage when no charts exist', async () => {
      vi.mocked(storageService.loadCharts).mockResolvedValue(null);
      
      const result = await chartCrudService.loadInitialData();
      
      expect(result).toEqual({});
      expect(storageService.saveCharts).toHaveBeenCalledWith({});
    });
  });

  describe('reloadFromStorage', () => {
    it('should reload charts from storage', async () => {
      const mockCharts = {
        'chart-1': { id: 'chart-1', title: 'Chart 1' } as ChordChart
      };
      
      vi.mocked(storageService.loadCharts).mockResolvedValue(mockCharts);
      
      const result = await chartCrudService.reloadFromStorage();
      
      expect(result).toBe(mockCharts);
      expect(storageService.loadCharts).toHaveBeenCalled();
    });

    it('should return empty object when storage is null', async () => {
      vi.mocked(storageService.loadCharts).mockResolvedValue(null);
      
      const result = await chartCrudService.reloadFromStorage();
      
      expect(result).toEqual({});
    });
  });

  describe('applySyncedCharts', () => {
    it('should convert chart array to library format and save', async () => {
      const charts: ChordChart[] = [
        { id: 'chart-1', title: 'Chart 1' } as ChordChart,
        { id: 'chart-2', title: 'Chart 2' } as ChordChart
      ];
      
      const result = await chartCrudService.applySyncedCharts(charts);
      
      const expectedLibrary = {
        'chart-1': charts[0],
        'chart-2': charts[1]
      };
      
      expect(result).toEqual(expectedLibrary);
      expect(storageService.saveCharts).toHaveBeenCalledWith(expectedLibrary);
    });

    it('should handle empty chart array', async () => {
      const charts: ChordChart[] = [];
      
      const result = await chartCrudService.applySyncedCharts(charts);
      
      expect(result).toEqual({});
      expect(storageService.saveCharts).toHaveBeenCalledWith({});
    });
  });
});