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
  updateChartsIfChanged: (charts: ChordLibrary) => void;
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
      
      updateChartsIfChanged: (charts) => {
        const currentCharts = get().charts;
        
        // チャートの数が異なる場合は更新
        const currentIds = Object.keys(currentCharts).sort();
        const newIds = Object.keys(charts).sort();
        
        if (currentIds.length !== newIds.length || !currentIds.every((id, index) => id === newIds[index])) {
          set({ charts }, false, 'updateChartsIfChanged');
          return;
        }
        
        // 各チャートの内容を比較
        let hasChanges = false;
        for (const id of currentIds) {
          const currentChart = currentCharts[id];
          const newChart = charts[id];
          
          // 基本プロパティの比較（updatedAtは除外）
          if (
            currentChart.title !== newChart.title ||
            currentChart.artist !== newChart.artist ||
            currentChart.key !== newChart.key ||
            currentChart.tempo !== newChart.tempo ||
            currentChart.timeSignature !== newChart.timeSignature ||
            currentChart.notes !== newChart.notes ||
            currentChart.version !== newChart.version ||
            currentChart.fontSize !== newChart.fontSize
          ) {
            hasChanges = true;
            break;
          }
          
          // セクションの比較
          if (currentChart.sections.length !== newChart.sections.length) {
            hasChanges = true;
            break;
          }
          
          // 各セクションの詳細比較
          for (let i = 0; i < currentChart.sections.length; i++) {
            const currentSection = currentChart.sections[i];
            const newSection = newChart.sections[i];
            
            if (
              currentSection.id !== newSection.id ||
              currentSection.name !== newSection.name ||
              currentSection.beatsPerBar !== newSection.beatsPerBar ||
              currentSection.barsCount !== newSection.barsCount
            ) {
              hasChanges = true;
              break;
            }
            
            // コードの比較
            if (currentSection.chords.length !== newSection.chords.length) {
              hasChanges = true;
              break;
            }
            
            for (let j = 0; j < currentSection.chords.length; j++) {
              const currentChord = currentSection.chords[j];
              const newChord = newSection.chords[j];
              
              if (
                currentChord.name !== newChord.name ||
                currentChord.root !== newChord.root ||
                currentChord.base !== newChord.base ||
                currentChord.duration !== newChord.duration ||
                currentChord.isLineBreak !== newChord.isLineBreak ||
                currentChord.memo !== newChord.memo
              ) {
                hasChanges = true;
                break;
              }
            }
            
            if (hasChanges) break;
          }
          
          if (hasChanges) break;
        }
        
        // 変更がある場合のみ更新
        if (hasChanges) {
          set({ charts }, false, 'updateChartsIfChanged');
        }
      },
      
      setCurrentChart: (id) => {
        // 現在のIDと同じ場合は更新をスキップ
        if (get().currentChartId === id) {
          return;
        }
        
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