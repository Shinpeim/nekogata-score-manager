import { useEffect, useCallback } from 'react';
import { useChartManagement } from './useChartManagement';
import { useSyncStore } from '../stores/syncStore';
import type { SyncConflict } from '../types/sync';

export const useChartSync = () => {
  const chordChartStore = useChartManagement();
  const syncStore = useSyncStore();

  // 初期化処理
  useEffect(() => {
    // E2Eテスト環境の検出を強化
    const hasE2EParam = window.location.search.includes('e2e=true');
    const hasPlaywrightFlag = (window as typeof window & { __playwright_test__?: boolean }).__playwright_test__;
    const isLocalhost = window.location.hostname === 'localhost' && window.location.port === '5173';
    const isE2ETest = hasE2EParam || (isLocalhost && hasPlaywrightFlag);
    
    console.log('[SYNC] Environment check:', { 
      hasE2EParam, 
      hasPlaywrightFlag, 
      isLocalhost, 
      isE2ETest,
      url: window.location.href 
    });
    
    if (isE2ETest) {
      console.log('[SYNC] E2E test environment detected, skipping sync initialization');
      return;
    }
    
    const initializeIfNeeded = async () => {
      const state = useSyncStore.getState();
      if (!state.syncManager) {
        console.log('[SYNC] Initializing sync store...');
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
    console.log(`[SYNC] useChartSync.syncCharts called`);
    try {
      // 現在のチャートデータを取得
      const charts = Object.values(chordChartStore.charts);
      console.log(`[SYNC] useChartSync got ${charts.length} local charts for sync`);
      
      // 同期実行
      console.log(`[SYNC] useChartSync calling syncStore.sync...`);
      const result = await syncStore.sync(charts, onConflict);
      console.log(`[SYNC] useChartSync received result from syncStore.sync`);
      
      // 成功時にマージ済みデータを適用
      console.log(`[SYNC] Manual sync result:`, { success: result.success, hasCharts: !!result.mergedCharts, chartCount: result.mergedCharts?.length });
      if (result.success && result.mergedCharts) {
        console.log(`[SYNC] useChartSync calling applySyncedCharts with ${result.mergedCharts.length} charts`);
        await chordChartStore.applySyncedCharts(result.mergedCharts);
        console.log(`[SYNC] useChartSync applySyncedCharts completed`);
      } else {
        console.log(`[SYNC] Manual sync - not applying charts:`, { success: result.success, mergedCharts: result.mergedCharts });
      }
      
      console.log(`[SYNC] useChartSync.syncCharts returning result`);
      return result;
    } catch (error) {
      console.error('[SYNC] useChartSync.syncCharts caught error:', error);
      console.error('[SYNC] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }, [chordChartStore, syncStore]);

  // 自動同期の設定
  useEffect(() => {
    const isAutoSyncEnabled = syncStore.syncConfig.autoSync;
    const isAuthenticated = syncStore.isAuthenticated();
    
    if (!isAutoSyncEnabled || !isAuthenticated) {
      return;
    }

    // チャート変更の監視
    const unsubscribe = chordChartStore.subscribeSyncNotification(async (updatedCharts) => {
      try {
        // 同期中でない場合のみ自動同期を実行
        if (!syncStore.isSyncing) {
          console.log(`[SYNC] Auto sync triggered with ${updatedCharts.length} charts`);
          const result = await syncStore.sync(updatedCharts);
          
          // 成功時にマージ済みデータを適用
          if (result.success && result.mergedCharts) {
            console.log(`[SYNC] Auto sync applying ${result.mergedCharts.length} charts`);
            await chordChartStore.applySyncedCharts(result.mergedCharts);
            console.log(`[SYNC] Auto sync applySyncedCharts completed`);
          } else {
            console.log(`[SYNC] Auto sync - not applying charts:`, { success: result.success, mergedCharts: result.mergedCharts });
          }
        }
      } catch (error) {
        console.error('自動同期エラー:', error);
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

  // 定期同期タイマー
  useEffect(() => {
    const isAutoSyncEnabled = syncStore.syncConfig.autoSync;
    const isAuthenticated = syncStore.isAuthenticated();
    
    if (!isAutoSyncEnabled || !isAuthenticated) {
      return;
    }

    const intervalMs = syncStore.syncConfig.syncInterval * 60 * 1000;
    const interval = setInterval(async () => {
      try {
        if (!syncStore.isSyncing) {
          const charts = Object.values(chordChartStore.charts);
          console.log(`[SYNC] Periodic sync triggered with ${charts.length} charts`);
          const result = await syncStore.sync(charts);
          
          if (result.success && result.mergedCharts) {
            console.log(`[SYNC] Periodic sync applying ${result.mergedCharts.length} charts`);
            await chordChartStore.applySyncedCharts(result.mergedCharts);
            console.log(`[SYNC] Periodic sync applySyncedCharts completed`);
          } else {
            console.log(`[SYNC] Periodic sync - not applying charts:`, { success: result.success, mergedCharts: result.mergedCharts });
          }
        }
      } catch (error) {
        console.error('定期同期エラー:', error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [
    syncStore.syncConfig.autoSync,
    syncStore.syncConfig.syncInterval,
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
    isAuthenticated: syncStore.isAuthenticated(),
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