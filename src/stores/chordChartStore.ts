import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChordChart, ChordLibrary } from '../types';
import { sampleCharts } from '../data/sampleCharts';
import { createNewChordChart } from '../utils/chordUtils';

interface ChordChartState {
  // データ
  charts: ChordLibrary;
  currentChartId: string | null;
    
  // アクション
  addChart: (chart: ChordChart) => void;
  updateChart: (id: string, chart: Partial<ChordChart>) => void;
  deleteChart: (id: string) => void;
  setCurrentChart: (id: string | null) => void;
  loadInitialData: () => void;
  createNewChart: (chartData: Partial<ChordChart>) => ChordChart;
}

export const useChordChartStore = create<ChordChartState>()(
  devtools(
    (set) => ({
      // 初期状態
      charts: {},
      currentChartId: null,
      
      // アクション
      addChart: (chart) => {
        set((state) => ({
          charts: {
            ...state.charts,
            [chart.id]: chart
          }
        }), false, 'addChart');
      },
      
      updateChart: (id, chartUpdate) => {
        set((state) => {
          const existingChart = state.charts[id];
          if (!existingChart) return state;
          
          const updatedChart = {
            ...existingChart,
            ...chartUpdate,
            updatedAt: new Date()
          };
          
          return {
            charts: {
              ...state.charts,
              [id]: updatedChart
            }
          };
        }, false, 'updateChart');
      },
      
      deleteChart: (id) => {
        set((state) => {
          const { [id]: removed, ...remainingCharts } = state.charts;
          return {
            charts: remainingCharts,
            currentChartId: state.currentChartId === id ? null : state.currentChartId
          };
        }, false, 'deleteChart');
      },
      
      setCurrentChart: (id) => {
        set({ currentChartId: id }, false, 'setCurrentChart');
      },
      
      loadInitialData: () => {
        const initialCharts: ChordLibrary = {};
        sampleCharts.forEach(chart => {
          initialCharts[chart.id] = chart;
        });
        
        set({
          charts: initialCharts,
          currentChartId: sampleCharts[0]?.id || null
        }, false, 'loadInitialData');
      },

      createNewChart: (chartData) => {
        const newChart = createNewChordChart(chartData);
        
        set((state) => ({
          charts: {
            ...state.charts,
            [newChart.id]: newChart
          },
          currentChartId: newChart.id
        }), false, 'createNewChart');
        
        return newChart;
      }
    }),
    {
      name: 'chord-chart-store'
    }
  )
);