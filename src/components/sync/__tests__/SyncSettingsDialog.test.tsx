import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyncSettingsDialog } from '../SyncSettingsDialog';
import { SyncManager } from '../../../utils/sync/syncManager';
import { GoogleAuthProvider } from '../../../utils/sync/googleAuth';

vi.mock('../../../utils/sync/syncManager');
vi.mock('../../../utils/sync/googleAuth');
vi.mock('../../../stores/syncStore');

const mockSyncManager = {
  getConfig: vi.fn(),
  saveConfig: vi.fn(),
  getLastSyncTimeAsDate: vi.fn(),
  sync: vi.fn(),
};

const mockAuthProvider = {
  isAuthenticated: vi.fn(),
  authenticate: vi.fn(),
  signOut: vi.fn(),
  initialize: vi.fn(),
  getUserEmail: vi.fn(),
  validateToken: vi.fn(),
};

const mockUseSyncStore = {
  isSyncing: false,
  lastSyncTime: null as Date | null,
  syncError: null as string | null,
  syncManager: null,
  syncConfig: {
    autoSync: false,
    syncInterval: 5,
    conflictResolution: 'remote' as const,
    showConflictWarning: true,
  },
  isAuthenticated: vi.fn(),
  authenticate: vi.fn(),
  signOut: vi.fn(),
  sync: vi.fn(),
  clearSyncError: vi.fn(),
  updateSyncConfig: vi.fn(),
  initializeSync: vi.fn(),
};

describe('SyncSettingsDialog', () => {
  beforeEach(async () => {
    vi.mocked(SyncManager.getInstance).mockReturnValue(mockSyncManager as unknown as SyncManager);
    vi.mocked(GoogleAuthProvider.getInstance).mockReturnValue(mockAuthProvider as unknown as GoogleAuthProvider);
    
    // useSyncStoreのモック
    const { useSyncStore } = await import('../../../stores/syncStore');
    vi.mocked(useSyncStore).mockReturnValue(mockUseSyncStore);
    vi.mocked(useSyncStore.getState).mockReturnValue(mockUseSyncStore);
    
    mockSyncManager.getConfig.mockReturnValue({
      autoSync: false,
      syncInterval: 5,
      conflictResolution: 'remote',
      showConflictWarning: true,
    });
    
    mockUseSyncStore.isAuthenticated.mockReturnValue(false);
    mockUseSyncStore.syncManager = {} as any; // テスト用にモックsyncManagerを設定
    mockAuthProvider.getUserEmail.mockResolvedValue('test@example.com');
    mockSyncManager.getLastSyncTimeAsDate.mockReturnValue(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('ダイアログが開いていない時は何も表示されない', () => {
    render(<SyncSettingsDialog isOpen={false} onClose={() => {}} />);
    
    expect(screen.queryByText('Google Drive同期設定')).not.toBeInTheDocument();
  });

  it('ダイアログが開いている時に設定画面が表示される', async () => {
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('Google Drive同期設定')).toBeInTheDocument();
    });
    
    expect(screen.getByText('アカウント連携')).toBeInTheDocument();
    expect(screen.getByText('同期設定')).toBeInTheDocument();
    expect(screen.getByText('同期状態')).toBeInTheDocument();
  });

  it('未認証状態で正しい表示がされる', async () => {
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('未連携')).toBeInTheDocument();
      expect(screen.getByText('Googleアカウントで連携')).toBeInTheDocument();
    });
  });

  it('認証済み状態で正しい表示がされる', async () => {
    mockUseSyncStore.isAuthenticated.mockReturnValue(true);
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('連携中')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('サインアウト')).toBeInTheDocument();
    });
  });

  it('サインインボタンをクリックすると認証処理が実行される', async () => {
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const signInButton = screen.getByText('Googleアカウントで連携');
      fireEvent.click(signInButton);
    });
    
    expect(mockUseSyncStore.authenticate).toHaveBeenCalled();
  });

  it('サインアウトボタンをクリックするとサインアウト処理が実行される', async () => {
    mockUseSyncStore.isAuthenticated.mockReturnValue(true);
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const signOutButton = screen.getByText('サインアウト');
      fireEvent.click(signOutButton);
    });
    
    expect(mockUseSyncStore.signOut).toHaveBeenCalled();
  });

  it('手動同期ボタンをクリックすると同期処理が実行される', async () => {
    mockUseSyncStore.isAuthenticated.mockReturnValue(true);
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const syncButton = screen.getByText('今すぐ同期');
      fireEvent.click(syncButton);
    });
    
    expect(mockUseSyncStore.clearSyncError).toHaveBeenCalled();
    expect(mockUseSyncStore.sync).toHaveBeenCalledWith([]);
  });

  it('自動同期の設定を変更できる', async () => {
    mockUseSyncStore.isAuthenticated.mockReturnValue(true);
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const autoSyncToggle = buttons.find(button => 
        button.className.includes('w-12 h-6 rounded-full')
      );
      fireEvent.click(autoSyncToggle!);
    });
    
    expect(mockUseSyncStore.updateSyncConfig).toHaveBeenCalled();
  });

  it('同期間隔の設定を変更できる', async () => {
    mockUseSyncStore.isAuthenticated.mockReturnValue(true);
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const intervalSelect = screen.getByDisplayValue('5分');
      fireEvent.change(intervalSelect, { target: { value: '15' } });
    });
    
    expect(mockUseSyncStore.updateSyncConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        syncInterval: 15
      })
    );
  });

  it('コンフリクト解決の設定を変更できる', async () => {
    mockUseSyncStore.isAuthenticated.mockReturnValue(true);
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const conflictSelect = screen.getByDisplayValue('リモート優先');
      fireEvent.change(conflictSelect, { target: { value: 'local' } });
    });
    
    expect(mockUseSyncStore.updateSyncConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        conflictResolution: 'local'
      })
    );
  });

  it('未認証状態では設定項目が無効化される', async () => {
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const intervalSelect = screen.getByDisplayValue('5分');
      const conflictSelect = screen.getByDisplayValue('リモート優先');
      
      expect(intervalSelect).toBeDisabled();
      expect(conflictSelect).toBeDisabled();
    });
  });

  it('最終同期時刻が正しくフォーマットされて表示される', async () => {
    mockUseSyncStore.lastSyncTime = new Date('2024-01-01T00:00:00Z');
    
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
    mockUseSyncStore.syncError = 'ネットワークエラーが発生しました';
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument();
    });
  });

  it('同期中の状態が表示される', async () => {
    mockUseSyncStore.isSyncing = true;
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const syncButton = screen.getByText('同期中...');
      expect(syncButton).toBeDisabled();
    });
  });
});