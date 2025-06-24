import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from '../storage';
import type { ChordChart } from '../../types';
import type { DeletedChartRecord } from '../../types/sync';

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
        { name: 'C', root: 'C', duration: 4, memo: '' },
        { name: 'Am', root: 'A', duration: 4, memo: '' }
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
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      const result = await storageService.loadCharts();

      expect(localforage.getItem).toHaveBeenCalledWith('chord-charts');
      // マイグレーション処理でversionプロパティが追加される
      expect(result).toEqual({
        [mockChart.id]: {
          ...mockChart,
          version: '3.0.0'
        }
      });
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
      // 既存データをモック（空のChordLibrary）
      const existingData = {};
      vi.mocked(localforage.getItem).mockResolvedValue(existingData);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      await storageService.saveChart(mockChart);

      expect(localforage.getItem).toHaveBeenCalledWith('chord-charts');
      // ChordLibraryとして直接保存される
      expect(localforage.setItem).toHaveBeenCalledWith('chord-charts', {
        [mockChart.id]: mockChart
      });
    });

    it('should update existing chart and migrate old data', async () => {
      // 古い形式のデータをモック
      const existingCharts = { 'other-chart': { id: 'other-chart' } };
      vi.mocked(localforage.getItem).mockResolvedValue(existingCharts);
      vi.mocked(localforage.setItem).mockResolvedValue(undefined);

      await storageService.saveChart(mockChart);

      // マイグレーション処理により複数回呼ばれる
      expect(localforage.setItem).toHaveBeenCalled();
      expect(localforage.setItem).toHaveBeenCalledWith('chord-charts', {
        'other-chart': {
          id: 'other-chart',
          sections: [], // マイグレーションで追加される
          notes: '', // マイグレーションで追加される
          version: '3.0.0' // 最新versionが追加される
        },
        [mockChart.id]: mockChart
      });
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
      expect(localforage.setItem).toHaveBeenCalledWith('chord-charts', {
        'other-chart': {
          id: 'other-chart',
          sections: [], // マイグレーションで追加される
          notes: '', // マイグレーションで追加される
          version: '3.0.0' // 最新versionが追加される
        }
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

  describe('lastOpenedChartId', () => {
    it('should save and load last opened chart ID', async () => {
      const chartId = 'test-chart-123';
      
      await storageService.saveLastOpenedChartId(chartId);
      expect(localforage.setItem).toHaveBeenCalledWith('last-opened-chart-id', chartId);
      
      vi.mocked(localforage.getItem).mockResolvedValue(chartId);
      
      const result = await storageService.loadLastOpenedChartId();
      expect(localforage.getItem).toHaveBeenCalledWith('last-opened-chart-id');
      expect(result).toBe(chartId);
    });

    it('should remove last opened chart ID when null is saved', async () => {
      await storageService.saveLastOpenedChartId(null);
      expect(localforage.removeItem).toHaveBeenCalledWith('last-opened-chart-id');
    });

    it('should return null when no last opened chart ID exists', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue(null);
      
      const result = await storageService.loadLastOpenedChartId();
      expect(result).toBe(null);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(localforage.getItem).mockRejectedValue(new Error('Storage error'));
      
      const result = await storageService.loadLastOpenedChartId();
      expect(result).toBe(null);
    });
  });

  describe('deleted charts management', () => {
    it('should save and load deleted charts', async () => {
      const deletedCharts = [
        { id: 'chart-1', deletedAt: '2024-01-01T00:00:00.000Z', deviceId: 'device-1' },
        { id: 'chart-2', deletedAt: '2024-01-02T00:00:00.000Z', deviceId: 'device-2' }
      ];

      await storageService.saveDeletedCharts(deletedCharts);
      expect(localforage.setItem).toHaveBeenCalledWith('deleted-charts', deletedCharts);

      vi.mocked(localforage.getItem).mockResolvedValue(deletedCharts);
      const result = await storageService.loadDeletedCharts();
      expect(result).toEqual(deletedCharts);
    });

    it('should return empty array when no deleted charts exist', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue(null);
      
      const result = await storageService.loadDeletedCharts();
      expect(result).toEqual([]);
    });

    it('should add single deleted chart', async () => {
      const existingDeleted = [
        { id: 'chart-1', deletedAt: '2024-01-01T00:00:00.000Z', deviceId: 'device-1' }
      ];
      
      vi.mocked(localforage.getItem).mockResolvedValue(existingDeleted);
      
      await storageService.addDeletedChart('chart-2', 'device-2');
      
      expect(localforage.setItem).toHaveBeenCalledWith('deleted-charts', 
        expect.arrayContaining([
          expect.objectContaining({ id: 'chart-1' }),
          expect.objectContaining({ id: 'chart-2', deviceId: 'device-2' })
        ])
      );
    });

    it('should update existing deleted chart record', async () => {
      const existingDeleted = [
        { id: 'chart-1', deletedAt: '2024-01-01T00:00:00.000Z', deviceId: 'device-1' }
      ];
      
      vi.mocked(localforage.getItem).mockResolvedValue(existingDeleted);
      
      await storageService.addDeletedChart('chart-1', 'device-2');
      
      const savedData = vi.mocked(localforage.setItem).mock.calls[0][1] as DeletedChartRecord[];
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe('chart-1');
      expect(savedData[0].deviceId).toBe('device-2');
    });

    it('should add multiple deleted charts', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue([]);
      
      await storageService.addMultipleDeletedCharts(['chart-1', 'chart-2'], 'device-1');
      
      const savedData = vi.mocked(localforage.setItem).mock.calls[0][1] as DeletedChartRecord[];
      expect(savedData).toHaveLength(2);
      expect(savedData[0].id).toBe('chart-1');
      expect(savedData[1].id).toBe('chart-2');
      expect(savedData[0].deviceId).toBe('device-1');
      expect(savedData[1].deviceId).toBe('device-1');
    });

    it('should clear deleted charts', async () => {
      await storageService.clearDeletedCharts();
      expect(localforage.removeItem).toHaveBeenCalledWith('deleted-charts');
    });

    it('should handle errors in deleted charts operations', async () => {
      vi.mocked(localforage.setItem).mockRejectedValue(new Error('Storage error'));
      
      await expect(storageService.saveDeletedCharts([])).rejects.toThrow('削除記録の保存に失敗しました');
      
      vi.mocked(localforage.getItem).mockRejectedValue(new Error('Storage error'));
      const result = await storageService.loadDeletedCharts();
      expect(result).toEqual([]);
    });
  });
});