import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChordChart } from '../types';
import { createNewChordChart } from '../utils/chordCreation';
import { storageService } from '../utils/storage';
import { useChartDataStore } from './chartDataStore';

interface ChartCrudState {
  // 状態
  isLoading: boolean;
  error: string | null;
  
  // 同期関連
  syncCallbacks: Set<(charts: ChordChart[]) => void>;
  
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
  
  // 同期メソッド
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
      syncCallbacks: new Set(),
      
      // CRUD操作
      addChart: async (chart: ChordChart) => {
        try {
          set({ isLoading: true, error: null });
          
          // ストレージに先に保存
          await storageService.saveChart(chart);
          
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
          
          const updatedChart = {
            ...existingChart,
            ...chartUpdate,
            updatedAt: new Date()
          };
          
          // データストアを更新
          dataStore.updateChartInData(id, updatedChart);
          
          // ストレージに保存
          await storageService.saveChart(updatedChart);
          
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
          
          // データストアから削除
          useChartDataStore.getState().removeChartFromData(id);
          
          // ストレージから削除
          await storageService.deleteChart(id);
          
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
          
          // データストアから削除
          useChartDataStore.getState().removeMultipleChartsFromData(ids);
          
          // ストレージから削除
          await storageService.deleteMultipleCharts(ids);
          
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
          
          const newChart = createNewChordChart(chartData);
          const dataStore = useChartDataStore.getState();
          
          // データストアを更新
          dataStore.addChartToData(newChart);
          dataStore.setCurrentChart(newChart.id);
          
          // ストレージに保存
          await storageService.saveChart(newChart);
          
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
          
          // ストレージから読み込みを試行
          const storedCharts = await storageService.loadCharts();
          
          if (storedCharts && Object.keys(storedCharts).length > 0) {
            // ストレージにデータがある場合
            dataStore.setCharts(storedCharts);
            dataStore.setCurrentChart(Object.keys(storedCharts)[0] || null);
          } else {
            // ストレージが空の場合、空の状態で開始
            const initialCharts = {};
            dataStore.setCharts(initialCharts);
            dataStore.setCurrentChart(null);
            
            // 空のデータをストレージに保存
            await storageService.saveCharts(initialCharts);
          }
          
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
          const storedCharts = await storageService.loadCharts();
          
          if (storedCharts) {
            dataStore.setCharts(storedCharts);
            dataStore.setCurrentChart(Object.keys(storedCharts)[0] || null);
          }
          
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
          
          // チャート配列をライブラリ形式に変換
          const chartsLibrary: Record<string, ChordChart> = {};
          mergedCharts.forEach(chart => {
            chartsLibrary[chart.id] = chart;
          });
          
          // 現在選択中のチャートが削除されていないかチェック
          const { currentChartId } = dataStore;
          const newCurrentChartId = currentChartId && chartsLibrary[currentChartId] 
            ? currentChartId 
            : (Object.keys(chartsLibrary)[0] || null);
          
          // データストアを更新
          dataStore.setCharts(chartsLibrary);
          dataStore.setCurrentChart(newCurrentChartId);
          
          // ストレージに保存
          await storageService.saveCharts(chartsLibrary);
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '同期データの適用に失敗しました' 
          });
          throw error;
        }
      },
      
      // 同期メソッド
      subscribeSyncNotification: (callback) => {
        const { syncCallbacks } = get();
        syncCallbacks.add(callback);
        
        // アンサブスクライブ関数を返す
        return () => {
          syncCallbacks.delete(callback);
        };
      },
      
      notifySyncCallbacks: () => {
        const { syncCallbacks } = get();
        const dataStore = useChartDataStore.getState();
        const chartArray = dataStore.getChartsArray();
        
        syncCallbacks.forEach(callback => {
          try {
            callback(chartArray);
          } catch (error) {
            console.error('同期コールバック実行エラー:', error);
          }
        });
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