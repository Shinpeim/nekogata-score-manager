import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChordChart, ChordLibrary } from '../types';
import { createNewChordChart } from '../utils/chordCreation';
import { storageService } from '../utils/storage';

interface ChordChartState {
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

export const useChordChartStore = create<ChordChartState>()(
  devtools(
    (set, get) => ({
      // 初期状態
      charts: {},
      currentChartId: null,
      isLoading: false,
      error: null,
      syncCallbacks: new Set(),
      
      // アクション
      addChart: async (chart) => {
        try {
          set({ isLoading: true, error: null });
          
          // ストレージに先に保存
          await storageService.saveChart(chart);
          
          // ストレージ保存が成功した場合のみローカル状態を更新
          set((state) => ({
            charts: {
              ...state.charts,
              [chart.id]: chart
            },
            isLoading: false
          }), false, 'addChart');
          
          // 同期コールバックを通知
          get().notifySyncCallbacks();
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'コード譜の追加に失敗しました' 
          });
          throw error;
        }
      },
      
      updateChart: async (id, chartUpdate) => {
        try {
          set({ isLoading: true, error: null });
          
          const state = get();
          const existingChart = state.charts[id];
          if (!existingChart) {
            throw new Error('更新対象のコード譜が見つかりません');
          }
          
          const updatedChart = {
            ...existingChart,
            ...chartUpdate,
            updatedAt: new Date()
          };
          
          // ローカル状態を更新
          set((state) => ({
            charts: {
              ...state.charts,
              [id]: updatedChart
            },
            isLoading: false
          }), false, 'updateChart');
          
          // ストレージに保存
          await storageService.saveChart(updatedChart);
          
          // 同期コールバックを通知
          get().notifySyncCallbacks();
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'コード譜の更新に失敗しました' 
          });
          throw error;
        }
      },
      
      deleteChart: async (id) => {
        try {
          set({ isLoading: true, error: null });
          
          // ローカル状態を更新
          set((state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _removed, ...remainingCharts } = state.charts;
            return {
              charts: remainingCharts,
              currentChartId: state.currentChartId === id ? null : state.currentChartId,
              isLoading: false
            };
          }, false, 'deleteChart');
          
          // ストレージから削除
          await storageService.deleteChart(id);
          
          // 同期コールバックを通知
          get().notifySyncCallbacks();
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'コード譜の削除に失敗しました' 
          });
          throw error;
        }
      },
      
      setCurrentChart: (id) => {
        set({ currentChartId: id }, false, 'setCurrentChart');
      },
      
      loadInitialData: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // まずストレージから読み込みを試行
          const storedCharts = await storageService.loadCharts();
          
          if (storedCharts && Object.keys(storedCharts).length > 0) {
            // ストレージにデータがある場合
            set({
              charts: storedCharts,
              currentChartId: Object.keys(storedCharts)[0] || null,
              isLoading: false
            }, false, 'loadFromStorage');
          } else {
            // ストレージが空の場合、空の状態で開始
            const initialCharts: ChordLibrary = {};
            
            set({
              charts: initialCharts,
              currentChartId: null,
              isLoading: false
            }, false, 'loadInitialData');
            
            // 空のデータをストレージに保存
            await storageService.saveCharts(initialCharts);
          }
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
          
          const storedCharts = await storageService.loadCharts();
          
          if (storedCharts) {
            set({
              charts: storedCharts,
              currentChartId: Object.keys(storedCharts)[0] || null,
              isLoading: false
            }, false, 'loadFromStorage');
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'ストレージからの読み込みに失敗しました' 
          });
          throw error;
        }
      },

      createNewChart: async (chartData) => {
        try {
          set({ isLoading: true, error: null });
          
          const newChart = createNewChordChart(chartData);
          
          // ローカル状態を更新
          set((state) => ({
            charts: {
              ...state.charts,
              [newChart.id]: newChart
            },
            currentChartId: newChart.id,
            isLoading: false
          }), false, 'createNewChart');
          
          // ストレージに保存
          await storageService.saveChart(newChart);
          
          // 同期コールバックを通知
          get().notifySyncCallbacks();
          
          return newChart;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '新しいコード譜の作成に失敗しました' 
          });
          throw error;
        }
      },

      deleteMultipleCharts: async (ids) => {
        try {
          set({ isLoading: true, error: null });
          
          // ローカル状態を更新
          set((state) => {
            const remainingCharts = { ...state.charts };
            ids.forEach(id => {
              delete remainingCharts[id];
            });
            
            // 現在選択中のチャートが削除対象に含まれている場合、選択を解除
            const newCurrentChartId = ids.includes(state.currentChartId || '') 
              ? (Object.keys(remainingCharts)[0] || null)
              : state.currentChartId;
            
            return {
              charts: remainingCharts,
              currentChartId: newCurrentChartId,
              isLoading: false
            };
          }, false, 'deleteMultipleCharts');
          
          // ストレージから削除（競合を避けるため一度に削除）
          await storageService.deleteMultipleCharts(ids);
          
          // 同期コールバックを通知
          get().notifySyncCallbacks();
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '複数コード譜の削除に失敗しました' 
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null }, false, 'clearError');
      },

      // 同期メソッド
      applySyncedCharts: async (mergedCharts) => {
        try {
          set({ isLoading: true, error: null });
          
          // チャート配列をライブラリ形式に変換
          const chartsLibrary: ChordLibrary = {};
          mergedCharts.forEach(chart => {
            chartsLibrary[chart.id] = chart;
          });
          
          // 現在選択中のチャートが削除されていないかチェック
          const { currentChartId } = get();
          const newCurrentChartId = currentChartId && chartsLibrary[currentChartId] 
            ? currentChartId 
            : (Object.keys(chartsLibrary)[0] || null);
          
          // ローカル状態を更新
          set({
            charts: chartsLibrary,
            currentChartId: newCurrentChartId,
            isLoading: false
          }, false, 'applySyncedCharts');
          
          // ストレージに保存
          await storageService.saveCharts(chartsLibrary);
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '同期データの適用に失敗しました' 
          });
          throw error;
        }
      },

      subscribeSyncNotification: (callback) => {
        const { syncCallbacks } = get();
        syncCallbacks.add(callback);
        
        // アンサブスクライブ関数を返す
        return () => {
          syncCallbacks.delete(callback);
        };
      },

      notifySyncCallbacks: () => {
        const { charts, syncCallbacks } = get();
        const chartArray = Object.values(charts);
        syncCallbacks.forEach(callback => {
          try {
            callback(chartArray);
          } catch (error) {
            console.error('同期コールバック実行エラー:', error);
          }
        });
      }
    }),
    {
      name: 'chord-chart-store'
    }
  )
);