import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyChartPlaceholder from '../EmptyChartPlaceholder';

describe('EmptyChartPlaceholder', () => {
  describe('Rendering', () => {
    it('should render empty state message and buttons', () => {
      render(<EmptyChartPlaceholder />);

      expect(screen.getByText('コード譜がありません')).toBeInTheDocument();
      expect(screen.getByText('まずは新しいコード譜を作成するか、既存のファイルをインポートしてみましょう')).toBeInTheDocument();
      expect(screen.getByText('新規作成')).toBeInTheDocument();
      expect(screen.getByText('インポート')).toBeInTheDocument();
      expect(screen.getByText('Score Explorerを開く')).toBeInTheDocument();
    });

    it('should have proper button styling', () => {
      const { container } = render(<EmptyChartPlaceholder />);

      const createButton = screen.getByText('新規作成');
      expect(createButton).toHaveClass('bg-[#85B0B7]', 'hover:bg-[#6B9CA5]', 'text-white');

      const importButton = screen.getByText('インポート');
      expect(importButton).toHaveClass('bg-[#BDD0CA]', 'hover:bg-[#A4C2B5]', 'text-slate-800');

      const explorerButton = screen.getByText('Score Explorerを開く');
      expect(explorerButton).toHaveClass('bg-slate-200', 'hover:bg-slate-300', 'text-slate-700');
    });
  });

  describe('Callback functions', () => {
    it('should call onCreateNew when 新規作成 button is clicked', () => {
      const mockOnCreateNew = vi.fn();
      render(<EmptyChartPlaceholder onCreateNew={mockOnCreateNew} />);

      const createButton = screen.getByText('新規作成');
      fireEvent.click(createButton);

      expect(mockOnCreateNew).toHaveBeenCalledOnce();
    });

    it('should call onOpenImport when インポート button is clicked', () => {
      const mockOnOpenImport = vi.fn();
      render(<EmptyChartPlaceholder onOpenImport={mockOnOpenImport} />);

      const importButton = screen.getByText('インポート');
      fireEvent.click(importButton);

      expect(mockOnOpenImport).toHaveBeenCalledOnce();
    });

    it('should call onOpenExplorer when Score Explorerを開く button is clicked', () => {
      const mockOnOpenExplorer = vi.fn();
      render(<EmptyChartPlaceholder onOpenExplorer={mockOnOpenExplorer} />);

      const explorerButton = screen.getByText('Score Explorerを開く');
      fireEvent.click(explorerButton);

      expect(mockOnOpenExplorer).toHaveBeenCalledOnce();
    });

    it('should not crash when callbacks are not provided', () => {
      render(<EmptyChartPlaceholder />);

      const createButton = screen.getByText('新規作成');
      const importButton = screen.getByText('インポート');
      const explorerButton = screen.getByText('Score Explorerを開く');

      // Should not throw errors when clicked without callbacks
      expect(() => {
        fireEvent.click(createButton);
        fireEvent.click(importButton);
        fireEvent.click(explorerButton);
      }).not.toThrow();
    });
  });

  describe('Layout', () => {
    it('should have proper responsive layout classes', () => {
      const { container } = render(<EmptyChartPlaceholder />);

      const buttonContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(buttonContainer).toBeInTheDocument();
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