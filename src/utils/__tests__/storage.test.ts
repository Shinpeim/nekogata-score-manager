import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from '../storage';
import type { ChordChart } from '../../types';
import type { VersionedChordLibrary } from '../migration';

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
      barsCount: 4,
      chords: [
        { name: 'C', root: 'C', duration: 4 },
        { name: 'Am', root: 'A', duration: 4 }
      ]
    }
  ],
  notes: '' // マイグレーション後の形式
};

describe('storageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveCharts', () => {
    it('should save charts to storage with version info', async () => {
      const charts = { [mockChart.id]: mockChart };
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      await storageService.saveCharts(charts);

      expect(localforage.setItem).toHaveBeenCalledWith('chord-charts', expect.objectContaining({
        version: 2,
        data: charts,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      }));
    });

    it('should throw error when save fails', async () => {
      const charts = { [mockChart.id]: mockChart };
      vi.mocked(localforage.setItem).mockRejectedValue(new Error('Storage error'));

      await expect(storageService.saveCharts(charts)).rejects.toThrow('コード譜の保存に失敗しました');
    });
  });

  describe('loadCharts', () => {
    it('should load charts from versioned storage', async () => {
      const charts = { [mockChart.id]: mockChart };
      const versionedData: VersionedChordLibrary = {
        version: 2,
        data: charts,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      vi.mocked(localforage.getItem).mockResolvedValue(versionedData);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const result = await storageService.loadCharts();

      expect(localforage.getItem).toHaveBeenCalledWith('chord-charts');
      expect(result).toEqual(charts);
    });

    it('should migrate old data format', async () => {
      // 古い形式のデータ（notesなし、beatsPerBarが間違っている）
      const oldChart = {
        ...mockChart,
        notes: undefined,
        sections: [{
          ...mockChart.sections[0],
          beatsPerBar: 4 // 4/4拍子なので正しいが、マイグレーション処理は通る
        }]
      };
      const oldCharts = { [oldChart.id]: oldChart };
      
      vi.mocked(localforage.getItem).mockResolvedValue(oldCharts);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const result = await storageService.loadCharts();

      expect(localforage.getItem).toHaveBeenCalledWith('chord-charts');
      expect(result).toEqual(expect.objectContaining({
        [mockChart.id]: expect.objectContaining({
          notes: '' // マイグレーション後は空文字になる
        })
      }));
      
      // マイグレーション後の自動保存が実行される
      expect(localforage.setItem).toHaveBeenCalled();
    });

    it('should return null when no data exists', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue(null);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

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
      // 最新バージョンの形式で既存データをモック
      const existingData: VersionedChordLibrary = {
        version: 2,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      vi.mocked(localforage.getItem).mockResolvedValue(existingData);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      await storageService.saveChart(mockChart);

      expect(localforage.getItem).toHaveBeenCalledWith('chord-charts');
      // バージョン情報付きで保存される
      expect(localforage.setItem).toHaveBeenCalledWith('chord-charts', expect.objectContaining({
        version: 2,
        data: {
          [mockChart.id]: mockChart
        }
      }));
    });

    it('should update existing chart and migrate old data', async () => {
      // 古い形式のデータをモック
      const existingCharts = { 'other-chart': { id: 'other-chart' } };
      vi.mocked(localforage.getItem).mockResolvedValue(existingCharts);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      await storageService.saveChart(mockChart);

      // マイグレーション処理により複数回呼ばれる
      expect(localforage.setItem).toHaveBeenCalled();
      expect(localforage.setItem).toHaveBeenCalledWith('chord-charts', expect.objectContaining({
        version: 2,
        data: expect.objectContaining({
          'other-chart': expect.objectContaining({
            id: 'other-chart',
            notes: '' // マイグレーションで追加される
          }),
          [mockChart.id]: mockChart
        })
      }));
    });
  });

  describe('deleteChart', () => {
    it('should delete chart from storage and migrate old data', async () => {
      // 古い形式のデータをモック
      const existingCharts = {
        [mockChart.id]: mockChart,
        'other-chart': { id: 'other-chart' }
      };
      vi.mocked(localforage.getItem).mockResolvedValue(existingCharts);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      await storageService.deleteChart(mockChart.id);

      // マイグレーション処理により複数回呼ばれる
      expect(localforage.setItem).toHaveBeenCalled();
      expect(localforage.setItem).toHaveBeenCalledWith('chord-charts', expect.objectContaining({
        version: 2,
        data: expect.objectContaining({
          'other-chart': expect.objectContaining({
            id: 'other-chart',
            notes: '' // マイグレーションで追加される
          })
        })
      }));
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
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

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
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const isValid = await storageService.validateCharts();

      expect(isValid).toBe(true);
    });

    it('should return false for invalid charts', async () => {
      const invalidChart = { ...mockChart, title: '' };
      const charts = { [invalidChart.id]: invalidChart };
      vi.mocked(localforage.getItem).mockResolvedValue(charts);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const isValid = await storageService.validateCharts();

      expect(isValid).toBe(false);
    });

    it('should return true when no charts exist', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue(null);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const isValid = await storageService.validateCharts();

      expect(isValid).toBe(true);
    });
  });
});