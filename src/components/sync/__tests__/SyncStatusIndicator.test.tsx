import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SyncStatusIndicator } from '../SyncStatusIndicator';

vi.mock('../../../stores/syncStore');

const mockUseSyncStore = {
  isSyncing: false,
  lastSyncTime: null as Date | null,
  syncError: null as string | null,
  isAuthenticated: false,
};

describe('SyncStatusIndicator', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { useSyncStore } = await import('../../../stores/syncStore');
    vi.mocked(useSyncStore).mockReturnValue(mockUseSyncStore);
    
    // Reset mock state
    mockUseSyncStore.isAuthenticated = false;
    mockUseSyncStore.isSyncing = false;
    mockUseSyncStore.lastSyncTime = null;
    mockUseSyncStore.syncError = null;
  });

  it('should not render when not authenticated', () => {
    mockUseSyncStore.isAuthenticated = false;

    const { container } = render(<SyncStatusIndicator />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should show syncing status when syncing', () => {
    mockUseSyncStore.isAuthenticated = true;
    mockUseSyncStore.isSyncing = true;

    render(<SyncStatusIndicator />);
    
    expect(screen.getByText('同期中...')).toBeInTheDocument();
  });

  it('should show error status when there is an error', () => {
    mockUseSyncStore.isAuthenticated = true;
    mockUseSyncStore.syncError = 'Sync failed';

    render(<SyncStatusIndicator />);
    
    expect(screen.getByText('同期エラー')).toBeInTheDocument();
  });

  it('should show error detail when error button is clicked', () => {
    mockUseSyncStore.isAuthenticated = true;
    mockUseSyncStore.syncError = 'Network error occurred';

    render(<SyncStatusIndicator />);
    
    const errorButton = screen.getByText('同期エラー');
    fireEvent.click(errorButton);
    
    expect(screen.getByText('Network error occurred')).toBeInTheDocument();
  });

  it('should hide error detail when clicking outside', () => {
    mockUseSyncStore.isAuthenticated = true;
    mockUseSyncStore.syncError = 'Network error occurred';

    render(<SyncStatusIndicator />);
    
    // Show error detail
    const errorButton = screen.getByText('同期エラー');
    fireEvent.click(errorButton);
    expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    
    // Click outside to hide
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Network error occurred')).not.toBeInTheDocument();
  });

  it('should show last sync time when idle', () => {
    mockUseSyncStore.isAuthenticated = true;
    mockUseSyncStore.lastSyncTime = new Date('2024-01-01T12:00:00Z');

    render(<SyncStatusIndicator />);
    
    // Should show some sync time text (multiple elements due to responsive display)
    expect(screen.getAllByText(/日前|時間前|分前|たった今|未同期/).length).toBeGreaterThan(0);
  });

  it('should show "未同期" when lastSyncTime is null', () => {
    mockUseSyncStore.isAuthenticated = true;
    mockUseSyncStore.lastSyncTime = null;

    render(<SyncStatusIndicator />);
    
    expect(screen.getByText('未同期')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    mockUseSyncStore.isAuthenticated = true;
    
    const { container } = render(<SyncStatusIndicator className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});