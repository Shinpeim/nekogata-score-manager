import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChordChart, ChordLibrary } from '../types';
import { storageService } from '../utils/storage';

interface ChartDataState {
  // データ
  charts: ChordLibrary;
  currentChartId: string | null;
  
  // アクション
  setCharts: (charts: ChordLibrary) => void;
  setCurrentChart: (id: string | null) => void;
  addChartToData: (chart: ChordChart) => void;
  updateChartInData: (id: string, chart: ChordChart) => void;
  removeChartFromData: (id: string) => void;
  removeMultipleChartsFromData: (ids: string[]) => void;
  
  // ユーティリティ
  getCurrentChart: () => ChordChart | null;
  getChartById: (id: string) => ChordChart | null;
  getChartsArray: () => ChordChart[];
  hasCharts: () => boolean;
  getChartsCount: () => number;
}

export const useChartDataStore = create<ChartDataState>()(
  devtools(
    (set, get) => ({
      // 初期状態
      charts: {},
      currentChartId: null,
      
      // アクション
      setCharts: (charts) => {
        set({ charts }, false, 'setCharts');
      },
      
      setCurrentChart: (id) => {
        set({ currentChartId: id }, false, 'setCurrentChart');
        // 最後に開いたチャートIDを保存
        storageService.saveLastOpenedChartId(id).catch(console.error);
      },
      
      addChartToData: (chart) => {
        set((state) => ({
          charts: {
            ...state.charts,
            [chart.id]: chart
          }
        }), false, 'addChartToData');
      },
      
      updateChartInData: (id, chart) => {
        set((state) => ({
          charts: {
            ...state.charts,
            [id]: chart
          }
        }), false, 'updateChartInData');
      },
      
      removeChartFromData: (id) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _removed, ...remainingCharts } = state.charts;
          
          // 削除されたチャートが現在選択中の場合、選択を解除
          const newCurrentChartId = state.currentChartId === id 
            ? (Object.keys(remainingCharts)[0] || null)
            : state.currentChartId;
          
          return {
            charts: remainingCharts,
            currentChartId: newCurrentChartId
          };
        }, false, 'removeChartFromData');
      },
      
      removeMultipleChartsFromData: (ids) => {
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
            currentChartId: newCurrentChartId
          };
        }, false, 'removeMultipleChartsFromData');
      },
      
      // ユーティリティ
      getCurrentChart: () => {
        const { charts, currentChartId } = get();
        return currentChartId ? charts[currentChartId] || null : null;
      },
      
      getChartById: (id) => {
        const { charts } = get();
        return charts[id] || null;
      },
      
      getChartsArray: () => {
        const { charts } = get();
        return Object.values(charts);
      },
      
      hasCharts: () => {
        const { charts } = get();
        return Object.keys(charts).length > 0;
      },
      
      getChartsCount: () => {
        const { charts } = get();
        return Object.keys(charts).length;
      }
    }),
    {
      name: 'chart-data-store'
    }
  )
);