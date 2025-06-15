import type { ChordChart } from '../types';

// ============================================================================
// 型定義
// ============================================================================

export interface ExportData {
  version: string;
  exportDate: string;
  charts: ChordChart[];
}

// ============================================================================
// 定数
// ============================================================================

const EXPORT_VERSION = '1.0.0';

// ファイル名・MIME型
const JSON_MIME_TYPE = 'application/json';
const CHORD_CHARTS_PREFIX = 'chord-charts';

// ============================================================================
// エクスポート機能
// ============================================================================

/**
 * コード譜をJSONファイルとしてエクスポート
 */
export const exportMultipleCharts = (charts: ChordChart[], filename?: string): void => {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    charts
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: JSON_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${CHORD_CHARTS_PREFIX}-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
};


// ============================================================================
// ユーティリティ関数
// ============================================================================

/**
 * ファイル名をサニタイズ
 */
const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
};