import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExportDialog from '../ExportDialog';
import type { ChordChart } from '../../types';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'mock-blob-url');
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(globalThis.URL, 'createObjectURL', {
  value: mockCreateObjectURL,
});

Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
});

// Mock createElement for download link
const mockClick = vi.fn();
const mockElement = {
  href: '',
  download: '',
  click: mockClick,
} as unknown as HTMLAnchorElement;

const originalCreateElement = document.createElement;
beforeEach(() => {
  vi.clearAllMocks();
  
  document.createElement = vi.fn((tagName: string) => {
    if (tagName === 'a') {
      return mockElement;
    }
    return originalCreateElement.call(document, tagName);
  });
});

// Sample chart data
const sampleChart: ChordChart = {
  id: 'test-chart-1',
  title: 'Test Song',
  artist: 'Test Artist',
  key: 'C',
  tempo: 120,
  timeSignature: '4/4',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  sections: []
};

const multipleCharts: ChordChart[] = [
  sampleChart,
  {
    ...sampleChart,
    id: 'test-chart-2',
    title: 'Another Song'
  }
];

describe('ExportDialog', () => {
  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <ExportDialog
          isOpen={false}
          onClose={vi.fn()}
          charts={[sampleChart]}
        />
      );

      expect(screen.queryByText('コード譜をエクスポート')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={vi.fn()}
          charts={[sampleChart]}
        />
      );

      expect(screen.getByText('コード譜をエクスポート')).toBeInTheDocument();
      expect(screen.getByLabelText('ファイル名')).toBeInTheDocument();
      expect(screen.getByText('エクスポート')).toBeInTheDocument();
      expect(screen.getByText('キャンセル')).toBeInTheDocument();
    });

    it('should show single chart message for single chart', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={vi.fn()}
          charts={[sampleChart]}
        />
      );

      expect(screen.getByText('「Test Song」をエクスポートします')).toBeInTheDocument();
    });

    it('should show multiple charts message for multiple charts', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={vi.fn()}
          charts={multipleCharts}
        />
      );

      expect(screen.getByText('2件のコード譜をエクスポートします')).toBeInTheDocument();
    });
  });

  describe('Default filename generation', () => {
    it('should use sanitized chart title for single chart', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={vi.fn()}
          charts={[sampleChart]}
        />
      );

      await waitFor(() => {
        const input = screen.getByLabelText('ファイル名') as HTMLInputElement;
        expect(input.value).toBe('test_song');
      });
    });

    it('should use date-based filename for multiple charts', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={vi.fn()}
          charts={multipleCharts}
        />
      );

      await waitFor(() => {
        const input = screen.getByLabelText('ファイル名') as HTMLInputElement;
        expect(input.value).toMatch(/^selected-charts-\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should use custom default filename when provided', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={vi.fn()}
          charts={[sampleChart]}
          defaultFilename="custom-filename"
        />
      );

      await waitFor(() => {
        const input = screen.getByLabelText('ファイル名') as HTMLInputElement;
        expect(input.value).toBe('custom-filename');
      });
    });
  });

  describe('User interactions', () => {
    it('should update filename when user types', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={vi.fn()}
          charts={[sampleChart]}
        />
      );

      const input = screen.getByLabelText('ファイル名') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'my-custom-filename' } });

      expect(input.value).toBe('my-custom-filename');
    });

    it('should call onClose when cancel button is clicked', () => {
      const mockOnClose = vi.fn();
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          charts={[sampleChart]}
        />
      );

      fireEvent.click(screen.getByText('キャンセル'));
      expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it('should call onClose when escape key is pressed', () => {
      const mockOnClose = vi.fn();
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          charts={[sampleChart]}
        />
      );

      const input = screen.getByLabelText('ファイル名');
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it('should disable export button when filename is empty', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={vi.fn()}
          charts={[sampleChart]}
        />
      );

      const input = screen.getByLabelText('ファイル名') as HTMLInputElement;
      const exportButton = screen.getByText('エクスポート');

      // Clear the input
      fireEvent.change(input, { target: { value: '' } });

      expect(exportButton).toBeDisabled();
    });

    it('should enable export button when filename is provided', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={vi.fn()}
          charts={[sampleChart]}
        />
      );

      const exportButton = screen.getByText('エクスポート');

      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });
    });
  });

  describe('Export functionality', () => {
    it('should export with .json extension when export button is clicked', async () => {
      const mockOnClose = vi.fn();
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          charts={[sampleChart]}
        />
      );

      const input = screen.getByLabelText('ファイル名') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'my-export' } });

      const exportButton = screen.getByText('エクスポート');
      fireEvent.click(exportButton);

      expect(mockElement.download).toBe('my-export.json');
      expect(mockClick).toHaveBeenCalledOnce();
      expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it('should not duplicate .json extension if already present', async () => {
      const mockOnClose = vi.fn();
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          charts={[sampleChart]}
        />
      );

      const input = screen.getByLabelText('ファイル名') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'my-export.json' } });

      const exportButton = screen.getByText('エクスポート');
      fireEvent.click(exportButton);

      expect(mockElement.download).toBe('my-export.json');
    });

    it('should export when enter key is pressed', async () => {
      const mockOnClose = vi.fn();
      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          charts={[sampleChart]}
        />
      );

      const input = screen.getByLabelText('ファイル名') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'keyboard-export' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockElement.download).toBe('keyboard-export.json');
      expect(mockClick).toHaveBeenCalledOnce();
      expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it('should create proper blob with chart data', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={vi.fn()}
          charts={[sampleChart]}
        />
      );

      const exportButton = screen.getByText('エクスポート');
      fireEvent.click(exportButton);

      // Check that Blob was created with correct data
      expect(mockCreateObjectURL).toHaveBeenCalledOnce();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
    });
  });

  describe('Accessibility', () => {
    it('should focus input when dialog opens', async () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={vi.fn()}
          charts={[sampleChart]}
        />
      );

      const input = screen.getByLabelText('ファイル名');
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it('should have proper aria labels and roles', () => {
      render(
        <ExportDialog
          isOpen={true}
          onClose={vi.fn()}
          charts={[sampleChart]}
        />
      );

      expect(screen.getByLabelText('ファイル名')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'エクスポート' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });
  });
});