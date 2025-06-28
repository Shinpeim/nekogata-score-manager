import { useChartDataStore } from '../stores/chartDataStore';
import { useChartCrudStore } from '../stores/chartCrudStore';
import type { ChordChart } from '../types';
import { logger } from '../utils/logger';

/**
 * チャート管理の統合フック
 * 
 * 既存のuseChordChartStoreインターフェースとの互換性を保ちながら、
 * 分離されたストアを統合して提供する
 */
export const useChartManagement = () => {
  const dataStore = useChartDataStore();
  const crudStore = useChartCrudStore();

  return {
    // データ関連（dataStore）
    charts: dataStore.charts,
    currentChartId: dataStore.currentChartId,
    setCurrentChart: dataStore.setCurrentChart,
    getCurrentChart: dataStore.getCurrentChart,
    getChartById: dataStore.getChartById,
    getChartsArray: dataStore.getChartsArray,
    hasCharts: dataStore.hasCharts,
    getChartsCount: dataStore.getChartsCount,
    
    // CRUD操作関連（crudStore）
    isLoading: crudStore.isLoading,
    error: crudStore.error,
    addChart: crudStore.addChart,
    updateChart: crudStore.updateChart,
    deleteChart: crudStore.deleteChart,
    deleteMultipleCharts: crudStore.deleteMultipleCharts,
    createNewChart: crudStore.createNewChart,
    loadInitialData: crudStore.loadInitialData,
    loadFromStorage: crudStore.loadFromStorage,
    clearError: crudStore.clearError,
    
    // 同期関連（crudStore）
    applySyncedCharts: async (mergedCharts: ChordChart[]) => {
      logger.debug(`useChartManagement.applySyncedCharts called with ${mergedCharts.length} charts`);
      try {
        const result = await crudStore.applySyncedCharts(mergedCharts);
        logger.debug(`useChartManagement.applySyncedCharts completed successfully`);
        return result;
      } catch (error) {
        logger.error(`useChartManagement.applySyncedCharts failed:`, error);
        throw error;
      }
    },
    hasDataChanges: crudStore.hasDataChanges,
    subscribeSyncNotification: crudStore.subscribeSyncNotification,
    notifySyncCallbacks: crudStore.notifySyncCallbacks,
    // syncCallbacks は内部実装のため削除
  };
};



