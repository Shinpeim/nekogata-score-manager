import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChordChartActions from '../ChordChartActions';
import type { ChordChart as ChordChartType } from '../../types';

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
  });

  describe('Rendering', () => {
    it('should render edit button only', () => {
      render(<ChordChartActions chart={mockChart} currentChartId="test-chart-1" onEdit={mockOnEdit} />);

      expect(screen.getByText('編集')).toBeInTheDocument();
      expect(screen.queryByText('複製')).not.toBeInTheDocument();
      expect(screen.queryByText('削除')).not.toBeInTheDocument();
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
});