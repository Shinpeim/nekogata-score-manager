import { describe, it, expect } from 'vitest';
import type { ChordChart } from '../../types';
import { parseImportData } from '../importFunctions';
import type { ExportData } from '../export';

// テスト用のサンプルデータ
const mockChart: ChordChart = {
  id: 'test-chart-1',
  title: 'テストソング',
  artist: 'テストアーティスト',
  key: 'C',
  tempo: 120,
  timeSignature: '4/4',
  sections: [
    {
      id: 'section-1',
      name: 'イントロ',
      chords: [
        { name: 'C', root: 'C', duration: 4, memo: '' },
        { name: 'G', root: 'G', duration: 4, memo: '' }
      ],
      beatsPerBar: 4,
      barsCount: 4
    }
  ],
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  notes: 'テストメモ'
};

describe('import', () => {
  describe('parseImportData', () => {
    it('should parse valid export data', () => {
      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        charts: [mockChart]
      };
      
      const result = parseImportData(JSON.stringify(exportData));

      expect(result.success).toBe(true);
      expect(result.charts).toHaveLength(1);
      expect(result.charts[0].title).toBe('テストソング');
      expect(result.errors).toHaveLength(0);
    });


    it('should handle invalid JSON', () => {
      const result = parseImportData('invalid json');

      expect(result.success).toBe(false);
      expect(result.charts).toHaveLength(0);
      expect(result.errors[0]).toContain('JSONの解析に失敗しました');
    });

    it('should reject chart array without export wrapper', () => {
      const result = parseImportData(JSON.stringify([mockChart]));

      expect(result.success).toBe(false);
      expect(result.charts).toHaveLength(0);
      expect(result.errors[0]).toContain('無効なデータフォーマットです');
    });

    it('should reject single chart object', () => {
      const result = parseImportData(JSON.stringify(mockChart));

      expect(result.success).toBe(false);
      expect(result.charts).toHaveLength(0);
      expect(result.errors[0]).toContain('無効なデータフォーマットです');
    });

    it('should handle missing required fields', () => {
      const invalidChart = {
        id: 'test',
        // title missing
        key: 'C',
        sections: []
      };

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        charts: [invalidChart as any] // 意図的に不正なデータを作成してバリデーションをテストするため型チェックを回避
      };

      const result = parseImportData(JSON.stringify(exportData));

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('タイトルが不正です');
    });

    it('should fix missing or invalid dates', () => {
      const chartWithInvalidDates = {
        ...mockChart,
        createdAt: 'invalid-date',
        updatedAt: null
      };

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        charts: [chartWithInvalidDates as any] // 不正な日付形式のテストのため型チェックを回避
      };

      const result = parseImportData(JSON.stringify(exportData));

      expect(result.success).toBe(true);
      expect(result.charts[0].createdAt).toBeInstanceOf(Date);
      expect(result.charts[0].updatedAt).toBeInstanceOf(Date);
      expect(result.warnings.some(w => w.includes('作成日時が不正'))).toBe(true);
    });

    it('should fix missing section properties', () => {
      const chartWithIncompleteSection = {
        ...mockChart,
        sections: [
          {
            // id missing
            name: 'テストセクション',
            chords: []
            // beatsPerBar missing
            // barsCount missing
          }
        ]
      };

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        charts: [chartWithIncompleteSection as any] // 不完全なセクションデータのテストのため型チェックを回避
      };

      const result = parseImportData(JSON.stringify(exportData));

      expect(result.success).toBe(true);
      expect(result.charts[0].sections[0].id).toBeDefined();
      expect(result.charts[0].sections[0].beatsPerBar).toBe(4);
      expect(result.charts[0].sections[0].barsCount).toBe(4);
      expect(result.warnings.some(w => w.includes('IDを自動生成'))).toBe(true);
    });

    it('should handle different version', () => {
      const exportData: ExportData = {
        version: '2.0.0',
        exportDate: new Date().toISOString(),
        charts: [mockChart]
      };

      const result = parseImportData(JSON.stringify(exportData));

      expect(result.success).toBe(true);
    });

    it('should handle 3/4 time signature correctly', () => {
      const chart34 = {
        ...mockChart,
        timeSignature: '3/4',
        sections: [
          {
            id: 'section-1',
            name: 'イントロ',
            chords: [],
            beatsPerBar: 4, // 間違った値
            barsCount: 4
          }
        ]
      };

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        charts: [chart34 as any] // 間違ったbeatsPerBarのテストのため型チェックを回避
      };

      const result = parseImportData(JSON.stringify(exportData));

      expect(result.success).toBe(true);
      expect(result.charts[0].sections[0].beatsPerBar).toBe(3);
    });
  });
});