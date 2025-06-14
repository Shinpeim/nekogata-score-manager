import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChordChart from '../ChordChart';
import type { ChordChart as ChordChartType, ChordSection } from '../../types';

// Create mock store state
let mockCharts: Record<string, ChordChartType> = {};
let mockCurrentChartId: string | null = null;

// Mock the store with proper selector behavior
interface MockState {
  charts: Record<string, ChordChartType>;
  currentChartId: string | null;
}

vi.mock('../../stores/chordChartStore', () => ({
  useChordChartStore: vi.fn((selector?: (state: MockState) => unknown) => {
    const state = {
      charts: mockCharts,
      currentChartId: mockCurrentChartId
    };
    
    if (selector) {
      return selector(state);
    }
    return state;
  })
}));

describe('ChordChart', () => {
  const mockChartData: ChordChartType = {
    id: 'test-chart-1',
    title: 'Test Song',
    artist: 'Test Artist',
    key: 'C',
    tempo: 120,
    timeSignature: '4/4',
    sections: [
      {
        id: 'section-1',
        name: 'イントロ',
        chords: [
          { name: 'C', root: 'C', duration: 4 },
          { name: 'Am', root: 'A', quality: 'm', duration: 4 },
          { name: 'F', root: 'F', duration: 4 },
          { name: 'G', root: 'G', duration: 4 }
        ],
        beatsPerBar: 4,
        barsCount: 4
      },
      {
        id: 'section-2',
        name: 'Aメロ',
        chords: [
          { name: 'Dm', root: 'D', quality: 'm', duration: 2 },
          { name: 'G7', root: 'G', quality: '7', duration: 2 },
          { name: 'C', root: 'C', duration: 4 }
        ],
        beatsPerBar: 4,
        barsCount: 2
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    tags: ['pop', 'test'],
    notes: 'Test notes for this chart'
  };

  beforeEach(() => {
    // Reset mock store for each test
    mockCharts = { 'test-chart-1': mockChartData };
    mockCurrentChartId = 'test-chart-1';
  });

  describe('Rendering with chart data', () => {
    it('should render chart information correctly', () => {
      render(<ChordChart />);

      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
      expect(screen.getByText('キー: C')).toBeInTheDocument();
      expect(screen.getByText('テンポ: 120 BPM')).toBeInTheDocument();
      expect(screen.getByText('拍子: 4/4')).toBeInTheDocument();
    });

    it('should render tags correctly', () => {
      render(<ChordChart />);

      expect(screen.getByText('pop')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    it('should render notes section when notes exist', () => {
      render(<ChordChart />);

      expect(screen.getByText('メモ')).toBeInTheDocument();
      expect(screen.getByText('Test notes for this chart')).toBeInTheDocument();
    });

    it('should render section names', () => {
      render(<ChordChart />);

      expect(screen.getByText('【イントロ】')).toBeInTheDocument();
      expect(screen.getByText('【Aメロ】')).toBeInTheDocument();
    });

    it('should render chord names', () => {
      render(<ChordChart />);

      // Check for specific chord names
      const chordElements = screen.getAllByText('C');
      expect(chordElements.length).toBeGreaterThan(0);
      
      expect(screen.getByText('Am')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
      expect(screen.getByText('Dm')).toBeInTheDocument();
      expect(screen.getByText('G7')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<ChordChart />);

      expect(screen.getByText('編集')).toBeInTheDocument();
      expect(screen.getByText('複製')).toBeInTheDocument();
      expect(screen.getByText('削除')).toBeInTheDocument();
    });
  });

  describe('Rendering without chart data', () => {
    it('should show empty state when no chart is selected', () => {
      mockCharts = {};
      mockCurrentChartId = null;

      render(<ChordChart />);

      expect(screen.getByText('コード譜がありません')).toBeInTheDocument();
      expect(screen.getByText('まずは新しいコード譜を作成してみましょう')).toBeInTheDocument();
    });

    it('should show empty state when current chart does not exist', () => {
      mockCharts = {};
      mockCurrentChartId = 'non-existent-id';

      render(<ChordChart />);

      expect(screen.getByText('コード譜がありません')).toBeInTheDocument();
    });
  });

  describe('Props override', () => {
    it('should use chartData prop when provided, ignoring store', () => {
      const propChartData: ChordChartType = {
        ...mockChartData,
        title: 'Props Title',
        artist: 'Props Artist'
      };

      render(<ChordChart chartData={propChartData} />);

      expect(screen.getByText('Props Title')).toBeInTheDocument();
      expect(screen.getByText('Props Artist')).toBeInTheDocument();
    });
  });

  describe('Sections with no data', () => {
    it('should show fallback message when sections are empty', () => {
      const emptyChart: ChordChartType = {
        ...mockChartData,
        sections: []
      };

      mockCharts = { 'test-chart-1': emptyChart };
      mockCurrentChartId = 'test-chart-1';

      render(<ChordChart />);

      expect(screen.getByText('セクションがありません')).toBeInTheDocument();
      expect(screen.getByText('コード譜を編集してセクションを追加してください')).toBeInTheDocument();
    });

    it('should show fallback message when sections are undefined', () => {
      const emptyChart: ChordChartType = {
        ...mockChartData,
        sections: undefined as unknown as ChordSection[]
      };

      mockCharts = { 'test-chart-1': emptyChart };
      mockCurrentChartId = 'test-chart-1';

      render(<ChordChart />);

      expect(screen.getByText('セクションがありません')).toBeInTheDocument();
    });
  });

  describe('Optional fields handling', () => {
    it('should handle missing optional fields gracefully', () => {
      const minimalChart: ChordChartType = {
        id: 'minimal-chart',
        title: 'Minimal Chart',
        key: 'C',
        timeSignature: '4/4',
        sections: [],
        createdAt: new Date(),
        updatedAt: new Date()
        // Missing: artist, tempo, tags, notes
      };

      mockCharts = { 'minimal-chart': minimalChart };
      mockCurrentChartId = 'minimal-chart';

      render(<ChordChart />);

      expect(screen.getByText('Minimal Chart')).toBeInTheDocument();
      expect(screen.getByText('キー: C')).toBeInTheDocument();
      expect(screen.getByText('拍子: 4/4')).toBeInTheDocument();
      
      // Optional fields should not be rendered
      expect(screen.queryByText('テンポ:')).not.toBeInTheDocument();
      expect(screen.queryByText('メモ')).not.toBeInTheDocument();
    });

    it('should not render tags section when tags are empty', () => {
      const noTagsChart: ChordChartType = {
        ...mockChartData,
        tags: []
      };

      mockCharts = { 'test-chart-1': noTagsChart };
      mockCurrentChartId = 'test-chart-1';

      render(<ChordChart />);

      // Should not find tag elements when tags array is empty
      expect(screen.queryByText('pop')).not.toBeInTheDocument();
      expect(screen.queryByText('test')).not.toBeInTheDocument();
    });

    it('should not render tags section when tags are undefined', () => {
      const noTagsChart: ChordChartType = {
        ...mockChartData,
        tags: undefined
      };

      mockCharts = { 'test-chart-1': noTagsChart };
      mockCurrentChartId = 'test-chart-1';

      render(<ChordChart />);

      expect(screen.queryByText('pop')).not.toBeInTheDocument();
      expect(screen.queryByText('test')).not.toBeInTheDocument();
    });
  });

  describe('Chord duration display', () => {
    it('should render chord names correctly', () => {
      const chartWithDurations: ChordChartType = {
        ...mockChartData,
        sections: [
          {
            id: 'duration-test',
            name: 'Duration Test',
            chords: [
              { name: 'C', root: 'C', duration: 2 },
              { name: 'G', root: 'G', duration: 1 }
            ],
            beatsPerBar: 4,
            barsCount: 1
          }
        ]
      };

      mockCharts = { 'test-chart-1': chartWithDurations };
      mockCurrentChartId = 'test-chart-1';

      render(<ChordChart />);

      // コード名が表示されることを確認
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
    });

    it('should render chart without duration display', () => {
      render(<ChordChart />);

      // 拍数表示は削除されているため、拍数の括弧表示がないことを確認
      expect(screen.queryByText('(4)')).not.toBeInTheDocument();
      expect(screen.queryByText('(2)')).not.toBeInTheDocument();
      expect(screen.queryByText('(1)')).not.toBeInTheDocument();
    });
  });

  describe('Store state changes', () => {
    it('should re-render when store state changes', () => {
      const { rerender } = render(<ChordChart />);

      // Initially shows the test chart
      expect(screen.getByText('Test Song')).toBeInTheDocument();

      // Change store state
      mockCurrentChartId = null;

      rerender(<ChordChart />);

      // Should now show empty state
      expect(screen.getByText('コード譜がありません')).toBeInTheDocument();
    });
  });
});