import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyncSettingsDialog } from '../SyncSettingsDialog';
import { SyncManager } from '../../../utils/sync/syncManager';
import { createMockChartSync } from '../../../hooks/__tests__/testHelpers';

vi.mock('../../../utils/sync/syncManager');
vi.mock('../../../hooks/useChartSync');

const mockSyncManager = {
  initialize: vi.fn(),
  getConfig: vi.fn(),
  saveConfig: vi.fn(),
  getLastSyncTimeAsDate: vi.fn(),
  sync: vi.fn(),
};


const mockUseChartSync = {
  // 同期関連
  syncCharts: vi.fn(),
  isSyncing: false,
  lastSyncTime: null as Date | null,
  syncError: null as string | null,
  syncConfig: {
    autoSync: false,
    showConflictWarning: true,
  },
  
  // 認証関連
  isAuthenticated: false,
  authenticate: vi.fn(),
  signOut: vi.fn(),
  
  // 設定関連
  updateSyncConfig: vi.fn(),
  clearSyncError: vi.fn(),
  
  // チャート関連（useChartSyncの要求プロパティ）
  charts: {},
  currentChartId: null as string | null,
  setLists: {},
  currentSetListId: null as string | null,
  isLoading: false,
  error: null as string | null,
};

describe('SyncSettingsDialog', () => {
  beforeEach(async () => {
    vi.mocked(SyncManager.getInstance).mockReturnValue(mockSyncManager as unknown as SyncManager);
    
    const { useChartSync } = await import('../../../hooks/useChartSync');
    const { createMockChartSync } = await import('../../../hooks/__tests__/testHelpers');
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync(mockUseChartSync));
    
    mockSyncManager.getConfig.mockReturnValue({
      autoSync: false,
      showConflictWarning: true,
    });
    
    mockUseChartSync.isAuthenticated = false;
    mockSyncManager.getLastSyncTimeAsDate.mockReturnValue(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('ダイアログが開いていない時は何も表示されない', () => {
    render(<SyncSettingsDialog isOpen={false} onClose={() => {}} />);
    
    expect(screen.queryByText('Dropbox同期設定')).not.toBeInTheDocument();
  });

  it('ダイアログが開いている時に設定画面が表示される', async () => {
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('Dropbox同期設定')).toBeInTheDocument();
    });
    
    expect(screen.getByText('アカウント連携')).toBeInTheDocument();
    expect(screen.getByText('同期設定')).toBeInTheDocument();
    expect(screen.getByText('同期状態')).toBeInTheDocument();
  });

  it('未認証状態で正しい表示がされる', async () => {
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('未連携')).toBeInTheDocument();
      expect(screen.getByText('Dropboxアカウントで連携')).toBeInTheDocument();
    });
  });

  it('認証済み状態で正しい表示がされる', async () => {
    const { useChartSync } = await import('../../../hooks/useChartSync');
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync({
      ...mockUseChartSync,
      isAuthenticated: true
    }));
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('連携中')).toBeInTheDocument();
      expect(screen.getByText('サインアウト')).toBeInTheDocument();
    });
  });

  it('サインインボタンをクリックすると認証処理が実行される', async () => {
    const { useChartSync } = await import('../../../hooks/useChartSync');
    const mockAuth = vi.fn();
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync({
      ...mockUseChartSync,
      authenticate: mockAuth
    }));
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const signInButton = screen.getByText('Dropboxアカウントで連携');
      fireEvent.click(signInButton);
    });
    
    expect(mockAuth).toHaveBeenCalled();
  });

  it('サインアウトボタンをクリックするとサインアウト処理が実行される', async () => {
    const { useChartSync } = await import('../../../hooks/useChartSync');
    const mockSignOut = vi.fn();
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync({
      ...mockUseChartSync,
      isAuthenticated: true,
      signOut: mockSignOut
    }));
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const signOutButton = screen.getByText('サインアウト');
      fireEvent.click(signOutButton);
    });
    
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('手動同期ボタンをクリックすると同期処理が実行される', async () => {
    const { useChartSync } = await import('../../../hooks/useChartSync');
    const mockClearError = vi.fn();
    const mockSyncCharts = vi.fn();
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync({
      ...mockUseChartSync,
      isAuthenticated: true,
      clearSyncError: mockClearError,
      syncCharts: mockSyncCharts
    }));
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const syncButton = screen.getByText('今すぐ同期');
      fireEvent.click(syncButton);
    });
    
    expect(mockClearError).toHaveBeenCalled();
    expect(mockSyncCharts).toHaveBeenCalled();
  });

  it('自動同期の設定を変更できる', async () => {
    const { useChartSync } = await import('../../../hooks/useChartSync');
    const mockUpdateConfig = vi.fn();
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync({
      ...mockUseChartSync,
      isAuthenticated: true,
      updateSyncConfig: mockUpdateConfig
    }));
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const autoSyncToggle = buttons.find(button => 
        button.className.includes('w-12 h-6 rounded-full')
      );
      fireEvent.click(autoSyncToggle!);
    });
    
    expect(mockUpdateConfig).toHaveBeenCalled();
  });



  it('未認証状態では設定項目が無効化される', async () => {
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const autoSyncToggle = buttons.find(button => 
        button.className.includes('w-12 h-6 rounded-full')
      );
      
      expect(autoSyncToggle).toBeDisabled();
    });
  });

  it('最終同期時刻が正しくフォーマットされて表示される', async () => {
    const { useChartSync } = await import('../../../hooks/useChartSync');
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync({
      ...mockUseChartSync,
      lastSyncTime: new Date('2024-01-01T00:00:00Z')
    }));
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      // 実行環境のタイムゾーンで期待値を計算
      const mockDate = new Date('2024-01-01T00:00:00Z');
      const expectedFormat = new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(mockDate);
      
      expect(screen.getByText(expectedFormat)).toBeInTheDocument();
    });
  });

  it('閉じるボタンをクリックするとonCloseが呼ばれる', async () => {
    const onClose = vi.fn();
    
    render(<SyncSettingsDialog isOpen={true} onClose={onClose} />);
    
    await waitFor(() => {
      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);
    });
    
    expect(onClose).toHaveBeenCalled();
  });

  it('同期エラーが表示される', async () => {
    const { useChartSync } = await import('../../../hooks/useChartSync');
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync({
      ...mockUseChartSync,
      syncError: 'ネットワークエラーが発生しました'
    }));
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument();
    });
  });

  it('同期中の状態が表示される', async () => {
    const { useChartSync } = await import('../../../hooks/useChartSync');
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync({
      ...mockUseChartSync,
      isSyncing: true
    }));
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const syncButton = screen.getByText('同期中...');
      expect(syncButton).toBeDisabled();
    });
  });
});