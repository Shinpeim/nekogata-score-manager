import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChordChart from '../ChordChart';
import type { ChordChart as ChordChartType } from '../../types';

// Create mock store state
let mockCharts: Record<string, ChordChartType> = {};
let mockCurrentChartId: string | null = null;
let mockUpdateChart = vi.fn();

// Mock the store with proper selector behavior
interface MockState {
  charts: Record<string, ChordChartType>;
  currentChartId: string | null;
  updateChart: typeof mockUpdateChart;
}

vi.mock('../../stores/chordChartStore', () => ({
  useChordChartStore: vi.fn((selector?: (state: MockState) => unknown) => {
    const state = {
      charts: mockCharts,
      currentChartId: mockCurrentChartId,
      updateChart: mockUpdateChart
    };
    
    if (selector) {
      return selector(state);
    }
    return state;
  })
}));

// Mock child components to focus on integration
vi.mock('../ChordChartViewer', () => ({
  default: ({ chart, onEdit }: any) => (
    <div data-testid="chord-chart-viewer">
      <div>{chart.title}</div>
      <button onClick={onEdit}>編集</button>
    </div>
  )
}));

vi.mock('../EmptyChartPlaceholder', () => ({
  default: ({ onCreateNew, onOpenImport, onOpenExplorer }: any) => (
    <div data-testid="empty-chart-placeholder">
      <div>コード譜がありません</div>
      <button onClick={onCreateNew}>新規作成</button>
      <button onClick={onOpenImport}>インポート</button>
      <button onClick={onOpenExplorer}>Score Explorerを開く</button>
    </div>
  )
}));

vi.mock('../ChordChartEditor', () => ({
  default: ({ chart, onSave, onCancel }: any) => (
    <div data-testid="chord-chart-editor">
      <div>編集中: {chart.title}</div>
      <button onClick={() => onSave(chart)}>保存</button>
      <button onClick={onCancel}>キャンセル</button>
    </div>
  )
}));

describe('ChordChart Integration', () => {
  const mockChartData: ChordChartType = {
    id: 'test-chart-1',
    title: 'Test Song',
    artist: 'Test Artist',
    key: 'C',
    tempo: 120,
    timeSignature: '4/4',
    sections: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCharts = { 'test-chart-1': mockChartData };
    mockCurrentChartId = 'test-chart-1';
  });

  describe('Component integration', () => {
    it('should render ChordChartViewer when chart data exists', () => {
      render(<ChordChart />);

      expect(screen.getByTestId('chord-chart-viewer')).toBeInTheDocument();
      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('編集')).toBeInTheDocument();
    });

    it('should switch to edit mode when edit button is clicked', () => {
      render(<ChordChart />);

      const editButton = screen.getByText('編集');
      fireEvent.click(editButton);

      expect(screen.getByTestId('chord-chart-editor')).toBeInTheDocument();
      expect(screen.getByText('編集中: Test Song')).toBeInTheDocument();
    });

    it('should save chart and exit edit mode', async () => {
      mockUpdateChart.mockResolvedValue(undefined);
      render(<ChordChart />);

      // Enter edit mode
      await act(async () => {
        fireEvent.click(screen.getByText('編集'));
      });

      // Save changes
      await act(async () => {
        fireEvent.click(screen.getByText('保存'));
      });

      await vi.waitFor(() => {
        expect(mockUpdateChart).toHaveBeenCalledWith('test-chart-1', mockChartData);
        expect(screen.getByTestId('chord-chart-viewer')).toBeInTheDocument();
      });
    });

    it('should cancel edit mode', () => {
      render(<ChordChart />);

      // Enter edit mode
      const editButton = screen.getByText('編集');
      fireEvent.click(editButton);

      // Cancel editing
      const cancelButton = screen.getByText('キャンセル');
      fireEvent.click(cancelButton);

      expect(screen.getByTestId('chord-chart-viewer')).toBeInTheDocument();
      expect(mockUpdateChart).not.toHaveBeenCalled();
    });
  });

  describe('Empty state integration', () => {
    it('should render EmptyChartPlaceholder when no chart data exists', () => {
      mockCharts = {};
      mockCurrentChartId = null;

      render(<ChordChart />);

      expect(screen.getByTestId('empty-chart-placeholder')).toBeInTheDocument();
      expect(screen.getByText('コード譜がありません')).toBeInTheDocument();
    });

    it('should pass callbacks to EmptyChartPlaceholder', () => {
      mockCharts = {};
      mockCurrentChartId = null;
      const mockOnCreateNew = vi.fn();
      const mockOnOpenImport = vi.fn();
      const mockOnOpenExplorer = vi.fn();

      render(
        <ChordChart 
          onCreateNew={mockOnCreateNew}
          onOpenImport={mockOnOpenImport}
          onOpenExplorer={mockOnOpenExplorer}
        />
      );

      fireEvent.click(screen.getByText('新規作成'));
      fireEvent.click(screen.getByText('インポート'));
      fireEvent.click(screen.getByText('Score Explorerを開く'));

      expect(mockOnCreateNew).toHaveBeenCalledOnce();
      expect(mockOnOpenImport).toHaveBeenCalledOnce();
      expect(mockOnOpenExplorer).toHaveBeenCalledOnce();
    });
  });

  describe('Props override', () => {
    it('should use chartData prop when provided, ignoring store', () => {
      const propChartData: ChordChartType = {
        ...mockChartData,
        title: 'Props Title'
      };

      render(<ChordChart chartData={propChartData} />);

      expect(screen.getByText('Props Title')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should handle updateChart errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpdateChart.mockRejectedValue(new Error('Update failed'));
      
      render(<ChordChart />);

      // Enter edit mode and save
      await act(async () => {
        fireEvent.click(screen.getByText('編集'));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('保存'));
      });

      // Wait for error to be logged but component stays in edit mode on error
      await vi.waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to save chart:', expect.any(Error));
      });

      // Component should remain in edit mode when save fails
      expect(screen.getByTestId('chord-chart-editor')).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });
});