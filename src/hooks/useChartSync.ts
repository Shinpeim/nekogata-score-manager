import { useEffect, useCallback } from 'react';
import { useChordChartStore } from './useChartManagement';
import { useSyncStore } from '../stores/syncStore';
import type { SyncConflict } from '../types/sync';

export const useChartSync = () => {
  const chordChartStore = useChordChartStore();
  const syncStore = useSyncStore();

  // 手動同期実行
  const syncCharts = useCallback(async (
    onConflict?: (conflicts: SyncConflict[]) => Promise<'overwrite' | 'cancel'>
  ) => {
    try {
      // 現在のチャートデータを取得
      const charts = Object.values(chordChartStore.charts);
      
      // 同期実行
      const result = await syncStore.sync(charts, onConflict);
      
      // 成功時にマージ済みデータを適用
      if (result.success && result.mergedCharts) {
        await chordChartStore.applySyncedCharts(result.mergedCharts);
      }
      
      return result;
    } catch (error) {
      console.error('チャート同期エラー:', error);
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
          await syncStore.sync(updatedCharts);
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
          const result = await syncStore.sync(charts);
          
          if (result.success && result.mergedCharts) {
            await chordChartStore.applySyncedCharts(result.mergedCharts);
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