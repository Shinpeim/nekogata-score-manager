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
  const mockOnEditChart = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render tabs (楽譜 and セットリスト)', () => {
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
        onEditChart={mockOnEditChart}
      />
    );

    expect(screen.getByText('楽譜')).toBeInTheDocument();
    expect(screen.getByText('セットリスト')).toBeInTheDocument();
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
        onEditChart={mockOnEditChart}
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
        onEditChart={mockOnEditChart}
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
        onEditChart={mockOnEditChart}
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
        onEditChart={mockOnEditChart}
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
        onEditChart={mockOnEditChart}
      />
    );

    const chartItem = screen.getByTestId('chart-item-0');
    expect(chartItem).toHaveClass('bg-slate-100', 'border-[#85B0B7]', 'border');
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
        onEditChart={mockOnEditChart}
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
        onEditChart={mockOnEditChart}
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
        onEditChart={mockOnEditChart}
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
        onEditChart={mockOnEditChart}
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
        onEditChart={mockOnEditChart}
      />
    );

    expect(screen.getByText('1件選択中')).toBeInTheDocument();
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
          onEditChart={mockOnEditChart}
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
          onEditChart={mockOnEditChart}
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
          onEditChart={mockOnEditChart}
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
          onEditChart={mockOnEditChart}
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
          onEditChart={mockOnEditChart}
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
          onEditChart={mockOnEditChart}
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
          onEditChart={mockOnEditChart}
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
          onEditChart={mockOnEditChart}
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
          onEditChart={mockOnEditChart}
        />
      );

      expect(screen.getByText('Very Long Chart Title That Might Overflow The Container Width')).toBeInTheDocument();
      expect(screen.getByText('Artist With Very Long Name That Also Might Cause Layout Issues')).toBeInTheDocument();
      
      // タグは表示されないため、タイトルとアーティストのみ確認
      expect(screen.getByText('Very Long Chart Title That Might Overflow The Container Width')).toBeInTheDocument();
      expect(screen.getByText('Artist With Very Long Name That Also Might Cause Layout Issues')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render close button for mobile', () => {
      // window.matchMediaのモック
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 767px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

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
          onEditChart={mockOnEditChart}
          onClose={mockOnClose}
        />
      );

      // 閉じるボタンの存在を確認
      expect(screen.getByLabelText('サイドバーを閉じる')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
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
          onEditChart={mockOnEditChart}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByLabelText('サイドバーを閉じる');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onSetCurrentChart and onClose on mobile when chart is clicked', () => {
      // window.matchMediaのモック（モバイル）
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 767px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

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
          onEditChart={mockOnEditChart}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Test Chart 1'));
      expect(mockOnSetCurrentChart).toHaveBeenCalledWith('chart1');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not call onClose on desktop when chart is clicked', () => {
      // window.matchMediaのモック（デスクトップ）
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

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
          onEditChart={mockOnEditChart}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Test Chart 1'));
      expect(mockOnSetCurrentChart).toHaveBeenCalledWith('chart1');
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});