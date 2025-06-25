import { useEffect, useCallback } from 'react';
import { useChartManagement } from './useChartManagement';
import { useSetListManagement } from './useSetListManagement';
import { useSyncStore } from '../stores/syncStore';
import type { SyncConflict, SetListSyncConflict } from '../types/sync';
import { logger } from '../utils/logger';

export const useChartSync = () => {
  const chordChartStore = useChartManagement();
  const setListStore = useSetListManagement();
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
    onConflict?: (conflicts: SyncConflict[], setListConflicts: SetListSyncConflict[]) => Promise<'overwrite' | 'cancel'>
  ) => {
    logger.debug(`[SYNC] useChartSync.syncCharts called`);
    try {
      // 現在のチャートデータとセットリストデータを取得
      const charts = Object.values(chordChartStore.charts);
      const setLists = Object.values(setListStore.setLists);
      logger.debug(`[SYNC] useChartSync got ${charts.length} local charts and ${setLists.length} local setlists for sync`);
      
      // 同期実行
      logger.debug(`[SYNC] useChartSync calling syncStore.sync...`);
      const result = await syncStore.sync(charts, setLists, onConflict);
      logger.debug(`[SYNC] useChartSync received result from syncStore.sync`);
      
      // 成功時にマージ済みデータを適用
      logger.info(`[SYNC] Manual sync result:`, { 
        success: result.success, 
        hasCharts: !!result.mergedCharts, 
        chartCount: result.mergedCharts?.length,
        hasSetLists: !!result.mergedSetLists,
        setListCount: result.mergedSetLists?.length
      });
      
      if (result.success) {
        if (result.mergedCharts) {
          logger.debug(`[SYNC] useChartSync calling applySyncedCharts with ${result.mergedCharts.length} charts`);
          await chordChartStore.applySyncedCharts(result.mergedCharts);
          logger.debug(`[SYNC] useChartSync applySyncedCharts completed`);
        }
        
        if (result.mergedSetLists) {
          logger.debug(`[SYNC] useChartSync calling applySyncedSetLists with ${result.mergedSetLists.length} setlists`);
          await setListStore.applySyncedSetLists(result.mergedSetLists);
          logger.debug(`[SYNC] useChartSync applySyncedSetLists completed`);
        }
      } else {
        logger.warn(`[SYNC] Manual sync - not applying data:`, { 
          success: result.success, 
          mergedCharts: result.mergedCharts,
          mergedSetLists: result.mergedSetLists 
        });
      }
      
      logger.debug(`[SYNC] useChartSync.syncCharts returning result`);
      return result;
    } catch (error) {
      logger.error('useChartSync.syncCharts caught error:', error);
      logger.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }, [chordChartStore, setListStore, syncStore]);

  // 自動同期の設定
  useEffect(() => {
    const isAutoSyncEnabled = syncStore.syncConfig.autoSync;
    const isAuthenticated = syncStore.isAuthenticated;
    
    if (!isAutoSyncEnabled || !isAuthenticated) {
      return;
    }

    // チャート変更の監視
    const unsubscribeChart = chordChartStore.subscribeSyncNotification(async (updatedCharts) => {
      try {
        // 同期中でない場合のみ自動同期を実行
        if (!syncStore.isSyncing) {
          logger.debug(`Auto sync triggered with ${updatedCharts.length} charts`);
          const setLists = Object.values(setListStore.setLists);
          const result = await syncStore.sync(updatedCharts, setLists);
          
          // 成功時にマージ済みデータを適用
          if (result.success) {
            if (result.mergedCharts) {
              logger.debug(`Auto sync applying ${result.mergedCharts.length} charts`);
              await chordChartStore.applySyncedCharts(result.mergedCharts);
              logger.debug('Auto sync applySyncedCharts completed');
            }
            
            if (result.mergedSetLists) {
              logger.debug(`Auto sync applying ${result.mergedSetLists.length} setlists`);
              await setListStore.applySyncedSetLists(result.mergedSetLists);
              logger.debug('Auto sync applySyncedSetLists completed');
            }
          } else {
            logger.debug('Auto sync - not applying data:', { 
              success: result.success, 
              mergedCharts: result.mergedCharts,
              mergedSetLists: result.mergedSetLists
            });
          }
        }
      } catch (error) {
        logger.error('自動同期エラー:', error);
        // 自動同期のエラーは静かに失敗させる（UX考慮）
      }
    });

    // セットリスト変更の監視
    const unsubscribeSetList = setListStore.subscribeSyncNotification(async (updatedSetLists) => {
      try {
        if (!syncStore.isSyncing) {
          logger.debug(`Auto sync triggered with ${updatedSetLists.length} setlists`);
          const charts = Object.values(chordChartStore.charts);
          const result = await syncStore.sync(charts, updatedSetLists);
          
          if (result.success) {
            if (result.mergedCharts) {
              logger.debug(`Auto sync applying ${result.mergedCharts.length} charts`);
              await chordChartStore.applySyncedCharts(result.mergedCharts);
            }
            
            if (result.mergedSetLists) {
              logger.debug(`Auto sync applying ${result.mergedSetLists.length} setlists`);
              await setListStore.applySyncedSetLists(result.mergedSetLists);
            }
          }
        }
      } catch (error) {
        logger.error('自動同期エラー（セットリスト）:', error);
      }
    });

    return () => {
      unsubscribeChart();
      unsubscribeSetList();
    };
  }, [
    syncStore.syncConfig.autoSync, 
    syncStore.isSyncing,
    chordChartStore,
    setListStore,
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
    
    // セットリスト関連（便利のため）
    setLists: setListStore.setLists,
    currentSetListId: setListStore.currentSetListId,
    
    // 統合されたローディング状態とエラー
    isLoading: chordChartStore.isLoading || setListStore.isLoading || syncStore.isSyncing,
    error: chordChartStore.error || setListStore.error || syncStore.syncError
  };
};