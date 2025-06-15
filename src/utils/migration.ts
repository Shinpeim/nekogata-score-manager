import type { ChordLibrary } from '../types';
import { migrateChartData } from './chartMigration';

/**
 * データを現在のバージョンに移行する
 * Chart単位でversion管理するため、ChordLibrary全体のversion管理は削除
 * 
 * @param rawData - ローカルストレージから取得した生データ
 * @returns 移行されたコード譜データ
 */
export const migrateData = (rawData: unknown): ChordLibrary => {
  // 生データがない場合は空のライブラリを返す
  if (!rawData) return {};
  
  if (typeof rawData !== 'object' || rawData === null) {
    return {};
  }
  
  const obj = rawData as Record<string, unknown>;
  
  // 旧バージョン情報付きChordLibraryデータの場合
  if ('version' in obj && 'data' in obj && typeof obj.data === 'object') {
    return migrateChordLibraryData((obj.data as ChordLibrary) || {});
  }
  
  // エクスポートデータ形式の場合（charts配列がある）
  if ('charts' in obj && Array.isArray(obj.charts)) {
    // エクスポートデータは別途処理される
    return {};
  }
  
  // ChordLibrary形式の場合
  return migrateChordLibraryData((rawData as ChordLibrary) || {});
};

/**
 * ChordLibrary内の各Chartを個別に移行
 */
const migrateChordLibraryData = (data: ChordLibrary): ChordLibrary => {
  const migratedData: ChordLibrary = {};
  
  for (const [id, chart] of Object.entries(data)) {
    // 各ChartをmigrateChartDataで個別に移行
    migratedData[id] = migrateChartData(chart);
  }
  
  return migratedData;
};

/**
 * 移行統計を取得する
 * 
 * @param migratedData - 移行後のデータ
 * @returns 移行統計
 */
export const getMigrationStats = (
  migratedData: ChordLibrary
): {
  totalCharts: number;
  chartsWithVersion: number;
  chartsWithoutVersion: number;
} => {
  const charts = Object.values(migratedData);
  const chartsWithVersion = charts.filter(chart => chart.version).length;
  
  return {
    totalCharts: charts.length,
    chartsWithVersion,
    chartsWithoutVersion: charts.length - chartsWithVersion
  };
};