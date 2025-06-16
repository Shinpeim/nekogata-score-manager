import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChordChart } from '../types';
import { chartCrudService } from '../services/chartCrudService';
import { syncNotificationService } from '../services/syncNotificationService';
import { useChartDataStore } from './chartDataStore';

interface ChartCrudState {
  // 状態
  isLoading: boolean;
  error: string | null;
  
  // CRUD操作
  addChart: (chart: ChordChart) => Promise<void>;
  updateChart: (id: string, chartUpdate: Partial<ChordChart>) => Promise<void>;
  deleteChart: (id: string) => Promise<void>;
  deleteMultipleCharts: (ids: string[]) => Promise<void>;
  createNewChart: (chartData: Partial<ChordChart>) => Promise<ChordChart>;
  
  // ストレージ操作
  loadInitialData: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  applySyncedCharts: (mergedCharts: ChordChart[]) => Promise<void>;
  
  // 同期メソッド（簡素化）
  subscribeSyncNotification: (callback: (charts: ChordChart[]) => void) => () => void;
  notifySyncCallbacks: () => void;
  
  // ユーティリティ
  clearError: () => void;
}

export const useChartCrudStore = create<ChartCrudState>()(
  devtools(
    (set, get) => ({
      // 初期状態
      isLoading: false,
      error: null,
      
      // CRUD操作
      addChart: async (chart: ChordChart) => {
        try {
          set({ isLoading: true, error: null });
          
          // CRUDサービスでストレージに保存
          await chartCrudService.createChart(chart);
          
          // データストアを更新
          useChartDataStore.getState().addChartToData(chart);
          
          // 同期通知
          get().notifySyncCallbacks();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'コード譜の追加に失敗しました' 
          });
          throw error;
        }
      },
      
      updateChart: async (id: string, chartUpdate: Partial<ChordChart>) => {
        try {
          set({ isLoading: true, error: null });
          
          const dataStore = useChartDataStore.getState();
          const existingChart = dataStore.getChartById(id);
          
          if (!existingChart) {
            throw new Error('更新対象のコード譜が見つかりません');
          }
          
          // CRUDサービスで更新
          const updatedChart = await chartCrudService.updateChart(existingChart, chartUpdate);
          
          // データストアを更新
          dataStore.updateChartInData(id, updatedChart);
          
          // 同期通知
          get().notifySyncCallbacks();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'コード譜の更新に失敗しました' 
          });
          throw error;
        }
      },
      
      deleteChart: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // CRUDサービスで削除
          await chartCrudService.deleteChart(id);
          
          // データストアから削除
          useChartDataStore.getState().removeChartFromData(id);
          
          // 同期通知
          get().notifySyncCallbacks();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'コード譜の削除に失敗しました' 
          });
          throw error;
        }
      },
      
      deleteMultipleCharts: async (ids: string[]) => {
        try {
          set({ isLoading: true, error: null });
          
          // CRUDサービスで削除
          await chartCrudService.deleteMultipleCharts(ids);
          
          // データストアから削除
          useChartDataStore.getState().removeMultipleChartsFromData(ids);
          
          // 同期通知
          get().notifySyncCallbacks();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '複数コード譜の削除に失敗しました' 
          });
          throw error;
        }
      },
      
      createNewChart: async (chartData: Partial<ChordChart>) => {
        try {
          set({ isLoading: true, error: null });
          
          // CRUDサービスで新規作成
          const newChart = await chartCrudService.createChart(chartData);
          const dataStore = useChartDataStore.getState();
          
          // データストアを更新
          dataStore.addChartToData(newChart);
          dataStore.setCurrentChart(newChart.id);
          
          // 同期通知
          get().notifySyncCallbacks();
          
          set({ isLoading: false });
          return newChart;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '新しいコード譜の作成に失敗しました' 
          });
          throw error;
        }
      },
      
      // ストレージ操作
      loadInitialData: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const dataStore = useChartDataStore.getState();
          
          // CRUDサービスで初期データ読み込み
          const initialCharts = await chartCrudService.loadInitialData();
          
          dataStore.setCharts(initialCharts);
          dataStore.setCurrentChart(Object.keys(initialCharts)[0] || null);
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'データの読み込みに失敗しました' 
          });
          throw error;
        }
      },
      
      loadFromStorage: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const dataStore = useChartDataStore.getState();
          
          // CRUDサービスで再読み込み
          const storedCharts = await chartCrudService.reloadFromStorage();
          
          dataStore.setCharts(storedCharts);
          dataStore.setCurrentChart(Object.keys(storedCharts)[0] || null);
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'ストレージからの読み込みに失敗しました' 
          });
          throw error;
        }
      },
      
      applySyncedCharts: async (mergedCharts: ChordChart[]) => {
        try {
          set({ isLoading: true, error: null });
          
          const dataStore = useChartDataStore.getState();
          
          // CRUDサービスで同期データ適用
          const chartsLibrary = await chartCrudService.applySyncedCharts(mergedCharts);
          
          // 現在選択中のチャートが削除されていないかチェック
          const { currentChartId } = dataStore;
          const newCurrentChartId = currentChartId && chartsLibrary[currentChartId] 
            ? currentChartId 
            : (Object.keys(chartsLibrary)[0] || null);
          
          // データストアを更新
          dataStore.setCharts(chartsLibrary);
          dataStore.setCurrentChart(newCurrentChartId);
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '同期データの適用に失敗しました' 
          });
          throw error;
        }
      },
      
      // 同期メソッド（サービスに委譲）
      subscribeSyncNotification: (callback) => {
        return syncNotificationService.subscribe(callback);
      },
      
      notifySyncCallbacks: () => {
        const dataStore = useChartDataStore.getState();
        const chartArray = dataStore.getChartsArray();
        syncNotificationService.notify(chartArray);
      },
      
      // ユーティリティ
      clearError: () => {
        set({ error: null }, false, 'clearError');
      }
    }),
    {
      name: 'chart-crud-store'
    }
  )
);