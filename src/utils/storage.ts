import localforage from 'localforage';
import type { ChordChart, ChordLibrary } from '../types';
import { migrateChartData } from './chordUtils';

const STORAGE_KEY = 'chord-charts';

// localforage設定
localforage.config({
  name: 'ChordChartApp',
  version: 1.0,
  storeName: 'chord_charts',
  description: 'コード譜アプリのデータストレージ'
});

export const storageService = {
  // すべてのコード譜を保存
  async saveCharts(charts: ChordLibrary): Promise<void> {
    try {
      await localforage.setItem(STORAGE_KEY, charts);
    } catch (error) {
      console.error('Failed to save charts:', error);
      throw new Error('コード譜の保存に失敗しました');
    }
  },

  // すべてのコード譜を読み込み
  async loadCharts(): Promise<ChordLibrary | null> {
    try {
      const charts = await localforage.getItem<ChordLibrary>(STORAGE_KEY);
      if (!charts) return null;
      
      // データ移行処理：既存データのbeatsPerBarを拍子に応じて修正
      const migratedCharts: ChordLibrary = {};
      for (const [id, chart] of Object.entries(charts)) {
        migratedCharts[id] = migrateChartData(chart);
      }
      
      return migratedCharts;
    } catch (error) {
      console.error('Failed to load charts:', error);
      throw new Error('コード譜の読み込みに失敗しました');
    }
  },

  // 単一のコード譜を保存
  async saveChart(chart: ChordChart): Promise<void> {
    try {
      const charts = await this.loadCharts() || {};
      charts[chart.id] = chart;
      await this.saveCharts(charts);
    } catch (error) {
      console.error('Failed to save chart:', error);
      throw new Error('コード譜の保存に失敗しました');
    }
  },

  // 単一のコード譜を削除
  async deleteChart(chartId: string): Promise<void> {
    try {
      const charts = await this.loadCharts() || {};
      delete charts[chartId];
      await this.saveCharts(charts);
    } catch (error) {
      console.error('Failed to delete chart:', error);
      throw new Error('コード譜の削除に失敗しました');
    }
  },

  // 複数のコード譜を一度に削除
  async deleteMultipleCharts(chartIds: string[]): Promise<void> {
    try {
      const charts = await this.loadCharts() || {};
      
      // 複数のIDを一度に削除
      chartIds.forEach(id => {
        delete charts[id];
      });
      
      await this.saveCharts(charts);
    } catch (error) {
      console.error('Failed to delete multiple charts:', error);
      throw new Error('複数コード譜の削除に失敗しました');
    }
  },

  // ストレージをクリア
  async clearStorage(): Promise<void> {
    try {
      await localforage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw new Error('ストレージのクリアに失敗しました');
    }
  },

  // ストレージの使用量を取得（おおよその値）
  async getStorageInfo(): Promise<{ size: number; length: number }> {
    try {
      const charts = await this.loadCharts() || {};
      const chartsJson = JSON.stringify(charts);
      return {
        size: new Blob([chartsJson]).size, // バイト単位
        length: Object.keys(charts).length // コード譜の数
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { size: 0, length: 0 };
    }
  },

  // データの整合性チェック
  async validateCharts(): Promise<boolean> {
    try {
      const charts = await this.loadCharts();
      if (!charts) return true;

      // 基本的な構造チェック
      for (const [id, chart] of Object.entries(charts)) {
        if (!chart.id || !chart.title || !chart.artist || !chart.key) {
          console.warn(`Invalid chart found: ${id}`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to validate charts:', error);
      return false;
    }
  }
};