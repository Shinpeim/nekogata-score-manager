import localforage from 'localforage';
import type { ChordChart, ChordLibrary } from '../types';
import { migrateData, getMigrationStats } from './migration';

const STORAGE_KEY = 'chord-charts';
const LAST_OPENED_CHART_KEY = 'last-opened-chart-id';

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

  // すべてのコード譜を読み込み（自動マイグレーション付き）
  async loadCharts(): Promise<ChordLibrary | null> {
    try {
      const rawData = await localforage.getItem<ChordLibrary>(STORAGE_KEY);
      if (!rawData) return null;
      
      // データ移行処理を実行
      const migratedCharts = migrateData(rawData);
      
      // 移行が実行された場合は、最新形式で保存し直す
      if (JSON.stringify(rawData) !== JSON.stringify(migratedCharts)) {
        console.log('データ移行が実行されました。最新形式で保存します。');
        await this.saveCharts(migratedCharts);
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

  // 複数のコード譜をインポート（既存データに追加）
  async importCharts(charts: ChordChart[]): Promise<void> {
    try {
      const existingCharts = await this.loadCharts() || {};
      
      // 新しいチャートを既存データに追加
      charts.forEach(chart => {
        existingCharts[chart.id] = chart;
      });
      
      await this.saveCharts(existingCharts);
    } catch (error) {
      console.error('Failed to import charts:', error);
      throw new Error('コード譜のインポートに失敗しました');
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
        if (!chart.id || !chart.title || !chart.key) {
          console.warn(`Invalid chart found: ${id}`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to validate charts:', error);
      return false;
    }
  },

  // マイグレーション関連のユーティリティメソッド
  async getMigrationInfo(): Promise<{
    totalCharts: number;
    chartsWithVersion: number;
    chartsWithoutVersion: number;
  }> {
    try {
      const charts = await this.loadCharts();
      if (!charts) {
        return {
          totalCharts: 0,
          chartsWithVersion: 0,
          chartsWithoutVersion: 0
        };
      }

      return getMigrationStats(charts);
    } catch (error) {
      console.error('Failed to get migration info:', error);
      throw new Error('マイグレーション情報の取得に失敗しました');
    }
  },

  // 最後に開いたチャートIDを保存
  async saveLastOpenedChartId(chartId: string | null): Promise<void> {
    try {
      if (chartId) {
        await localforage.setItem(LAST_OPENED_CHART_KEY, chartId);
      } else {
        await localforage.removeItem(LAST_OPENED_CHART_KEY);
      }
    } catch (error) {
      console.error('Failed to save last opened chart ID:', error);
    }
  },

  // 最後に開いたチャートIDを読み込み
  async loadLastOpenedChartId(): Promise<string | null> {
    try {
      return await localforage.getItem<string>(LAST_OPENED_CHART_KEY);
    } catch (error) {
      console.error('Failed to load last opened chart ID:', error);
      return null;
    }
  }
};