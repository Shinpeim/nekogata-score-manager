import { vi } from 'vitest';
import type { SyncResult } from '../../types/sync';
import type { SetListLibrary } from '../../types/setList';
import type { ChordLibrary } from '../../types/chord';

interface MockSetListManagement {
  setLists: SetListLibrary;
  currentSetListId: string | null;
  setCurrentSetList: ReturnType<typeof vi.fn>;
  getCurrentSetList: ReturnType<typeof vi.fn>;
  getSetListById: ReturnType<typeof vi.fn>;
  getSetListsArray: ReturnType<typeof vi.fn>;
  hasSetLists: ReturnType<typeof vi.fn>;
  getSetListsCount: ReturnType<typeof vi.fn>;
  isLoading: boolean;
  error: string | null;
  addSetList: ReturnType<typeof vi.fn>;
  updateSetList: ReturnType<typeof vi.fn>;
  updateSetListOrder: ReturnType<typeof vi.fn>;
  deleteSetList: ReturnType<typeof vi.fn>;
  deleteMultipleSetLists: ReturnType<typeof vi.fn>;
  createNewSetList: ReturnType<typeof vi.fn>;
  loadInitialData: ReturnType<typeof vi.fn>;
  loadFromStorage: ReturnType<typeof vi.fn>;
  clearError: ReturnType<typeof vi.fn>;
  applySyncedSetLists: ReturnType<typeof vi.fn>;
  hasDataChanges: ReturnType<typeof vi.fn>;
  subscribeSyncNotification: ReturnType<typeof vi.fn>;
  notifySync: ReturnType<typeof vi.fn>;
}

/**
 * useSetListManagementフックのモック返り値を作成
 */
export const createMockSetListManagement = (overrides: Partial<MockSetListManagement> = {}): MockSetListManagement => ({
  setLists: {},
  currentSetListId: null,
  setCurrentSetList: vi.fn(),
  getCurrentSetList: vi.fn(),
  getSetListById: vi.fn(),
  getSetListsArray: vi.fn(),
  hasSetLists: vi.fn(),
  getSetListsCount: vi.fn(),
  isLoading: false,
  error: null,
  addSetList: vi.fn(),
  updateSetList: vi.fn(),
  updateSetListOrder: vi.fn(),
  deleteSetList: vi.fn(),
  deleteMultipleSetLists: vi.fn(),
  createNewSetList: vi.fn(),
  loadInitialData: vi.fn(),
  loadFromStorage: vi.fn(),
  clearError: vi.fn(),
  applySyncedSetLists: vi.fn(),
  hasDataChanges: vi.fn(),
  subscribeSyncNotification: vi.fn(),
  notifySync: vi.fn(),
  ...overrides
});

interface MockChartSync {
  syncCharts: ReturnType<typeof vi.fn>;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  syncConfig: { autoSync: boolean; showConflictWarning: boolean };
  isAuthenticated: boolean;
  authenticate: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  updateSyncConfig: ReturnType<typeof vi.fn>;
  clearSyncError: ReturnType<typeof vi.fn>;
  charts: ChordLibrary;
  currentChartId: string | null;
  setLists: SetListLibrary;
  currentSetListId: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * useChartSyncフックのモック返り値を作成
 */
export const createMockChartSync = (overrides: Partial<MockChartSync> = {}): MockChartSync => ({
  syncCharts: vi.fn(),
  isSyncing: false,
  lastSyncTime: null,
  syncError: null,
  syncConfig: { autoSync: false, showConflictWarning: true },
  isAuthenticated: false,
  authenticate: vi.fn(),
  signOut: vi.fn(),
  updateSyncConfig: vi.fn(),
  clearSyncError: vi.fn(),
  charts: {},
  currentChartId: null,
  setLists: {},
  currentSetListId: null,
  isLoading: false,
  error: null,
  ...overrides
});

/**
 * SyncResultのモック値を作成
 */
export const createMockSyncResult = (overrides: Partial<SyncResult> = {}): SyncResult => ({
  success: true,
  conflicts: [],
  setListConflicts: [],
  syncedCharts: [],
  syncedSetLists: [],
  errors: [],
  ...overrides
});