import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChordChart } from '../../types';
import { 
  exportSingleChart, 
  exportMultipleCharts
} from '../export';

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

describe('export', () => {
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

});