import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChordChart } from '../../types';
import { 
  exportSingleChart, 
  exportMultipleCharts, 
  exportAllCharts,
  parseImportData,
  type ExportData 
} from '../exportImport';

// Blob のモック
globalThis.Blob = vi.fn().mockImplementation((content: BlobPart[], options: BlobPropertyBag) => ({
  content,
  options,
  size: JSON.stringify(content).length,
  type: options?.type || 'text/plain'
}));

// URL のモック
globalThis.URL = {
  createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
  revokeObjectURL: vi.fn()
} as unknown as typeof URL;

// DOM モック
const mockElement = {
  href: '',
  download: '',
  click: vi.fn(),
  remove: vi.fn()
};

Object.defineProperty(document, 'createElement', {
  value: vi.fn().mockReturnValue(mockElement),
  writable: true
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn(),
  writable: true
});

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
        { name: 'C', root: 'C', duration: 4 },
        { name: 'G', root: 'G', duration: 4 }
      ],
      beatsPerBar: 4,
      barsCount: 4
    }
  ],
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  tags: ['test'],
  notes: 'テストメモ'
};

const mockCharts: ChordChart[] = [
  mockChart,
  {
    ...mockChart,
    id: 'test-chart-2',
    title: 'テストソング2'
  }
];

describe('exportImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportSingleChart', () => {
    it('should export a single chart as JSON file', () => {
      exportSingleChart(mockChart);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockElement.download).toBe('テストソング.json');
      expect(mockElement.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should sanitize filename', () => {
      const chartWithSpecialChars = {
        ...mockChart,
        title: 'Test<>:"/\\|?*Song With Spaces'
      };
      
      exportSingleChart(chartWithSpecialChars);
      
      expect(mockElement.download).toBe('TestSong_With_Spaces.json');
    });
  });

  describe('exportMultipleCharts', () => {
    it('should export multiple charts with default filename', () => {
      exportMultipleCharts(mockCharts);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockElement.download).toMatch(/chord-charts-\d{4}-\d{2}-\d{2}\.json/);
      expect(mockElement.click).toHaveBeenCalled();
    });

    it('should export multiple charts with custom filename', () => {
      exportMultipleCharts(mockCharts, 'custom-export.json');

      expect(mockElement.download).toBe('custom-export.json');
    });
  });

  describe('exportAllCharts', () => {
    it('should export all charts from library', () => {
      const library = {
        'chart1': mockCharts[0],
        'chart2': mockCharts[1]
      };

      exportAllCharts(library);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockElement.download).toBe('all-chord-charts.json');
      expect(mockElement.click).toHaveBeenCalled();
    });
  });

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

    it('should handle chart array without export wrapper', () => {
      const result = parseImportData(JSON.stringify([mockChart]));

      expect(result.success).toBe(true);
      expect(result.charts).toHaveLength(1);
      expect(result.warnings).toContain('旧形式のデータです。新形式に変換しました。');
    });

    it('should handle single chart object', () => {
      const result = parseImportData(JSON.stringify(mockChart));

      expect(result.success).toBe(true);
      expect(result.charts).toHaveLength(1);
      expect(result.warnings).toContain('単一のコード譜ファイルです。');
    });

    it('should handle invalid JSON', () => {
      const result = parseImportData('invalid json');

      expect(result.success).toBe(false);
      expect(result.charts).toHaveLength(0);
      expect(result.errors[0]).toContain('JSONの解析に失敗しました');
    });

    it('should handle missing required fields', () => {
      const invalidChart = {
        id: 'test',
        // title missing
        key: 'C',
        sections: []
      };

      const result = parseImportData(JSON.stringify([invalidChart]));

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('タイトルが不正です');
    });

    it('should fix missing or invalid dates', () => {
      const chartWithInvalidDates = {
        ...mockChart,
        createdAt: 'invalid-date',
        updatedAt: null
      };

      const result = parseImportData(JSON.stringify([chartWithInvalidDates]));

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

      const result = parseImportData(JSON.stringify([chartWithIncompleteSection]));

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
      expect(result.warnings.some(w => w.includes('異なるバージョン'))).toBe(true);
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

      const result = parseImportData(JSON.stringify([chart34]));

      expect(result.success).toBe(true);
      expect(result.charts[0].sections[0].beatsPerBar).toBe(3);
      expect(result.warnings.some(w => w.includes('拍数を拍子から設定'))).toBe(true);
    });
  });
});