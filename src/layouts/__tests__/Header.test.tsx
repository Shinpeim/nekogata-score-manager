import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Header from '../Header';

// useWakeLockフックのモック
const mockToggleWakeLock = vi.fn();
vi.mock('../../hooks/useWakeLock', () => ({
  useWakeLock: () => ({
    isActive: false,
    isSupported: true,
    toggleWakeLock: mockToggleWakeLock,
  }),
}));

// useHiddenFeaturesフックのモック
const mockHiddenFeatures = {
  syncSettings: false,
};
vi.mock('../../hooks/useHiddenFeatures', () => ({
  useHiddenFeatures: () => mockHiddenFeatures,
}));

// SyncSettingsDialogコンポーネントのモック
vi.mock('../../components/sync/SyncSettingsDialog', () => ({
  SyncSettingsDialog: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="sync-settings-dialog">
        <button onClick={onClose}>Close Dialog</button>
      </div>
    ) : null
  ),
}));

describe('Header', () => {
  const mockSetExplorerOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockHiddenFeatures.syncSettings = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the header with title', async () => {
    await act(async () => {
      render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
    });
    
    expect(screen.getByText('Nekogata Score Manager')).toBeInTheDocument();
  });

  it('should render open explorer button when explorer is closed', async () => {
    await act(async () => {
      render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
    });
    
    const button = screen.getByRole('button', { name: /open score explorer/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('open score explorer')).toBeInTheDocument();
  });

  it('should render close explorer button when explorer is open', async () => {
    await act(async () => {
      render(<Header explorerOpen={true} setExplorerOpen={mockSetExplorerOpen} />);
    });
    
    const button = screen.getByRole('button', { name: /close score explorer/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('close score explorer')).toBeInTheDocument();
  });

  it('should call setExplorerOpen when explorer toggle button is clicked', async () => {
    await act(async () => {
      render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
    });
    
    const button = screen.getByRole('button', { name: /open score explorer/i });
    await act(async () => {
      fireEvent.click(button);
    });
    
    expect(mockSetExplorerOpen).toHaveBeenCalledWith(true);
  });

  it('should render wake lock button when supported', async () => {
    await act(async () => {
      render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
    });
    
    const wakeLockButton = screen.getByTitle('スリープ防止を有効にする');
    expect(wakeLockButton).toBeInTheDocument();
    expect(screen.getByText('スリープ防止')).toBeInTheDocument();
  });

  it('should call toggleWakeLock when wake lock button is clicked', async () => {
    await act(async () => {
      render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
    });
    
    const wakeLockButton = screen.getByTitle('スリープ防止を有効にする');
    await act(async () => {
      fireEvent.click(wakeLockButton);
    });
    
    expect(mockToggleWakeLock).toHaveBeenCalled();
  });

  describe('Wake Lock States', () => {
    it('should show correct styles for non-active wake lock', async () => {
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      // 非アクティブ状態のスタイル確認（デフォルトのモック状態）
      const wakeLockButton = screen.getByTitle('スリープ防止を有効にする');
      expect(wakeLockButton).toHaveClass('bg-slate-100', 'text-slate-600');
      expect(screen.getByText('スリープ防止')).toBeInTheDocument();
    });

    it('should handle wake lock button interactions', async () => {
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      const wakeLockButton = screen.getByTitle('スリープ防止を有効にする');
      
      // 複数回クリックしても正常に動作することを確認
      await act(async () => {
        fireEvent.click(wakeLockButton);
        fireEvent.click(wakeLockButton);
        fireEvent.click(wakeLockButton);
      });
      
      expect(mockToggleWakeLock).toHaveBeenCalledTimes(3);
    });

    it('should show wake lock button when supported', async () => {
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      // デフォルトのモックではサポートされている
      expect(screen.getByTitle('スリープ防止を有効にする')).toBeInTheDocument();
      expect(screen.getByText('スリープ防止')).toBeInTheDocument();
    });
  });

  describe('Sync Settings Feature', () => {
    it('同期設定機能が無効の場合は同期設定ボタンが表示されない', async () => {
      mockHiddenFeatures.syncSettings = false;
      
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      expect(screen.queryByTitle('Google Drive同期設定')).not.toBeInTheDocument();
    });

    it('同期設定機能が有効の場合は同期設定ボタンが表示される', async () => {
      mockHiddenFeatures.syncSettings = true;
      
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      expect(screen.getByTitle('Google Drive同期設定')).toBeInTheDocument();
      expect(screen.getByText('同期設定')).toBeInTheDocument();
    });

    it('同期設定ボタンをクリックするとダイアログが開く', async () => {
      mockHiddenFeatures.syncSettings = true;
      
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      const syncButton = screen.getByTitle('Google Drive同期設定');
      await act(async () => {
        fireEvent.click(syncButton);
      });
      
      expect(screen.getByTestId('sync-settings-dialog')).toBeInTheDocument();
    });

    it('ダイアログの閉じるボタンをクリックするとダイアログが閉じる', async () => {
      mockHiddenFeatures.syncSettings = true;
      
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      // ダイアログを開く
      const syncButton = screen.getByTitle('Google Drive同期設定');
      await act(async () => {
        fireEvent.click(syncButton);
      });
      
      expect(screen.getByTestId('sync-settings-dialog')).toBeInTheDocument();
      
      // ダイアログを閉じる
      const closeButton = screen.getByText('Close Dialog');
      await act(async () => {
        fireEvent.click(closeButton);
      });
      
      expect(screen.queryByTestId('sync-settings-dialog')).not.toBeInTheDocument();
    });

    it('同期設定ボタンのアイコンとテキストが正しく表示される', async () => {
      mockHiddenFeatures.syncSettings = true;
      
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      const syncButton = screen.getByTitle('Google Drive同期設定');
      
      // ボタン内にSVGアイコンが存在することを確認
      const svgIcon = syncButton.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
      
      // テキストが正しく表示されることを確認
      expect(screen.getByText('同期設定')).toBeInTheDocument();
    });

    it('同期設定ボタンが正しい位置に配置される', async () => {
      mockHiddenFeatures.syncSettings = true;
      
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      const syncButton = screen.getByTitle('Google Drive同期設定');
      const wakeLockButton = screen.getByTitle('スリープ防止を有効にする');
      
      // 同期設定ボタンがウェイクロックボタンの前にある（DOM順序的に）
      const header = syncButton.closest('header');
      const buttons = header?.querySelectorAll('button');
      
      expect(buttons).toBeDefined();
      if (buttons) {
        const syncIndex = Array.from(buttons).indexOf(syncButton as HTMLButtonElement);
        const wakeLockIndex = Array.from(buttons).indexOf(wakeLockButton as HTMLButtonElement);
        expect(syncIndex).toBeLessThan(wakeLockIndex);
      }
    });
  });
});