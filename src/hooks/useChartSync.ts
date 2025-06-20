import { useEffect, useCallback } from 'react';
import { useChartManagement } from './useChartManagement';
import { useSyncStore } from '../stores/syncStore';
import type { SyncConflict } from '../types/sync';
import { logger } from '../utils/logger';

export const useChartSync = () => {
  const chordChartStore = useChartManagement();
  const syncStore = useSyncStore();

  // 初期化処理
  useEffect(() => {
    // E2Eテスト環境の検出（sessionStorageベース）
    const isE2ETest = sessionStorage.getItem('__playwright_test__') === 'true';
    
    if (isE2ETest) {
      return;
    }
    
    const initializeIfNeeded = async () => {
      const state = useSyncStore.getState();
      if (!state.syncManager) {
        logger.debug('[SYNC] Initializing sync store...');
        try {
          await state.initializeSync();
        } catch (error) {
          console.error('[SYNC] Failed to initialize sync:', error);
        }
      }
    };
    
    initializeIfNeeded();
  }, []);

  // 手動同期実行
  const syncCharts = useCallback(async (
    onConflict?: (conflicts: SyncConflict[]) => Promise<'overwrite' | 'cancel'>
  ) => {
    logger.debug(`[SYNC] useChartSync.syncCharts called`);
    try {
      // 現在のチャートデータを取得
      const charts = Object.values(chordChartStore.charts);
      logger.debug(`[SYNC] useChartSync got ${charts.length} local charts for sync`);
      
      // 同期実行
      logger.debug(`[SYNC] useChartSync calling syncStore.sync...`);
      const result = await syncStore.sync(charts, onConflict);
      logger.debug(`[SYNC] useChartSync received result from syncStore.sync`);
      
      // 成功時にマージ済みデータを適用
      logger.info(`[SYNC] Manual sync result:`, { success: result.success, hasCharts: !!result.mergedCharts, chartCount: result.mergedCharts?.length });
      if (result.success && result.mergedCharts) {
        logger.debug(`[SYNC] useChartSync calling applySyncedCharts with ${result.mergedCharts.length} charts`);
        await chordChartStore.applySyncedCharts(result.mergedCharts);
        logger.debug(`[SYNC] useChartSync applySyncedCharts completed`);
      } else {
        logger.warn(`[SYNC] Manual sync - not applying charts:`, { success: result.success, mergedCharts: result.mergedCharts });
      }
      
      logger.debug(`[SYNC] useChartSync.syncCharts returning result`);
      return result;
    } catch (error) {
      logger.error('useChartSync.syncCharts caught error:', error);
      logger.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }, [chordChartStore, syncStore]);

  // 自動同期の設定
  useEffect(() => {
    const isAutoSyncEnabled = syncStore.syncConfig.autoSync;
    const isAuthenticated = syncStore.isAuthenticated;
    
    if (!isAutoSyncEnabled || !isAuthenticated) {
      return;
    }

    // チャート変更の監視
    const unsubscribe = chordChartStore.subscribeSyncNotification(async (updatedCharts) => {
      try {
        // 同期中でない場合のみ自動同期を実行
        if (!syncStore.isSyncing) {
          logger.debug(`Auto sync triggered with ${updatedCharts.length} charts`);
          const result = await syncStore.sync(updatedCharts);
          
          // 成功時にマージ済みデータを適用
          if (result.success && result.mergedCharts) {
            logger.debug(`Auto sync applying ${result.mergedCharts.length} charts`);
            await chordChartStore.applySyncedCharts(result.mergedCharts);
            logger.debug('Auto sync applySyncedCharts completed');
          } else {
            logger.debug('Auto sync - not applying charts:', { success: result.success, mergedCharts: result.mergedCharts });
          }
        }
      } catch (error) {
        logger.error('自動同期エラー:', error);
        // 自動同期のエラーは静かに失敗させる（UX考慮）
      }
    });

    return unsubscribe;
  }, [
    syncStore.syncConfig.autoSync, 
    syncStore.isSyncing,
    chordChartStore,
    syncStore
  ]);


  return {
    // 同期関連
    syncCharts,
    isSyncing: syncStore.isSyncing,
    lastSyncTime: syncStore.lastSyncTime,
    syncError: syncStore.syncError,
    syncConfig: syncStore.syncConfig,
    
    // 認証関連
    isAuthenticated: syncStore.isAuthenticated,
    authenticate: syncStore.authenticate,
    signOut: syncStore.signOut,
    
    // 設定関連
    updateSyncConfig: syncStore.updateSyncConfig,
    clearSyncError: syncStore.clearSyncError,
    
    // チャート関連（便利のため）
    charts: chordChartStore.charts,
    currentChartId: chordChartStore.currentChartId,
    isLoading: chordChartStore.isLoading || syncStore.isSyncing,
    error: chordChartStore.error || syncStore.syncError
  };
};