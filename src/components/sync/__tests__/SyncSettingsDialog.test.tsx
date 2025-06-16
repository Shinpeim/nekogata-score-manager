import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyncSettingsDialog } from '../SyncSettingsDialog';
import { SyncManager } from '../../../utils/sync/syncManager';
import { GoogleAuthProvider } from '../../../utils/sync/googleAuth';

vi.mock('../../../utils/sync/syncManager');
vi.mock('../../../utils/sync/googleAuth');

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
};

describe('SyncSettingsDialog', () => {
  beforeEach(() => {
    vi.mocked(SyncManager.getInstance).mockReturnValue(mockSyncManager as unknown as SyncManager);
    vi.mocked(GoogleAuthProvider.getInstance).mockReturnValue(mockAuthProvider as unknown as GoogleAuthProvider);
    
    mockSyncManager.getConfig.mockReturnValue({
      autoSync: false,
      syncInterval: 5,
      conflictResolution: 'remote',
      showConflictWarning: true,
    });
    
    mockAuthProvider.isAuthenticated.mockReturnValue(false);
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
    mockAuthProvider.isAuthenticated.mockReturnValue(true);
    
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
    
    expect(mockAuthProvider.authenticate).toHaveBeenCalled();
  });

  it('サインアウトボタンをクリックするとサインアウト処理が実行される', async () => {
    mockAuthProvider.isAuthenticated.mockReturnValue(true);
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const signOutButton = screen.getByText('サインアウト');
      fireEvent.click(signOutButton);
    });
    
    expect(mockAuthProvider.signOut).toHaveBeenCalled();
  });

  it('認証済み状態で自動同期トグルをクリックすると設定が更新される', async () => {
    mockAuthProvider.isAuthenticated.mockReturnValue(true);
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const toggleButtons = screen.getAllByRole('button');
      const autoSyncToggle = toggleButtons.find(button => 
        button.className.includes('w-12 h-6 rounded-full')
      );
      if (autoSyncToggle) {
        fireEvent.click(autoSyncToggle);
      }
    });
    
    expect(mockSyncManager.saveConfig).toHaveBeenCalledWith({
      autoSync: true,
      syncInterval: 5,
      conflictResolution: 'remote',
      showConflictWarning: true,
    });
  });

  it('同期間隔を変更すると設定が更新される', async () => {
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const intervalSelect = screen.getByDisplayValue('5分');
      fireEvent.change(intervalSelect, { target: { value: '15' } });
    });
    
    expect(mockSyncManager.saveConfig).toHaveBeenCalledWith({
      autoSync: false,
      syncInterval: 15,
      conflictResolution: 'remote',
      showConflictWarning: true,
    });
  });

  it('コンフリクト解決方法を変更すると設定が更新される', async () => {
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const conflictSelect = screen.getByDisplayValue('リモート優先');
      fireEvent.change(conflictSelect, { target: { value: 'local' } });
    });
    
    expect(mockSyncManager.saveConfig).toHaveBeenCalledWith({
      autoSync: false,
      syncInterval: 5,
      conflictResolution: 'local',
      showConflictWarning: true,
    });
  });

  it('認証済み状態で手動同期ボタンをクリックすると同期が実行される', async () => {
    mockAuthProvider.isAuthenticated.mockReturnValue(true);
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const syncButton = screen.getByText('今すぐ同期');
      fireEvent.click(syncButton);
    });
    
    expect(mockSyncManager.sync).toHaveBeenCalledWith([]);
  });

  it('未認証状態では手動同期ボタンが無効になる', async () => {
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const syncButton = screen.getByText('今すぐ同期');
      expect(syncButton).toBeDisabled();
    });
  });

  it('最終同期時刻が正しくフォーマットされて表示される', async () => {
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

  it('認証エラーが発生した場合にエラーメッセージが表示される', async () => {
    mockAuthProvider.initialize.mockRejectedValue(new Error('認証エラー'));
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const signInButton = screen.getByText('Googleアカウントで連携');
      fireEvent.click(signInButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('認証エラー')).toBeInTheDocument();
    });
  });

  it('同期エラーが発生した場合にエラーメッセージが表示される', async () => {
    mockAuthProvider.isAuthenticated.mockReturnValue(true);
    mockSyncManager.sync.mockRejectedValue(new Error('同期エラー'));
    
    render(<SyncSettingsDialog isOpen={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const syncButton = screen.getByText('今すぐ同期');
      fireEvent.click(syncButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('同期エラー')).toBeInTheDocument();
    });
  });
});