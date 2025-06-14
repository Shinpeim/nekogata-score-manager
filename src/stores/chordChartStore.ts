import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChordChart, ChordLibrary } from '../types';
import { createNewChordChart } from '../utils/chordUtils';
import { storageService } from '../utils/storage';

interface ChordChartState {
  // データ
  charts: ChordLibrary;
  currentChartId: string | null;
  isLoading: boolean;
  error: string | null;
    
  // アクション
  addChart: (chart: ChordChart) => Promise<void>;
  updateChart: (id: string, chart: Partial<ChordChart>) => Promise<void>;
  deleteChart: (id: string) => Promise<void>;
  setCurrentChart: (id: string | null) => void;
  loadInitialData: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  createNewChart: (chartData: Partial<ChordChart>) => Promise<ChordChart>;
  clearError: () => void;
}

export const useChordChartStore = create<ChordChartState>()(
  devtools(
    (set, get) => ({
      // 初期状態
      charts: {},
      currentChartId: null,
      isLoading: false,
      error: null,
      
      // アクション
      addChart: async (chart) => {
        try {
          set({ isLoading: true, error: null });
          
          // ローカル状態を更新
          set((state) => ({
            charts: {
              ...state.charts,
              [chart.id]: chart
            },
            isLoading: false
          }), false, 'addChart');
          
          // ストレージに保存
          await storageService.saveChart(chart);
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
          
          return newChart;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '新しいコード譜の作成に失敗しました' 
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null }, false, 'clearError');
      }
    }),
    {
      name: 'chord-chart-store'
    }
  )
);