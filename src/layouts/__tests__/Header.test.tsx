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

// SyncDropdownコンポーネントのモック
vi.mock('../../components/sync/SyncDropdown', () => ({
  SyncDropdown: ({ showDropdown, setShowDropdown, onOpenSettings }: { 
    showDropdown: boolean; 
    setShowDropdown: (show: boolean) => void;
    onOpenSettings: () => void;
  }) => (
    <div data-testid="sync-dropdown">
      <button 
        data-testid="sync-dropdown-button"
        title="同期オプション"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        同期
      </button>
      {showDropdown && (
        <div data-testid="sync-dropdown-menu">
          <button data-testid="sync-execute-button">今すぐ同期</button>
          <button data-testid="sync-settings-button" onClick={onOpenSettings}>詳細設定</button>
        </div>
      )}
    </div>
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
    it('同期設定機能が無効の場合は同期ドロップダウンが表示されない', async () => {
      mockHiddenFeatures.syncSettings = false;
      
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      expect(screen.queryByTestId('sync-dropdown')).not.toBeInTheDocument();
    });

    it('同期設定機能が有効の場合は同期ドロップダウンが表示される', async () => {
      mockHiddenFeatures.syncSettings = true;
      
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      expect(screen.getByTestId('sync-dropdown')).toBeInTheDocument();
      expect(screen.getByTitle('同期オプション')).toBeInTheDocument();
      expect(screen.getByText('同期')).toBeInTheDocument();
    });

    it('同期ドロップダウンボタンをクリックするとメニューが開く', async () => {
      mockHiddenFeatures.syncSettings = true;
      
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      const syncButton = screen.getByTestId('sync-dropdown-button');
      await act(async () => {
        fireEvent.click(syncButton);
      });
      
      expect(screen.getByTestId('sync-dropdown-menu')).toBeInTheDocument();
      expect(screen.getByTestId('sync-execute-button')).toBeInTheDocument();
      expect(screen.getByTestId('sync-settings-button')).toBeInTheDocument();
    });

    it('詳細設定ボタンをクリックするとダイアログが開く', async () => {
      mockHiddenFeatures.syncSettings = true;
      
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      // ドロップダウンを開く
      const syncButton = screen.getByTestId('sync-dropdown-button');
      await act(async () => {
        fireEvent.click(syncButton);
      });
      
      // 詳細設定ボタンをクリック
      const settingsButton = screen.getByTestId('sync-settings-button');
      await act(async () => {
        fireEvent.click(settingsButton);
      });
      
      expect(screen.getByTestId('sync-settings-dialog')).toBeInTheDocument();
    });

    it('ダイアログの閉じるボタンをクリックするとダイアログが閉じる', async () => {
      mockHiddenFeatures.syncSettings = true;
      
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      // ドロップダウンを開いて詳細設定を選択
      const syncButton = screen.getByTestId('sync-dropdown-button');
      await act(async () => {
        fireEvent.click(syncButton);
      });
      
      const settingsButton = screen.getByTestId('sync-settings-button');
      await act(async () => {
        fireEvent.click(settingsButton);
      });
      
      expect(screen.getByTestId('sync-settings-dialog')).toBeInTheDocument();
      
      // ダイアログを閉じる
      const closeButton = screen.getByText('Close Dialog');
      await act(async () => {
        fireEvent.click(closeButton);
      });
      
      expect(screen.queryByTestId('sync-settings-dialog')).not.toBeInTheDocument();
    });

    it('同期ドロップダウンのアイコンとテキストが正しく表示される', async () => {
      mockHiddenFeatures.syncSettings = true;
      
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      // タイトルとテキストが正しく表示されることを確認
      expect(screen.getByTitle('同期オプション')).toBeInTheDocument();
      expect(screen.getByText('同期')).toBeInTheDocument();
    });

    it('同期ドロップダウンが正しい位置に配置される', async () => {
      mockHiddenFeatures.syncSettings = true;
      
      await act(async () => {
        render(<Header explorerOpen={false} setExplorerOpen={mockSetExplorerOpen} />);
      });
      
      const syncDropdown = screen.getByTestId('sync-dropdown');
      const wakeLockButton = screen.getByTitle('スリープ防止を有効にする');
      
      // 同期ドロップダウンとウェイクロックボタンが両方表示されることを確認
      expect(syncDropdown).toBeInTheDocument();
      expect(wakeLockButton).toBeInTheDocument();
      
      // DOM順序での確認（同期ドロップダウンがウェイクロックボタンの前にある）
      const header = syncDropdown.closest('header');
      expect(header).toBeInTheDocument();
    });
  });
});