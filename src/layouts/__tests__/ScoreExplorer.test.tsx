import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScoreExplorer from '../ScoreExplorer';
import type { ChordChart } from '../../types';

const mockCharts: ChordChart[] = [
  {
    id: 'chart1',
    title: 'Test Chart 1',
    artist: 'Test Artist 1',
    key: 'C',
    tempo: 120,
    timeSignature: '4/4',
    sections: [],
    notes: '',
    tags: ['tag1', 'tag2'],
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },
  {
    id: 'chart2',
    title: 'Test Chart 2',
    artist: 'Test Artist 2',
    key: 'G',
    tempo: 140,
    timeSignature: '4/4',
    sections: [],
    notes: '',
    tags: [],
    createdAt: new Date('2023-01-02T00:00:00.000Z'),
    updatedAt: new Date('2023-01-02T00:00:00.000Z'),
  },
];

describe('ScoreExplorer', () => {
  const mockOnChartSelect = vi.fn();
  const mockOnSelectAll = vi.fn();
  const mockOnSetCurrentChart = vi.fn();
  const mockOnCreateNew = vi.fn();
  const mockOnImport = vi.fn();
  const mockOnExportSelected = vi.fn();
  const mockOnDeleteSelected = vi.fn();
  const mockOnDuplicateSelected = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Score Explorer title', () => {
    render(
      <ScoreExplorer
        charts={[]}
        currentChartId={null}
        selectedChartIds={[]}
        onChartSelect={mockOnChartSelect}
        onSelectAll={mockOnSelectAll}
        onSetCurrentChart={mockOnSetCurrentChart}
        onCreateNew={mockOnCreateNew}
        onImport={mockOnImport}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
        onDuplicateSelected={mockOnDuplicateSelected}
      />
    );

    expect(screen.getByText('Score Explorer')).toBeInTheDocument();
  });

  it('should render action buttons', () => {
    render(
      <ScoreExplorer
        charts={[]}
        currentChartId={null}
        selectedChartIds={[]}
        onChartSelect={mockOnChartSelect}
        onSelectAll={mockOnSelectAll}
        onSetCurrentChart={mockOnSetCurrentChart}
        onCreateNew={mockOnCreateNew}
        onImport={mockOnImport}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
        onDuplicateSelected={mockOnDuplicateSelected}
      />
    );

    expect(screen.getByText('新規作成')).toBeInTheDocument();
    expect(screen.getByText('インポート')).toBeInTheDocument();
  });

  it('should call onCreateNew when create button is clicked', () => {
    render(
      <ScoreExplorer
        charts={[]}
        currentChartId={null}
        selectedChartIds={[]}
        onChartSelect={mockOnChartSelect}
        onSelectAll={mockOnSelectAll}
        onSetCurrentChart={mockOnSetCurrentChart}
        onCreateNew={mockOnCreateNew}
        onImport={mockOnImport}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
        onDuplicateSelected={mockOnDuplicateSelected}
      />
    );

    fireEvent.click(screen.getByText('新規作成'));
    expect(mockOnCreateNew).toHaveBeenCalled();
  });

  it('should call onImport when import button is clicked', () => {
    render(
      <ScoreExplorer
        charts={[]}
        currentChartId={null}
        selectedChartIds={[]}
        onChartSelect={mockOnChartSelect}
        onSelectAll={mockOnSelectAll}
        onSetCurrentChart={mockOnSetCurrentChart}
        onCreateNew={mockOnCreateNew}
        onImport={mockOnImport}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
        onDuplicateSelected={mockOnDuplicateSelected}
      />
    );

    fireEvent.click(screen.getByText('インポート'));
    expect(mockOnImport).toHaveBeenCalled();
  });

  it('should render charts list', () => {
    render(
      <ScoreExplorer
        charts={mockCharts}
        currentChartId={null}
        selectedChartIds={[]}
        onChartSelect={mockOnChartSelect}
        onSelectAll={mockOnSelectAll}
        onSetCurrentChart={mockOnSetCurrentChart}
        onCreateNew={mockOnCreateNew}
        onImport={mockOnImport}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
        onDuplicateSelected={mockOnDuplicateSelected}
      />
    );

    expect(screen.getByText('Test Chart 1')).toBeInTheDocument();
    expect(screen.getByText('Test Artist 1')).toBeInTheDocument();
    expect(screen.getByText('Test Chart 2')).toBeInTheDocument();
    expect(screen.getByText('Test Artist 2')).toBeInTheDocument();
  });

  it('should highlight current chart', () => {
    render(
      <ScoreExplorer
        charts={mockCharts}
        currentChartId="chart1"
        selectedChartIds={[]}
        onChartSelect={mockOnChartSelect}
        onSelectAll={mockOnSelectAll}
        onSetCurrentChart={mockOnSetCurrentChart}
        onCreateNew={mockOnCreateNew}
        onImport={mockOnImport}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
        onDuplicateSelected={mockOnDuplicateSelected}
      />
    );

    const currentChart = screen.getByText('Test Chart 1').closest('div');
    expect(currentChart).toHaveClass('bg-slate-100', 'border-[#85B0B7]', 'border');
  });

  it('should call onSetCurrentChart when chart is clicked', () => {
    render(
      <ScoreExplorer
        charts={mockCharts}
        currentChartId={null}
        selectedChartIds={[]}
        onChartSelect={mockOnChartSelect}
        onSelectAll={mockOnSelectAll}
        onSetCurrentChart={mockOnSetCurrentChart}
        onCreateNew={mockOnCreateNew}
        onImport={mockOnImport}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
        onDuplicateSelected={mockOnDuplicateSelected}
      />
    );

    fireEvent.click(screen.getByText('Test Chart 1'));
    expect(mockOnSetCurrentChart).toHaveBeenCalledWith('chart1');
  });

  it('should show bulk selection controls when charts exist', () => {
    render(
      <ScoreExplorer
        charts={mockCharts}
        currentChartId={null}
        selectedChartIds={[]}
        onChartSelect={mockOnChartSelect}
        onSelectAll={mockOnSelectAll}
        onSetCurrentChart={mockOnSetCurrentChart}
        onCreateNew={mockOnCreateNew}
        onImport={mockOnImport}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
        onDuplicateSelected={mockOnDuplicateSelected}
      />
    );

    expect(screen.getByText('一括選択')).toBeInTheDocument();
    expect(screen.getByText('未選択')).toBeInTheDocument();
  });

  it('should call onSelectAll when bulk select checkbox is clicked', () => {
    render(
      <ScoreExplorer
        charts={mockCharts}
        currentChartId={null}
        selectedChartIds={[]}
        onChartSelect={mockOnChartSelect}
        onSelectAll={mockOnSelectAll}
        onSetCurrentChart={mockOnSetCurrentChart}
        onCreateNew={mockOnCreateNew}
        onImport={mockOnImport}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
        onDuplicateSelected={mockOnDuplicateSelected}
      />
    );

    const bulkSelectCheckbox = screen.getByTitle('全て選択');
    fireEvent.click(bulkSelectCheckbox);
    expect(mockOnSelectAll).toHaveBeenCalled();
  });

  it('should call onChartSelect when individual chart checkbox is clicked', () => {
    render(
      <ScoreExplorer
        charts={mockCharts}
        currentChartId={null}
        selectedChartIds={[]}
        onChartSelect={mockOnChartSelect}
        onSelectAll={mockOnSelectAll}
        onSetCurrentChart={mockOnSetCurrentChart}
        onCreateNew={mockOnCreateNew}
        onImport={mockOnImport}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
        onDuplicateSelected={mockOnDuplicateSelected}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const chartCheckbox = checkboxes[1]; // 最初は一括選択、2番目以降が個別チャート
    fireEvent.click(chartCheckbox);
    expect(mockOnChartSelect).toHaveBeenCalledWith('chart1');
  });

  it('should show selected count when charts are selected', () => {
    render(
      <ScoreExplorer
        charts={mockCharts}
        currentChartId={null}
        selectedChartIds={['chart1']}
        onChartSelect={mockOnChartSelect}
        onSelectAll={mockOnSelectAll}
        onSetCurrentChart={mockOnSetCurrentChart}
        onCreateNew={mockOnCreateNew}
        onImport={mockOnImport}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
        onDuplicateSelected={mockOnDuplicateSelected}
      />
    );

    expect(screen.getByText('1件選択中')).toBeInTheDocument();
  });

  it('should render tags when available', () => {
    render(
      <ScoreExplorer
        charts={mockCharts}
        currentChartId={null}
        selectedChartIds={[]}
        onChartSelect={mockOnChartSelect}
        onSelectAll={mockOnSelectAll}
        onSetCurrentChart={mockOnSetCurrentChart}
        onCreateNew={mockOnCreateNew}
        onImport={mockOnImport}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
        onDuplicateSelected={mockOnDuplicateSelected}
      />
    );

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });

  describe('Complex Selection Behaviors', () => {
    it('should show correct bulk select checkbox states', () => {
      const { rerender } = render(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={[]}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
        />
      );

      const bulkCheckbox = screen.getByTitle('全て選択') as HTMLInputElement;
      
      // 未選択状態
      expect(bulkCheckbox.checked).toBe(false);
      expect(bulkCheckbox.indeterminate).toBe(false);

      // 一部選択状態
      rerender(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={['chart1']}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
        />
      );

      expect(bulkCheckbox.checked).toBe(false);
      expect(bulkCheckbox.indeterminate).toBe(true);

      // 全選択状態
      rerender(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={['chart1', 'chart2']}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
        />
      );

      expect(bulkCheckbox.checked).toBe(true);
      expect(bulkCheckbox.indeterminate).toBe(false);
    });

    it('should show correct title for bulk select checkbox based on state', () => {
      const { rerender } = render(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={[]}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
        />
      );

      // 未選択時は「全て選択」
      expect(screen.getByTitle('全て選択')).toBeInTheDocument();

      // 全選択時は「全て解除」
      rerender(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={['chart1', 'chart2']}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
        />
      );

      expect(screen.getByTitle('全て解除')).toBeInTheDocument();
    });

    it('should handle individual chart checkbox states correctly', () => {
      render(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={['chart1']}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
      
      // 最初のチェックボックスは一括選択（indeterminate状態）
      expect(checkboxes[0].indeterminate).toBe(true);
      
      // 2番目のチェックボックスは chart1（選択済み）
      expect(checkboxes[1].checked).toBe(true);
      
      // 3番目のチェックボックスは chart2（未選択）
      expect(checkboxes[2].checked).toBe(false);
    });

    it('should handle ActionDropdown integration correctly', () => {
      render(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={['chart1']}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
        />
      );

      // ActionDropdownが存在し、有効状態であることを確認
      const actionButton = screen.getByRole('button', { name: 'アクション' });
      expect(actionButton).not.toBeDisabled();
      expect(actionButton).toHaveClass('bg-[#85B0B7]');

      // アクションボタンをクリックしてドロップダウンを開く
      fireEvent.click(actionButton);
      
      // ドロップダウンメニューが表示されることを確認
      expect(screen.getByText('エクスポート')).toBeInTheDocument();
      expect(screen.getByText('削除')).toBeInTheDocument();
    });

    it('should handle empty charts list', () => {
      render(
        <ScoreExplorer
          charts={[]}
          currentChartId={null}
          selectedChartIds={[]}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
        />
      );

      // 一括選択コントロールが表示されない
      expect(screen.queryByText('一括選択')).not.toBeInTheDocument();
      
      // アクションボタンが表示されない
      expect(screen.queryByRole('button', { name: 'アクション' })).not.toBeInTheDocument();
      
      // 新規作成とインポートボタンは表示される
      expect(screen.getByText('新規作成')).toBeInTheDocument();
      expect(screen.getByText('インポート')).toBeInTheDocument();
    });

    it('should handle charts with long titles and many tags', () => {
      const chartsWithLongContent = [
        {
          ...mockCharts[0],
          title: 'Very Long Chart Title That Might Overflow The Container Width',
          artist: 'Artist With Very Long Name That Also Might Cause Layout Issues',
          tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],
        }
      ];

      render(
        <ScoreExplorer
          charts={chartsWithLongContent}
          currentChartId={null}
          selectedChartIds={[]}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
        />
      );

      expect(screen.getByText('Very Long Chart Title That Might Overflow The Container Width')).toBeInTheDocument();
      expect(screen.getByText('Artist With Very Long Name That Also Might Cause Layout Issues')).toBeInTheDocument();
      
      // 最初の2つのタグのみ表示される（slice(0, 2)の実装による）
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.queryByText('tag3')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Version', () => {
    it('should render mobile overlay when isMobile is true', () => {
      render(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={[]}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
          isMobile={true}
          onClose={mockOnClose}
        />
      );

      // モバイル固有のオーバーレイクラスを確認
      const overlay = document.querySelector('.fixed.inset-0.flex.z-40.md\\:hidden');
      expect(overlay).toBeInTheDocument();
      
      // 閉じるボタンの存在を確認
      expect(screen.getByRole('button', { name: /score explorerを閉じる/i })).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked in mobile mode', () => {
      render(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={[]}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
          isMobile={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /score explorerを閉じる/i });
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when overlay background is clicked in mobile mode', () => {
      render(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={[]}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
          isMobile={true}
          onClose={mockOnClose}
        />
      );

      const overlay = document.querySelector('.fixed.inset-0.bg-slate-600.bg-opacity-75');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should call onSetCurrentChart and onClose when chart is clicked in mobile mode', () => {
      render(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={[]}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
          isMobile={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Test Chart 1'));
      expect(mockOnSetCurrentChart).toHaveBeenCalledWith('chart1');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not call onClose when chart is clicked in desktop mode', () => {
      render(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={[]}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
          isMobile={false}
        />
      );

      fireEvent.click(screen.getByText('Test Chart 1'));
      expect(mockOnSetCurrentChart).toHaveBeenCalledWith('chart1');
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should render desktop version when isMobile is false', () => {
      render(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={[]}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
          isMobile={false}
        />
      );

      // モバイル固有のオーバーレイクラスがないことを確認
      const overlay = document.querySelector('.fixed.inset-0.flex.z-40.md\\:hidden');
      expect(overlay).not.toBeInTheDocument();
      
      // 閉じるボタンが存在しないことを確認
      expect(screen.queryByRole('button', { name: /score explorerを閉じる/i })).not.toBeInTheDocument();
    });

    it('should have different padding for mobile vs desktop', () => {
      const { rerender } = render(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={[]}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
          isMobile={false}
        />
      );

      // デスクトップ版のパディングを確認
      let contentDiv = document.querySelector('.p-4');
      expect(contentDiv).toBeInTheDocument();

      rerender(
        <ScoreExplorer
          charts={mockCharts}
          currentChartId={null}
          selectedChartIds={[]}
          onChartSelect={mockOnChartSelect}
          onSelectAll={mockOnSelectAll}
          onSetCurrentChart={mockOnSetCurrentChart}
          onCreateNew={mockOnCreateNew}
          onImport={mockOnImport}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
          onDuplicateSelected={mockOnDuplicateSelected}
          isMobile={true}
          onClose={mockOnClose}
        />
      );

      // モバイル版のパディングを確認
      contentDiv = document.querySelector('.px-4');
      expect(contentDiv).toBeInTheDocument();
    });
  });
});