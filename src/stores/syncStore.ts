import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChordChart } from '../types';
import type { SyncResult, SyncConflict, SyncConfig } from '../types/sync';
import { SyncManager } from '../utils/sync/syncManager';
import { logger } from '../utils/logger';

interface SyncState {
  // 同期状態
  syncManager: SyncManager | null;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  syncConfig: SyncConfig;
  
  // 同期アクション
  initializeSync: () => Promise<void>;
  authenticate: () => Promise<void>;
  signOut: () => Promise<void>;
  sync: (charts: ChordChart[], onConflict?: (conflicts: SyncConflict[]) => Promise<'overwrite' | 'cancel'>) => Promise<SyncResult>;
  updateSyncConfig: (config: Partial<SyncConfig>) => void;
  clearSyncError: () => void;
  isAuthenticated: () => boolean;
}

export const useSyncStore = create<SyncState>()(
  devtools(
    (set, get) => ({
      // 同期初期状態
      syncManager: null,
      isSyncing: false,
      lastSyncTime: null,
      syncError: null,
      syncConfig: {
        autoSync: false,
        syncInterval: 5,
        conflictResolution: 'remote',
        showConflictWarning: true
      },

      // 同期アクション実装
      initializeSync: async () => {
        try {
          const syncManager = SyncManager.getInstance();
          await syncManager.initialize();
          const config = syncManager.getConfig();
          const lastSyncTime = syncManager.getLastSyncTimeAsDate();
          
          set({ 
            syncManager, 
            syncConfig: config,
            lastSyncTime: lastSyncTime.getTime() === 0 ? null : lastSyncTime
          }, false, 'initializeSync');
        } catch (error) {
          set({ 
            syncError: error instanceof Error ? error.message : '同期機能の初期化に失敗しました' 
          }, false, 'initializeSyncError');
        }
      },

      authenticate: async () => {
        try {
          const { syncManager } = get();
          if (!syncManager) {
            throw new Error('同期機能が初期化されていません');
          }
          
          set({ syncError: null }, false, 'authenticateStart');
          await syncManager.authenticate();
        } catch (error) {
          set({ 
            syncError: error instanceof Error ? error.message : '認証に失敗しました' 
          }, false, 'authenticateError');
          throw error;
        }
      },

      signOut: async () => {
        try {
          const { syncManager } = get();
          if (!syncManager) return;
          
          await syncManager.signOut();
          set({ syncError: null }, false, 'signOut');
        } catch (error) {
          set({ 
            syncError: error instanceof Error ? error.message : 'サインアウトに失敗しました' 
          }, false, 'signOutError');
          throw error;
        }
      },

      sync: async (charts, onConflict) => {
        try {
          logger.debug(`SyncStore.sync called with ${charts.length} charts`);
          const { syncManager } = get();
          if (!syncManager) {
            throw new Error('同期機能が初期化されていません');
          }
          
          set({ isSyncing: true, syncError: null }, false, 'syncStart');
          
          const result = await syncManager.sync(charts, onConflict);
          logger.debug(`SyncStore.sync got result:`, { success: result.success, hasCharts: !!result.mergedCharts, chartCount: result.mergedCharts?.length });
          
          if (result.success) {
            const lastSyncTime = syncManager.getLastSyncTimeAsDate();
            set({ 
              isSyncing: false, 
              lastSyncTime 
            }, false, 'syncSuccess');
          } else {
            set({ 
              isSyncing: false,
              syncError: result.errors.length > 0 ? result.errors[0].error.message : '同期に失敗しました'
            }, false, 'syncFailed');
          }
          
          logger.debug(`SyncStore.sync returning result`);
          return result;
        } catch (error) {
          logger.error(`SyncStore.sync caught error:`, error);
          set({ 
            isSyncing: false,
            syncError: error instanceof Error ? error.message : '同期に失敗しました' 
          }, false, 'syncError');
          throw error;
        }
      },

      updateSyncConfig: (configUpdate) => {
        const { syncManager, syncConfig } = get();
        const newConfig = { ...syncConfig, ...configUpdate };
        
        if (syncManager) {
          syncManager.saveConfig(newConfig);
        }
        
        set({ syncConfig: newConfig }, false, 'updateSyncConfig');
      },

      clearSyncError: () => {
        set({ syncError: null }, false, 'clearSyncError');
      },

      isAuthenticated: () => {
        const { syncManager } = get();
        return syncManager ? syncManager.isAuthenticated() : false;
      }
    }),
    {
      name: 'sync-store'
    }
  )
);