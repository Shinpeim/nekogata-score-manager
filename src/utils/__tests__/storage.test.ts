import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from '../storage';
import type { ChordChart } from '../../types';

// localforageをモック
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

const mockChart: ChordChart = {
  id: 'test-chart-1',
  title: 'Test Song',
  artist: 'Test Artist',
  key: 'C',
  timeSignature: '4/4',
  tempo: 120,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  sections: [
    {
      id: 'section-1',
      name: 'Verse',
      beatsPerBar: 4,
      chords: [
        { name: 'C', duration: 4 },
        { name: 'Am', duration: 4 }
      ]
    }
  ]
};

describe('storageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveCharts', () => {
    it('should save charts to storage', async () => {
      const charts = { [mockChart.id]: mockChart };
      vi.mocked(localforage.setItem).mockResolvedValue(charts);

      await storageService.saveCharts(charts);

      expect(localforage.setItem).toHaveBeenCalledWith('chord-charts', charts);
    });

    it('should throw error when save fails', async () => {
      const charts = { [mockChart.id]: mockChart };
      vi.mocked(localforage.setItem).mockRejectedValue(new Error('Storage error'));

      await expect(storageService.saveCharts(charts)).rejects.toThrow('コード譜の保存に失敗しました');
    });
  });

  describe('loadCharts', () => {
    it('should load charts from storage', async () => {
      const charts = { [mockChart.id]: mockChart };
      vi.mocked(localforage.getItem).mockResolvedValue(charts);

      const result = await storageService.loadCharts();

      expect(localforage.getItem).toHaveBeenCalledWith('chord-charts');
      expect(result).toEqual(charts);
    });

    it('should return null when no data exists', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue(null);

      const result = await storageService.loadCharts();

      expect(result).toBeNull();
    });

    it('should throw error when load fails', async () => {
      vi.mocked(localforage.getItem).mockRejectedValue(new Error('Storage error'));

      await expect(storageService.loadCharts()).rejects.toThrow('コード譜の読み込みに失敗しました');
    });
  });

  describe('saveChart', () => {
    it('should save single chart', async () => {
      const existingCharts = {};
      vi.mocked(localforage.getItem).mockResolvedValue(existingCharts);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      await storageService.saveChart(mockChart);

      expect(localforage.getItem).toHaveBeenCalledWith('chord-charts');
      expect(localforage.setItem).toHaveBeenCalledWith('chord-charts', {
        [mockChart.id]: mockChart
      });
    });

    it('should update existing chart', async () => {
      const existingCharts = { 'other-chart': { id: 'other-chart' } };
      vi.mocked(localforage.getItem).mockResolvedValue(existingCharts);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      await storageService.saveChart(mockChart);

      expect(localforage.setItem).toHaveBeenCalledWith('chord-charts', {
        'other-chart': { id: 'other-chart', sections: [] },
        [mockChart.id]: mockChart
      });
    });
  });

  describe('deleteChart', () => {
    it('should delete chart from storage', async () => {
      const existingCharts = {
        [mockChart.id]: mockChart,
        'other-chart': { id: 'other-chart' }
      };
      vi.mocked(localforage.getItem).mockResolvedValue(existingCharts);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      await storageService.deleteChart(mockChart.id);

      expect(localforage.setItem).toHaveBeenCalledWith('chord-charts', {
        'other-chart': { id: 'other-chart', sections: [] }
      });
    });
  });

  describe('clearStorage', () => {
    it('should clear storage', async () => {
      vi.mocked(localforage.removeItem).mockResolvedValue(undefined);

      await storageService.clearStorage();

      expect(localforage.removeItem).toHaveBeenCalledWith('chord-charts');
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage information', async () => {
      const charts = { [mockChart.id]: mockChart };
      vi.mocked(localforage.getItem).mockResolvedValue(charts);

      const info = await storageService.getStorageInfo();

      expect(info.length).toBe(1);
      expect(info.size).toBeGreaterThan(0);
    });

    it('should return zero values when storage is empty', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue(null);

      const info = await storageService.getStorageInfo();

      expect(info.length).toBe(0);
      expect(info.size).toBeGreaterThan(0); // JSON.stringify({}) still has size
    });
  });

  describe('validateCharts', () => {
    it('should validate correct charts', async () => {
      const charts = { [mockChart.id]: mockChart };
      vi.mocked(localforage.getItem).mockResolvedValue(charts);

      const isValid = await storageService.validateCharts();

      expect(isValid).toBe(true);
    });

    it('should return false for invalid charts', async () => {
      const invalidChart = { ...mockChart, title: '' };
      const charts = { [invalidChart.id]: invalidChart };
      vi.mocked(localforage.getItem).mockResolvedValue(charts);

      const isValid = await storageService.validateCharts();

      expect(isValid).toBe(false);
    });

    it('should return true when no charts exist', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue(null);

      const isValid = await storageService.validateCharts();

      expect(isValid).toBe(true);
    });
  });
});