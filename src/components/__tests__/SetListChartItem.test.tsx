import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import SetListChartItem from '../SetListChartItem';
import type { ChordChart } from '../../types';

describe('SetListChartItem', () => {
  const mockOnChartClick = vi.fn();

  const mockChart: ChordChart = {
    id: 'chart1',
    title: 'Test Song',
    artist: 'Test Artist',
    key: 'C',
    tempo: 120,
    timeSignature: '4/4',
    sections: [],
    notes: '',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    version: '1'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithDndContext = (component: React.ReactElement) => {
    return render(
      <DndContext>
        {component}
      </DndContext>
    );
  };

  it('楽譜が存在する場合、正しく表示される', () => {
    renderWithDndContext(
      <SetListChartItem
        index={0}
        chart={mockChart}
        chartId="chart1"
        onChartClick={mockOnChartClick}
      />
    );

    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('(Key: C)')).toBeInTheDocument();
    expect(screen.getByText('Artist: Test Artist')).toBeInTheDocument();
    expect(screen.getByText('⋮⋮')).toBeInTheDocument();
  });

  it('楽譜をクリックするとonChartClickが呼ばれる', () => {
    renderWithDndContext(
      <SetListChartItem
        index={0}
        chart={mockChart}
        chartId="chart1"
        onChartClick={mockOnChartClick}
      />
    );

    const chartItem = screen.getByTestId('setlist-chart-item-0');
    fireEvent.click(chartItem);

    expect(mockOnChartClick).toHaveBeenCalledWith('chart1');
  });

  it('ドラッグハンドルをクリックしてもonChartClickが呼ばれない', () => {
    renderWithDndContext(
      <SetListChartItem
        index={0}
        chart={mockChart}
        chartId="chart1"
        onChartClick={mockOnChartClick}
      />
    );

    const dragHandle = screen.getByText('⋮⋮');
    fireEvent.click(dragHandle);

    expect(mockOnChartClick).not.toHaveBeenCalled();
  });

  it('削除された楽譜の場合、適切なメッセージが表示される', () => {
    renderWithDndContext(
      <SetListChartItem
        index={1}
        chart={null}
        chartId="deleted-chart"
        onChartClick={mockOnChartClick}
      />
    );

    expect(screen.getByText('2.')).toBeInTheDocument();
    expect(screen.getByText('(削除された楽譜)')).toBeInTheDocument();
    expect(screen.getByText('⋮⋮')).toBeInTheDocument();
  });

  it('削除された楽譜をクリックしてもonChartClickが呼ばれない', () => {
    renderWithDndContext(
      <SetListChartItem
        index={1}
        chart={null}
        chartId="deleted-chart"
        onChartClick={mockOnChartClick}
      />
    );

    const chartItem = screen.getByTestId('setlist-chart-item-1');
    fireEvent.click(chartItem);

    expect(mockOnChartClick).not.toHaveBeenCalled();
  });

  it('keyが指定されていない場合でも正しく表示される', () => {
    const chartWithoutKey = { ...mockChart, key: '' };

    renderWithDndContext(
      <SetListChartItem
        index={0}
        chart={chartWithoutKey}
        chartId="chart1"
        onChartClick={mockOnChartClick}
      />
    );

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.queryByText('(Key:')).not.toBeInTheDocument();
  });

  it('正しいインデックス番号が表示される', () => {
    renderWithDndContext(
      <SetListChartItem
        index={4}
        chart={mockChart}
        chartId="chart1"
        onChartClick={mockOnChartClick}
      />
    );

    expect(screen.getByText('5.')).toBeInTheDocument();
  });

  it('ドラッグ可能な要素として設定されている', () => {
    renderWithDndContext(
      <SetListChartItem
        index={0}
        chart={mockChart}
        chartId="chart1"
        onChartClick={mockOnChartClick}
      />
    );

    const chartItem = screen.getByTestId('setlist-chart-item-0');
    expect(chartItem).toBeInTheDocument();
    
    // ドラッグハンドルが存在することを確認
    const dragHandle = screen.getByText('⋮⋮');
    expect(dragHandle).toHaveClass('cursor-grab');
  });
});