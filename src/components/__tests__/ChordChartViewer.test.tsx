import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChordChartViewer from '../ChordChartViewer';
import type { ChordChart as ChordChartType } from '../../types';

vi.mock('../hooks/useResponsiveBars', () => ({
  useResponsiveBars: () => ({
    barsPerRow: 4,
    config: { MAX_WIDTH: 200 }
  })
}));

describe('ChordChartViewer', () => {
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
          { name: 'C', root: 'C', duration: 4, memo: '' },
          { name: 'Am', root: 'A', duration: 4, memo: '' },
          { name: 'F', root: 'F', duration: 4, memo: '' },
          { name: 'G', root: 'G', duration: 4, memo: '' }
        ],
        beatsPerBar: 4,
        barsCount: 4
      },
      {
        id: 'section-2',
        name: 'Aメロ',
        chords: [
          { name: 'Dm', root: 'D', duration: 2, memo: '' },
          { name: 'G7', root: 'G', duration: 2, memo: '' },
          { name: 'C', root: 'C', duration: 4, memo: '' }
        ],
        beatsPerBar: 4,
        barsCount: 2
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    notes: 'Test notes for this chart'
  };

  const mockOnEdit = vi.fn();

  describe('Chart information display', () => {
    it('should render chart header information correctly', () => {
      render(<ChordChartViewer chart={mockChartData} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
      expect(screen.getByText('キー: C / Am')).toBeInTheDocument();
      expect(screen.getByText('テンポ: 120 BPM')).toBeInTheDocument();
      expect(screen.getByText('拍子: 4/4')).toBeInTheDocument();
    });


    it('should render notes section when notes exist', () => {
      render(<ChordChartViewer chart={mockChartData} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      expect(screen.getByText('メモ')).toBeInTheDocument();
      expect(screen.getByText('Test notes for this chart')).toBeInTheDocument();
    });

    it('should not render notes section when notes are undefined', () => {
      const chartWithoutNotes = { ...mockChartData, notes: undefined };
      render(<ChordChartViewer chart={chartWithoutNotes} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      expect(screen.queryByText('メモ')).not.toBeInTheDocument();
    });



    it('should handle missing optional fields gracefully', () => {
      const minimalChart: ChordChartType = {
        id: 'minimal-chart',
        title: 'Minimal Chart',
        key: 'C',
        timeSignature: '4/4',
        sections: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      render(<ChordChartViewer chart={minimalChart} currentChartId="minimal-chart" onEdit={mockOnEdit} />);

      expect(screen.getByText('Minimal Chart')).toBeInTheDocument();
      expect(screen.getByText('キー: C / Am')).toBeInTheDocument();
      expect(screen.getByText('拍子: 4/4')).toBeInTheDocument();
      
      expect(screen.queryByText('テンポ:')).not.toBeInTheDocument();
      expect(screen.queryByText('メモ')).not.toBeInTheDocument();
    });
  });

  describe('Section rendering', () => {
    it('should render section names', () => {
      render(<ChordChartViewer chart={mockChartData} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      expect(screen.getByText('【イントロ】')).toBeInTheDocument();
      expect(screen.getByText('【Aメロ】')).toBeInTheDocument();
    });

    it('should show fallback message when sections are empty', () => {
      const emptyChart = { ...mockChartData, sections: [] };
      render(<ChordChartViewer chart={emptyChart} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      expect(screen.getByText('セクションがありません')).toBeInTheDocument();
      expect(screen.getByText('コード譜を編集してセクションを追加してください')).toBeInTheDocument();
    });

    it('should show fallback message when sections are undefined', () => {
      const emptyChart = { ...mockChartData, sections: undefined as unknown as ChordChartType['sections'] };
      render(<ChordChartViewer chart={emptyChart} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      expect(screen.getByText('セクションがありません')).toBeInTheDocument();
    });
  });

  describe('Chord rendering', () => {
    it('should render chord names', () => {
      render(<ChordChartViewer chart={mockChartData} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      const chordElements = screen.getAllByText('C');
      expect(chordElements.length).toBeGreaterThan(0);
      
      expect(screen.getAllByText('A')[0]).toBeInTheDocument();
      expect(screen.getAllByText('m')[0]).toBeInTheDocument();
      expect(screen.getAllByText('F')[0]).toBeInTheDocument();
      expect(screen.getAllByText('G')[0]).toBeInTheDocument();
      expect(screen.getAllByText('D')[0]).toBeInTheDocument();
      expect(screen.getAllByText('7')[0]).toBeInTheDocument();
    });

    it('should render chord names without duration display', () => {
      render(<ChordChartViewer chart={mockChartData} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      expect(screen.queryByText('(4)')).not.toBeInTheDocument();
      expect(screen.queryByText('(2)')).not.toBeInTheDocument();
      expect(screen.queryByText('(1)')).not.toBeInTheDocument();
    });
  });
});