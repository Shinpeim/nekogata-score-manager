import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyncDropdown } from '../SyncDropdown';

vi.mock('../../../hooks/useChartSync');

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
  
  // チャート関連
  charts: {},
  currentChartId: null as string | null,
  isLoading: false,
  error: null as string | null,
};

describe('SyncDropdown', () => {
  const mockSetShowDropdown = vi.fn();
  const mockOnOpenSettings = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { useChartSync } = await import('../../../hooks/useChartSync');
    const { createMockChartSync } = await import('../../../hooks/__tests__/testHelpers');
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync(mockUseChartSync));
    
    // Reset mock state
    mockUseChartSync.isAuthenticated = false;
    mockUseChartSync.isSyncing = false;
    mockUseChartSync.syncCharts.mockResolvedValue({ success: true });
  });

  it('should render sync dropdown button', () => {
    render(
      <SyncDropdown
        showDropdown={false}
        setShowDropdown={mockSetShowDropdown}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    expect(screen.getByTestId('sync-dropdown-button')).toBeInTheDocument();
    expect(screen.getByText('同期')).toBeInTheDocument();
  });

  it('should show dropdown when showDropdown is true', () => {
    render(
      <SyncDropdown
        showDropdown={true}
        setShowDropdown={mockSetShowDropdown}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    expect(screen.getByTestId('sync-execute-button')).toBeInTheDocument();
    expect(screen.getByTestId('sync-settings-button')).toBeInTheDocument();
  });

  it('should not show dropdown when showDropdown is false', () => {
    render(
      <SyncDropdown
        showDropdown={false}
        setShowDropdown={mockSetShowDropdown}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    expect(screen.queryByTestId('sync-execute-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sync-settings-button')).not.toBeInTheDocument();
  });

  it('should toggle dropdown when button is clicked', () => {
    render(
      <SyncDropdown
        showDropdown={false}
        setShowDropdown={mockSetShowDropdown}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    fireEvent.click(screen.getByTestId('sync-dropdown-button'));
    expect(mockSetShowDropdown).toHaveBeenCalledWith(true);
  });

  it('should disable sync button when not authenticated', () => {
    mockUseChartSync.isAuthenticated = false;

    render(
      <SyncDropdown
        showDropdown={true}
        setShowDropdown={mockSetShowDropdown}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    const syncButton = screen.getByTestId('sync-execute-button');
    expect(syncButton).toBeDisabled();
    expect(syncButton).toHaveClass('text-slate-400', 'cursor-not-allowed');
  });

  it('should enable sync button when authenticated', async () => {
    const { useChartSync } = await import('../../../hooks/useChartSync');
    const { createMockChartSync } = await import('../../../hooks/__tests__/testHelpers');
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync({
      ...mockUseChartSync,
      isAuthenticated: true
    }));

    render(
      <SyncDropdown
        showDropdown={true}
        setShowDropdown={mockSetShowDropdown}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    const syncButton = screen.getByTestId('sync-execute-button');
    expect(syncButton).not.toBeDisabled();
    expect(syncButton).toHaveClass('text-slate-700');
  });

  it('should execute sync when sync button is clicked and authenticated', async () => {
    const { useChartSync } = await import('../../../hooks/useChartSync');
    const { createMockChartSync } = await import('../../../hooks/__tests__/testHelpers');
    const mockSyncCharts = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync({
      ...mockUseChartSync,
      isAuthenticated: true,
      syncCharts: mockSyncCharts
    }));

    render(
      <SyncDropdown
        showDropdown={true}
        setShowDropdown={mockSetShowDropdown}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    fireEvent.click(screen.getByTestId('sync-execute-button'));

    await waitFor(() => {
      expect(mockSyncCharts).toHaveBeenCalled();
    });
    expect(mockSetShowDropdown).toHaveBeenCalledWith(false);
  });

  it('should not execute sync when not authenticated', () => {
    mockUseChartSync.isAuthenticated = false;

    render(
      <SyncDropdown
        showDropdown={true}
        setShowDropdown={mockSetShowDropdown}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    fireEvent.click(screen.getByTestId('sync-execute-button'));

    expect(mockUseChartSync.syncCharts).not.toHaveBeenCalled();
  });

  it('should show "同期中..." when sync is in progress', async () => {
    const { useChartSync } = await import('../../../hooks/useChartSync');
    const { createMockChartSync } = await import('../../../hooks/__tests__/testHelpers');
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync({
      ...mockUseChartSync,
      isSyncing: true
    }));

    render(
      <SyncDropdown
        showDropdown={true}
        setShowDropdown={mockSetShowDropdown}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    expect(screen.getByText('同期中...')).toBeInTheDocument();
    expect(screen.getByTestId('sync-execute-button')).toBeDisabled();
  });

  it('should open settings when settings button is clicked', () => {
    render(
      <SyncDropdown
        showDropdown={true}
        setShowDropdown={mockSetShowDropdown}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    fireEvent.click(screen.getByTestId('sync-settings-button'));

    expect(mockOnOpenSettings).toHaveBeenCalled();
    expect(mockSetShowDropdown).toHaveBeenCalledWith(false);
  });

  it('should show "アカウント連携" when not authenticated', () => {
    mockUseChartSync.isAuthenticated = false;

    render(
      <SyncDropdown
        showDropdown={true}
        setShowDropdown={mockSetShowDropdown}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    expect(screen.getByText('アカウント連携')).toBeInTheDocument();
  });

  it('should show "詳細設定" when authenticated', async () => {
    const { useChartSync } = await import('../../../hooks/useChartSync');
    const { createMockChartSync } = await import('../../../hooks/__tests__/testHelpers');
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync({
      ...mockUseChartSync,
      isAuthenticated: true
    }));

    render(
      <SyncDropdown
        showDropdown={true}
        setShowDropdown={mockSetShowDropdown}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    expect(screen.getByText('詳細設定')).toBeInTheDocument();
  });

  it('should handle sync errors gracefully', async () => {
    const { useChartSync } = await import('../../../hooks/useChartSync');
    const { createMockChartSync } = await import('../../../hooks/__tests__/testHelpers');
    const mockSyncCharts = vi.fn().mockRejectedValue(new Error('Sync failed'));
    vi.mocked(useChartSync).mockReturnValue(createMockChartSync({
      ...mockUseChartSync,
      isAuthenticated: true,
      syncCharts: mockSyncCharts
    }));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SyncDropdown
        showDropdown={true}
        setShowDropdown={mockSetShowDropdown}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    fireEvent.click(screen.getByTestId('sync-execute-button'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Sync failed:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should close dropdown when clicking outside', () => {
    render(
      <SyncDropdown
        showDropdown={true}
        setShowDropdown={mockSetShowDropdown}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    // Simulate clicking outside
    fireEvent.mouseDown(document.body);

    expect(mockSetShowDropdown).toHaveBeenCalledWith(false);
  });
});