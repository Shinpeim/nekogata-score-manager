import { useChartDataStore } from '../stores/chartDataStore';
import { useChartCrudStore } from '../stores/chartCrudStore';
import type { ChordChart, ChordLibrary } from '../types';

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
    applySyncedCharts: crudStore.applySyncedCharts,
    subscribeSyncNotification: crudStore.subscribeSyncNotification,
    notifySyncCallbacks: crudStore.notifySyncCallbacks,
    syncCallbacks: crudStore.syncCallbacks
  };
};


// 型定義も互換性のために提供
export interface ChordChartState {
  // データ
  charts: ChordLibrary;
  currentChartId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // 同期関連
  syncCallbacks: Set<(charts: ChordChart[]) => void>;
    
  // アクション
  addChart: (chart: ChordChart) => Promise<void>;
  updateChart: (id: string, chart: Partial<ChordChart>) => Promise<void>;
  deleteChart: (id: string) => Promise<void>;
  deleteMultipleCharts: (ids: string[]) => Promise<void>;
  setCurrentChart: (id: string | null) => void;
  loadInitialData: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  createNewChart: (chartData: Partial<ChordChart>) => Promise<ChordChart>;
  clearError: () => void;
  
  // 同期メソッド
  applySyncedCharts: (mergedCharts: ChordChart[]) => Promise<void>;
  subscribeSyncNotification: (callback: (charts: ChordChart[]) => void) => () => void;
  notifySyncCallbacks: () => void;
}

// 分離されたストアを個別に使用したい場合のエクスポート
export { useChartDataStore, useChartCrudStore };