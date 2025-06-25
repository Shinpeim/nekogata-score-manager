import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyChartPlaceholder from '../EmptyChartPlaceholder';

describe('EmptyChartPlaceholder', () => {
  describe('Rendering', () => {
    it('should render empty state message and button', () => {
      render(<EmptyChartPlaceholder />);

      expect(screen.getByText('コード譜がありません')).toBeInTheDocument();
      expect(screen.getByText('Score Explorerを開いて、新しいコード譜を作成したり既存のファイルをインポートしてみましょう')).toBeInTheDocument();
      expect(screen.getByText('Score Explorerを開く')).toBeInTheDocument();
    });

    it('should have proper button styling', () => {
      render(<EmptyChartPlaceholder />);

      const explorerButton = screen.getByText('Score Explorerを開く');
      expect(explorerButton).toHaveClass('bg-[#85B0B7]', 'hover:bg-[#6B9CA5]', 'text-white');
    });
  });

  describe('Callback functions', () => {
    it('should call onOpenExplorer when Score Explorerを開く button is clicked', () => {
      const mockOnOpenExplorer = vi.fn();
      render(<EmptyChartPlaceholder onOpenExplorer={mockOnOpenExplorer} />);

      const explorerButton = screen.getByText('Score Explorerを開く');
      fireEvent.click(explorerButton);

      expect(mockOnOpenExplorer).toHaveBeenCalledOnce();
    });

    it('should not crash when callbacks are not provided', () => {
      render(<EmptyChartPlaceholder />);

      const explorerButton = screen.getByText('Score Explorerを開く');

      // Should not throw errors when clicked without callbacks
      expect(() => {
        fireEvent.click(explorerButton);
      }).not.toThrow();
    });
  });

  describe('Layout', () => {
    it('should have proper layout classes', () => {
      const { container } = render(<EmptyChartPlaceholder />);

      // ボタンを含むテキストセンターの要素を確認
      const textCenter = container.querySelector('.text-center');
      expect(textCenter).toBeInTheDocument();
      
      // Score Explorerボタンが存在することを確認
      const explorerButton = screen.getByTestId('open-explorer-button');
      expect(explorerButton).toBeInTheDocument();
    });

    it('should center content properly', () => {
      const { container } = render(<EmptyChartPlaceholder />);

      const mainContainer = container.querySelector('.h-full.bg-white.flex.items-center.justify-center');
      expect(mainContainer).toBeInTheDocument();

      const textCenter = container.querySelector('.text-center');
      expect(textCenter).toBeInTheDocument();
    });
  });
});