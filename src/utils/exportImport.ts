import type { ChordChart, ChordLibrary, ChordSection } from '../types';
import { migrateData, getDataVersion, previewMigration } from './migration';

// エクスポート・インポート用のデータフォーマット
export interface ExportData {
  version: string;
  exportDate: string;
  charts: ChordChart[];
}

export interface ImportResult {
  success: boolean;
  charts: ChordChart[];
  errors: string[];
  warnings: string[];
  migrationInfo?: {
    originalVersion: number;
    currentVersion: number;
    migrationPerformed: boolean;
    migrationSteps: string[];
  };
}

// アプリケーションのバージョン情報
const EXPORT_VERSION = '1.0.0';

/**
 * 単一のコード譜をJSONファイルとしてエクスポート
 */
export const exportSingleChart = (chart: ChordChart): void => {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    charts: [chart]
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFileName(chart.title)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * 複数のコード譜をJSONファイルとしてエクスポート
 */
export const exportMultipleCharts = (charts: ChordChart[], filename?: string): void => {
  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    charts
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `chord-charts-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * 全ライブラリをエクスポート
 */
export const exportAllCharts = (library: ChordLibrary): void => {
  const charts = Object.values(library);
  exportMultipleCharts(charts, 'all-chord-charts.json');
};

/**
 * JSONファイルからコード譜をインポート
 */
export const importChartsFromFile = (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const result = parseImportData(jsonString);
        resolve(result);
      } catch (error) {
        resolve({
          success: false,
          charts: [],
          errors: [`ファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`],
          warnings: []
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        charts: [],
        errors: ['ファイルの読み込みに失敗しました'],
        warnings: []
      });
    };
    
    reader.readAsText(file);
  });
};

/**
 * JSON文字列をパースしてコード譜データを抽出（マイグレーション対応）
 */
export const parseImportData = (jsonString: string): ImportResult => {
  const warnings: string[] = [];

  try {
    const rawData = JSON.parse(jsonString);
    
    // マイグレーション情報を取得
    const originalVersion = getDataVersion(rawData);
    const migrationPreview = previewMigration(rawData);
    
    // データの種類を判定してマイグレーションを適用
    let processedData: unknown;
    let migrationInfo: ImportResult['migrationInfo'];
    
    if (migrationPreview.needsMigration) {
      // ストレージデータ形式（ChordLibrary）の場合、マイグレーションを適用
      if (isChordLibraryFormat(rawData)) {
        const migratedLibrary = migrateData(rawData);
        processedData = {
          version: EXPORT_VERSION,
          exportDate: new Date().toISOString(),
          charts: Object.values(migratedLibrary)
        };
        
        migrationInfo = {
          originalVersion,
          currentVersion: migrationPreview.targetVersion,
          migrationPerformed: true,
          migrationSteps: migrationPreview.migrationSteps
        };
        
        warnings.push(`データをバージョン${originalVersion}から${migrationPreview.targetVersion}に移行しました`);
      } else if (isValidExportData(rawData)) {
        // エクスポートデータ形式だが古いバージョンの場合
        const tempLibrary: ChordLibrary = {};
        rawData.charts.forEach((chart, index) => {
          tempLibrary[`temp-${index}`] = chart;
        });
        
        const migratedLibrary = migrateData(tempLibrary);
        processedData = {
          ...rawData,
          charts: Object.values(migratedLibrary)
        };
        
        migrationInfo = {
          originalVersion,
          currentVersion: migrationPreview.targetVersion,
          migrationPerformed: true,
          migrationSteps: migrationPreview.migrationSteps
        };
        
        warnings.push(`エクスポートデータをバージョン${originalVersion}から${migrationPreview.targetVersion}に移行しました`);
      } else if (Array.isArray(rawData)) {
        // ChordChart配列形式の場合
        const tempLibrary: ChordLibrary = {};
        rawData.forEach((chart, index) => {
          tempLibrary[`temp-${index}`] = chart;
        });
        
        const migratedLibrary = migrateData(tempLibrary);
        processedData = Object.values(migratedLibrary);
        
        migrationInfo = {
          originalVersion,
          currentVersion: migrationPreview.targetVersion,
          migrationPerformed: true,
          migrationSteps: migrationPreview.migrationSteps
        };
        
        warnings.push(`データをバージョン${originalVersion}から${migrationPreview.targetVersion}に移行しました`);
      } else {
        processedData = rawData;
      }
    } else {
      processedData = rawData;
    }
    
    // 通常の検証処理
    return processImportData(processedData, warnings, migrationInfo);

  } catch (error) {
    return {
      success: false,
      charts: [],
      errors: [`JSONの解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`],
      warnings: []
    };
  }
};

/**
 * 処理済みデータからImportResultを生成
 */
const processImportData = (
  data: unknown, 
  existingWarnings: string[] = [], 
  migrationInfo?: ImportResult['migrationInfo']
): ImportResult => {
  const warnings = [...existingWarnings];
  
  // データフォーマットの検証
  if (!isValidExportData(data)) {
    // 直接ChordChartの配列かどうかチェック
    if (Array.isArray(data)) {
      // ChordChart配列として処理
      const validationResult = validateChartArray(data);
      return {
        success: validationResult.charts.length > 0,
        charts: validationResult.charts,
        errors: validationResult.errors,
        warnings: ['旧形式のデータです。新形式に変換しました。', ...warnings, ...validationResult.warnings],
        migrationInfo
      };
    }
    
    // 単一のChordChartオブジェクトかどうかチェック
    if (data && typeof data === 'object' && 'id' in data && 'title' in data) {
      const validationResult = validateSingleChart(data);
      if (validationResult.isValid) {
        return {
          success: true,
          charts: [validationResult.chart!],
          errors: [],
          warnings: ['単一のコード譜ファイルです。', ...warnings],
          migrationInfo
        };
      }
    }
    
    return {
      success: false,
      charts: [],
      errors: ['無効なデータフォーマットです'],
      warnings,
      migrationInfo
    };
  }

  // バージョンチェック
  if (data.version && data.version !== EXPORT_VERSION) {
    warnings.push(`異なるバージョンのデータです (${data.version} -> ${EXPORT_VERSION})`);
  }

  // 各コード譜の検証
  const validationResult = validateChartArray(data.charts || []);
  
  return {
    success: validationResult.charts.length > 0,
    charts: validationResult.charts,
    errors: validationResult.errors,
    warnings: [...warnings, ...validationResult.warnings],
    migrationInfo
  };
};

/**
 * エクスポートデータの形式チェック
 */
const isValidExportData = (data: unknown): data is ExportData => {
  return Boolean(data && 
         typeof data === 'object' && 
         typeof (data as Record<string, unknown>).version === 'string' && 
         Array.isArray((data as Record<string, unknown>).charts));
};

/**
 * ChordLibrary形式（ストレージデータ）かどうかをチェック
 */
const isChordLibraryFormat = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  const obj = data as Record<string, unknown>;
  
  // バージョン情報付きChordLibraryの場合
  if (obj.version && obj.data && typeof obj.data === 'object') {
    return isChordLibraryObject(obj.data);
  }
  
  // 直接ChordLibraryの場合
  return isChordLibraryObject(obj);
};

/**
 * オブジェクトがChordLibrary形式かどうかをチェック
 */
const isChordLibraryObject = (obj: unknown): boolean => {
  if (!obj || typeof obj !== 'object') return false;
  
  const library = obj as Record<string, unknown>;
  
  // 空のオブジェクトは有効
  if (Object.keys(library).length === 0) return true;
  
  // 各値がChordChartらしいオブジェクトかチェック
  return Object.values(library).every(chart => 
    chart && 
    typeof chart === 'object' && 
    'id' in chart && typeof chart.id === 'string' &&
    'title' in chart && typeof chart.title === 'string' &&
    'key' in chart && typeof chart.key === 'string'
  );
};

/**
 * ChordChart配列の検証
 */
const validateChartArray = (charts: unknown[]): { charts: ChordChart[]; errors: string[]; warnings: string[] } => {
  const validCharts: ChordChart[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  charts.forEach((chart, index) => {
    const result = validateSingleChart(chart);
    if (result.isValid && result.chart) {
      validCharts.push(result.chart);
      if (result.warnings.length > 0) {
        warnings.push(`コード譜 ${index + 1}: ${result.warnings.join(', ')}`);
      }
    } else {
      errors.push(`コード譜 ${index + 1}: ${result.errors.join(', ')}`);
    }
  });

  return { charts: validCharts, errors, warnings };
};

/**
 * 単一のChordChartの検証と修正
 */
const validateSingleChart = (chart: unknown): { 
  isValid: boolean; 
  chart?: ChordChart; 
  errors: string[]; 
  warnings: string[] 
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 型ガード
  if (!chart || typeof chart !== 'object') {
    return { isValid: false, errors: ['無効なオブジェクトです'], warnings };
  }

  const chartObj = chart as Record<string, unknown>;

  // 必須フィールドのチェック
  if (!chartObj.id) errors.push('IDが不正です');
  if (!chartObj.title) errors.push('タイトルが不正です');
  if (!chartObj.key) errors.push('キーが不正です');
  if (!chartObj.timeSignature) errors.push('拍子が不正です');
  if (!Array.isArray(chartObj.sections)) errors.push('セクションが不正です');

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // 日付フィールドの修正
  const now = new Date();
  let createdAt = now;
  let updatedAt = now;

  if (chartObj.createdAt) {
    const parsed = new Date(chartObj.createdAt as string);
    if (!isNaN(parsed.getTime())) {
      createdAt = parsed;
    } else {
      warnings.push('作成日時が不正なため現在時刻に設定しました');
    }
  }

  if (chartObj.updatedAt) {
    const parsed = new Date(chartObj.updatedAt as string);
    if (!isNaN(parsed.getTime())) {
      updatedAt = parsed;
    } else {
      warnings.push('更新日時が不正なため現在時刻に設定しました');
    }
  }

  // セクションの検証と修正
  const validSections = (chartObj.sections as unknown[]).map((section: unknown, index: number) => {
    const sectionWarnings: string[] = [];
    const sectionObj = section as Record<string, unknown>;
    
    if (!sectionObj.id) {
      sectionObj.id = `imported-section-${index}-${Date.now()}`;
      sectionWarnings.push(`セクション${index + 1}にIDを自動生成しました`);
    }
    
    const timeSignatureBeats = parseInt((chartObj.timeSignature as string).split('/')[0]) || 4;
    if (!sectionObj.beatsPerBar || (timeSignatureBeats !== 4 && sectionObj.beatsPerBar === 4)) {
      sectionObj.beatsPerBar = timeSignatureBeats;
      sectionWarnings.push(`セクション${index + 1}の拍数を拍子から設定しました`);
    }
    
    if (!sectionObj.barsCount) {
      sectionObj.barsCount = 4;
      sectionWarnings.push(`セクション${index + 1}の小節数をデフォルト値に設定しました`);
    }
    
    if (!Array.isArray(sectionObj.chords)) {
      sectionObj.chords = [];
      sectionWarnings.push(`セクション${index + 1}のコード配列を初期化しました`);
    }

    if (sectionWarnings.length > 0) {
      warnings.push(...sectionWarnings);
    }

    return sectionObj;
  });

  const validatedChart: ChordChart = {
    id: chartObj.id as string,
    title: chartObj.title as string,
    artist: chartObj.artist as string,
    key: chartObj.key as string,
    tempo: chartObj.tempo as number,
    timeSignature: chartObj.timeSignature as string,
    createdAt,
    updatedAt,
    sections: validSections as unknown as ChordSection[],
    tags: Array.isArray(chartObj.tags) ? chartObj.tags as string[] : [],
    notes: typeof chartObj.notes === 'string' ? chartObj.notes : ''
  };

  return { isValid: true, chart: validatedChart, errors: [], warnings };
};

/**
 * ファイル名をサニタイズ
 */
const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[<>:"/\\|?*]/g, '') // 不正な文字を削除
    .replace(/\s+/g, '_') // スペースをアンダースコアに
    .substring(0, 100); // 長さ制限
};