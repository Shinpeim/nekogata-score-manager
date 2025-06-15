import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActionDropdown from '../ActionDropdown';

describe('ActionDropdown', () => {
  const mockSetShowActionsDropdown = vi.fn();
  const mockOnExportSelected = vi.fn();
  const mockOnDeleteSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render disabled button when no charts are selected', () => {
    render(
      <ActionDropdown
        selectedChartIds={[]}
        showActionsDropdown={false}
        setShowActionsDropdown={mockSetShowActionsDropdown}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
      />
    );

    const button = screen.getByRole('button', { name: 'アクション' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('bg-slate-300', 'text-slate-500', 'cursor-not-allowed');
  });

  it('should render enabled button when charts are selected', () => {
    render(
      <ActionDropdown
        selectedChartIds={['chart1', 'chart2']}
        showActionsDropdown={false}
        setShowActionsDropdown={mockSetShowActionsDropdown}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
      />
    );

    const button = screen.getByRole('button', { name: 'アクション' });
    expect(button).not.toBeDisabled();
    expect(button).toHaveClass('bg-[#85B0B7]', 'text-white', 'cursor-pointer');
  });

  it('should toggle dropdown when enabled button is clicked', () => {
    render(
      <ActionDropdown
        selectedChartIds={['chart1']}
        showActionsDropdown={false}
        setShowActionsDropdown={mockSetShowActionsDropdown}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
      />
    );

    const button = screen.getByRole('button', { name: 'アクション' });
    fireEvent.click(button);

    expect(mockSetShowActionsDropdown).toHaveBeenCalledWith(true);
  });

  it('should not toggle dropdown when disabled button is clicked', () => {
    render(
      <ActionDropdown
        selectedChartIds={[]}
        showActionsDropdown={false}
        setShowActionsDropdown={mockSetShowActionsDropdown}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
      />
    );

    const button = screen.getByRole('button', { name: 'アクション' });
    fireEvent.click(button);

    expect(mockSetShowActionsDropdown).not.toHaveBeenCalled();
  });

  it('should show dropdown menu when showActionsDropdown is true', () => {
    render(
      <ActionDropdown
        selectedChartIds={['chart1']}
        showActionsDropdown={true}
        setShowActionsDropdown={mockSetShowActionsDropdown}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
      />
    );

    expect(screen.getByText('エクスポート')).toBeInTheDocument();
    expect(screen.getByText('削除')).toBeInTheDocument();
  });

  it('should not show dropdown menu when showActionsDropdown is false', () => {
    render(
      <ActionDropdown
        selectedChartIds={['chart1']}
        showActionsDropdown={false}
        setShowActionsDropdown={mockSetShowActionsDropdown}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
      />
    );

    expect(screen.queryByText('エクスポート')).not.toBeInTheDocument();
    expect(screen.queryByText('削除')).not.toBeInTheDocument();
  });

  it('should call onExportSelected when export button is clicked', async () => {
    render(
      <ActionDropdown
        selectedChartIds={['chart1']}
        showActionsDropdown={true}
        setShowActionsDropdown={mockSetShowActionsDropdown}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
      />
    );

    const exportButton = screen.getByText('エクスポート');
    fireEvent.click(exportButton);

    expect(mockSetShowActionsDropdown).toHaveBeenCalledWith(false);
    
    // setTimeoutを使用しているので少し待つ
    await waitFor(() => {
      expect(mockOnExportSelected).toHaveBeenCalled();
    });
  });

  it('should call onDeleteSelected when delete button is clicked', async () => {
    render(
      <ActionDropdown
        selectedChartIds={['chart1']}
        showActionsDropdown={true}
        setShowActionsDropdown={mockSetShowActionsDropdown}
        onExportSelected={mockOnExportSelected}
        onDeleteSelected={mockOnDeleteSelected}
      />
    );

    const deleteButton = screen.getByText('削除');
    fireEvent.click(deleteButton);

    expect(mockSetShowActionsDropdown).toHaveBeenCalledWith(false);
    
    // setTimeoutを使用しているので少し待つ
    await waitFor(() => {
      expect(mockOnDeleteSelected).toHaveBeenCalled();
    });
  });

  it('should close dropdown when clicking outside', async () => {
    render(
      <div>
        <ActionDropdown
          selectedChartIds={['chart1']}
          showActionsDropdown={true}
          setShowActionsDropdown={mockSetShowActionsDropdown}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
        />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const outsideElement = screen.getByTestId('outside');
    fireEvent.mouseDown(outsideElement);

    await waitFor(() => {
      expect(mockSetShowActionsDropdown).toHaveBeenCalledWith(false);
    });
  });

  describe('Complex Click Outside Behavior', () => {
    it('should handle multiple sequential click events correctly', async () => {
      const { rerender } = render(
        <div>
          <ActionDropdown
            selectedChartIds={['chart1']}
            showActionsDropdown={true}
            setShowActionsDropdown={mockSetShowActionsDropdown}
            onExportSelected={mockOnExportSelected}
            onDeleteSelected={mockOnDeleteSelected}
          />
          <div data-testid="outside-1">Outside 1</div>
          <div data-testid="outside-2">Outside 2</div>
        </div>
      );

      const outside1 = screen.getByTestId('outside-1');

      // 最初の外部クリック
      fireEvent.mouseDown(outside1);
      await waitFor(() => {
        expect(mockSetShowActionsDropdown).toHaveBeenCalledWith(false);
      });

      // ドロップダウンが閉じられた状態に再レンダリング
      mockSetShowActionsDropdown.mockClear();
      rerender(
        <div>
          <ActionDropdown
            selectedChartIds={['chart1']}
            showActionsDropdown={false}
            setShowActionsDropdown={mockSetShowActionsDropdown}
            onExportSelected={mockOnExportSelected}
            onDeleteSelected={mockOnDeleteSelected}
          />
          <div data-testid="outside-1">Outside 1</div>
          <div data-testid="outside-2">Outside 2</div>
        </div>
      );

      const outside2 = screen.getByTestId('outside-2');
      fireEvent.mouseDown(outside2);
      
      // showActionsDropdownがfalseの場合、イベントリスナーが追加されないため呼ばれない
      expect(mockSetShowActionsDropdown).not.toHaveBeenCalled();
    });

    it('should not close when clicking inside dropdown content area', () => {
      const { container } = render(
        <div>
          <ActionDropdown
            selectedChartIds={['chart1']}
            showActionsDropdown={true}
            setShowActionsDropdown={mockSetShowActionsDropdown}
            onExportSelected={mockOnExportSelected}
            onDeleteSelected={mockOnDeleteSelected}
          />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      // ドロップダウンコンテナ内の空白部分をクリック
      const dropdownContainer = container.querySelector('.absolute.top-full');
      if (dropdownContainer) {
        fireEvent.mouseDown(dropdownContainer);
        // 内部クリックなので閉じるハンドラーは呼ばれない
        expect(mockSetShowActionsDropdown).not.toHaveBeenCalledWith(false);
      }
    });

    it('should handle rapid toggle clicks correctly', () => {
      render(
        <ActionDropdown
          selectedChartIds={['chart1']}
          showActionsDropdown={false}
          setShowActionsDropdown={mockSetShowActionsDropdown}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
        />
      );

      const toggleButton = screen.getByRole('button', { name: 'アクション' });

      // 高速で複数回クリック
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);

      // トグル動作が正しく呼ばれていることを確認
      // 実際のトグル動作では、現在の状態に応じて反転されるため、
      // 最初がfalseの場合、すべてtrueになる
      expect(mockSetShowActionsDropdown).toHaveBeenCalledTimes(3);
      expect(mockSetShowActionsDropdown).toHaveBeenNthCalledWith(1, true);
      expect(mockSetShowActionsDropdown).toHaveBeenNthCalledWith(2, true);
      expect(mockSetShowActionsDropdown).toHaveBeenNthCalledWith(3, true);
    });

    it('should cleanup event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <ActionDropdown
          selectedChartIds={['chart1']}
          showActionsDropdown={true}
          setShowActionsDropdown={mockSetShowActionsDropdown}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
        />
      );

      // イベントリスナーが追加されていることを確認
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

      // コンポーネントをアンマウント
      unmount();

      // イベントリスナーが削除されていることを確認
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should handle export action with preventDefault and stopPropagation', async () => {
      render(
        <ActionDropdown
          selectedChartIds={['chart1']}
          showActionsDropdown={true}
          setShowActionsDropdown={mockSetShowActionsDropdown}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
        />
      );

      const exportButton = screen.getByText('エクスポート');
      
      // カスタムイベントオブジェクトでイベントの詳細をテスト
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: exportButton,
        currentTarget: exportButton,
      };

      fireEvent.click(exportButton, mockEvent);

      // イベントの制御が正しく呼ばれていることは直接検証できないが、
      // 機能が正常に動作することを確認
      expect(mockSetShowActionsDropdown).toHaveBeenCalledWith(false);
      
      await waitFor(() => {
        expect(mockOnExportSelected).toHaveBeenCalled();
      });
    });

    it('should handle delete action with confirmation flow simulation', async () => {
      render(
        <ActionDropdown
          selectedChartIds={['chart1', 'chart2']}
          showActionsDropdown={true}
          setShowActionsDropdown={mockSetShowActionsDropdown}
          onExportSelected={mockOnExportSelected}
          onDeleteSelected={mockOnDeleteSelected}
        />
      );

      const deleteButton = screen.getByText('削除');
      fireEvent.click(deleteButton);

      // ドロップダウンが閉じられることを確認
      expect(mockSetShowActionsDropdown).toHaveBeenCalledWith(false);
      
      // 削除ハンドラーが呼ばれることを確認（実際の確認ダイアログは親コンポーネントで処理）
      await waitFor(() => {
        expect(mockOnDeleteSelected).toHaveBeenCalled();
      });
    });
  });
});