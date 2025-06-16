import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChordChartActions from '../ChordChartActions';
import type { ChordChart as ChordChartType } from '../../types';

// Mock store functions
const mockDeleteChart = vi.fn();
const mockAddChart = vi.fn();

vi.mock('../../hooks/useChartManagement', () => ({
  useChordChartStore: () => ({
    deleteChart: mockDeleteChart,
    addChart: mockAddChart
  })
}));

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
});

// Mock console.error
const mockConsoleError = vi.fn();
Object.defineProperty(console, 'error', {
  value: mockConsoleError,
  writable: true
});

describe('ChordChartActions', () => {
  const mockChart: ChordChartType = {
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

  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('should render all action buttons', () => {
      render(<ChordChartActions chart={mockChart} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      expect(screen.getByText('編集')).toBeInTheDocument();
      expect(screen.getByText('複製')).toBeInTheDocument();
      expect(screen.getByText('削除')).toBeInTheDocument();
    });
  });

  describe('Edit action', () => {
    it('should call onEdit when edit button is clicked', () => {
      render(<ChordChartActions chart={mockChart} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      const editButton = screen.getByText('編集');
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledOnce();
    });
  });

  describe('Duplicate action', () => {
    it('should call addChart with duplicated chart when duplicate button is clicked', async () => {
      mockAddChart.mockResolvedValue(undefined);
      
      render(<ChordChartActions chart={mockChart} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      const duplicateButton = screen.getByText('複製');
      fireEvent.click(duplicateButton);

      expect(mockAddChart).toHaveBeenCalledOnce();
      const duplicatedChart = mockAddChart.mock.calls[0][0];
      
      expect(duplicatedChart.title).toBe('Test Song (コピー)');
      expect(duplicatedChart.artist).toBe('Test Artist');
      expect(duplicatedChart.id).not.toBe(mockChart.id);
      expect(duplicatedChart.id).toMatch(/^chord-\d+$/);
    });

    it('should handle duplicate error gracefully', async () => {
      const error = new Error('Duplicate failed');
      mockAddChart.mockRejectedValue(error);
      
      render(<ChordChartActions chart={mockChart} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      const duplicateButton = screen.getByText('複製');
      fireEvent.click(duplicateButton);

      await vi.waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Failed to duplicate chart:', error);
      });
    });
  });

  describe('Delete action', () => {
    it('should call deleteChart when delete button is clicked and confirmed', async () => {
      mockConfirm.mockReturnValue(true);
      mockDeleteChart.mockResolvedValue(undefined);
      
      render(<ChordChartActions chart={mockChart} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      const deleteButton = screen.getByText('削除');
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith('このコード譜を削除しますか？');
      expect(mockDeleteChart).toHaveBeenCalledWith('test-chart-1');
    });

    it('should not call deleteChart when delete is cancelled', async () => {
      mockConfirm.mockReturnValue(false);
      
      render(<ChordChartActions chart={mockChart} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      const deleteButton = screen.getByText('削除');
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith('このコード譜を削除しますか？');
      expect(mockDeleteChart).not.toHaveBeenCalled();
    });

    it('should not call deleteChart when currentChartId is null', async () => {
      render(<ChordChartActions chart={mockChart} currentChartId={null} onEdit={mockOnEdit} />);

      const deleteButton = screen.getByText('削除');
      fireEvent.click(deleteButton);

      expect(mockConfirm).not.toHaveBeenCalled();
      expect(mockDeleteChart).not.toHaveBeenCalled();
    });

    it('should handle delete error gracefully', async () => {
      const error = new Error('Delete failed');
      mockConfirm.mockReturnValue(true);
      mockDeleteChart.mockRejectedValue(error);
      
      render(<ChordChartActions chart={mockChart} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      const deleteButton = screen.getByText('削除');
      fireEvent.click(deleteButton);

      await vi.waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Failed to delete chart:', error);
      });
    });
  });
});