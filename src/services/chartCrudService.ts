import type { ChordChart } from '../types';
import { createNewChordChart } from '../utils/chordCreation';
import { storageService } from '../utils/storage';

/**
 * チャートCRUD操作サービス
 * 純粋な操作ロジックのみを提供し、状態管理には関与しない
 */
class ChartCrudService {
  /**
   * 新しいチャートを作成
   */
  async createChart(chartData: Partial<ChordChart>): Promise<ChordChart> {
    const newChart = createNewChordChart(chartData);
    await storageService.saveChart(newChart);
    return newChart;
  }

  /**
   * チャートを更新
   */
  async updateChart(existingChart: ChordChart, updates: Partial<ChordChart>): Promise<ChordChart> {
    const updatedChart = {
      ...existingChart,
      ...updates,
      updatedAt: new Date()
    };
    
    await storageService.saveChart(updatedChart);
    return updatedChart;
  }

  /**
   * チャートを削除
   */
  async deleteChart(id: string): Promise<void> {
    await storageService.deleteChart(id);
  }

  /**
   * 複数のチャートを削除
   */
  async deleteMultipleCharts(ids: string[]): Promise<void> {
    await storageService.deleteMultipleCharts(ids);
  }

  /**
   * 初期データを読み込み
   */
  async loadInitialData(): Promise<Record<string, ChordChart>> {
    const storedCharts = await storageService.loadCharts();
    
    if (storedCharts && Object.keys(storedCharts).length > 0) {
      return storedCharts;
    } else {
      // 空のデータをストレージに保存
      const initialCharts = {};
      await storageService.saveCharts(initialCharts);
      return initialCharts;
    }
  }

  /**
   * ストレージからデータを再読み込み
   */
  async reloadFromStorage(): Promise<Record<string, ChordChart>> {
    const storedCharts = await storageService.loadCharts();
    return storedCharts || {};
  }

  /**
   * 同期されたチャートをストレージに保存
   */
  async applySyncedCharts(charts: ChordChart[]): Promise<Record<string, ChordChart>> {
    const chartsLibrary: Record<string, ChordChart> = {};
    charts.forEach(chart => {
      chartsLibrary[chart.id] = chart;
    });
    
    await storageService.saveCharts(chartsLibrary);
    return chartsLibrary;
  }
}

// シングルトンインスタンスをエクスポート
export const chartCrudService = new ChartCrudService();