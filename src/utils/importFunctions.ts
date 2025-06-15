import type { ChordChart, ChordLibrary, ChordSection } from '../types';
import type { ExportData } from './export';
import { migrateData, getDataVersion, previewMigration } from './migration';

// ============================================================================
// 型定義
// ============================================================================

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

// ============================================================================
// 定数
// ============================================================================
const EXPORT_VERSION = '1.0.0';


// エラーメッセージ
const ERROR_MESSAGES = {
  FILE_READ_FAILED: 'ファイルの読み込みに失敗しました',
  FILE_READ_ERROR: 'ファイルの読み込みでエラーが発生しました',
  JSON_PARSE_FAILED: 'JSONの解析に失敗しました',
  UNKNOWN_ERROR: '不明なエラー',
  INVALID_DATA_FORMAT: '無効なデータフォーマットです',
  VERSION_DATA_ERROR: 'バージョン情報付きデータの処理でエラーが発生しました'
} as const;

// 警告メッセージ
const WARNING_MESSAGES = {
  OLD_FORMAT_CONVERTED: '旧形式のデータです。新形式に変換しました。',
  SINGLE_CHART_FILE: '単一のコード譜ファイルです。',
  DIFFERENT_VERSION: (oldVer: string, newVer: string) => `異なるバージョンのデータです (${oldVer} -> ${newVer})`
} as const;


// ============================================================================
// インポート機能
// ============================================================================

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
          errors: [`${ERROR_MESSAGES.FILE_READ_FAILED}: ${error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR}`],
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
      // マイグレーション不要でも、データ形式の正規化は必要
      if (isChordLibraryFormat(rawData)) {
        // バージョン情報付きChordLibraryをエクスポート形式に変換
        let chartLibrary: ChordLibrary;
        if (typeof rawData === 'object' && rawData !== null && 'data' in rawData) {
          chartLibrary = (rawData as { data: ChordLibrary }).data;
        } else {
          chartLibrary = rawData as ChordLibrary;
        }
        
        processedData = {
          version: EXPORT_VERSION,
          exportDate: new Date().toISOString(),
          charts: Object.values(chartLibrary)
        };
        
        migrationInfo = {
          originalVersion,
          currentVersion: originalVersion,
          migrationPerformed: false,
          migrationSteps: []
        };
      } else {
        processedData = rawData;
      }
    }
    
    // 通常の検証処理
    return processImportData(processedData, warnings, migrationInfo);

  } catch (error) {
    return {
      success: false,
      charts: [],
      errors: [`${ERROR_MESSAGES.JSON_PARSE_FAILED}: ${error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR}`],
      warnings: []
    };
  }
};

// ============================================================================
// 内部処理関数
// ============================================================================

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
    // バージョン情報付きChordLibraryデータかどうかチェック（既にマイグレーション済み）
    if (data && typeof data === 'object' && 'version' in data && 'data' in data) {
      // この時点で既にマイグレーション処理は完了しているので、エラーとして扱う
      return {
        success: false,
        charts: [],
        errors: [ERROR_MESSAGES.VERSION_DATA_ERROR],
        warnings,
        migrationInfo
      };
    }
    
    // 直接ChordChartの配列かどうかチェック
    if (Array.isArray(data)) {
      // ChordChart配列として処理
      const validationResult = validateChartArray(data);
      return {
        success: validationResult.charts.length > 0,
        charts: validationResult.charts,
        errors: validationResult.errors,
        warnings: [WARNING_MESSAGES.OLD_FORMAT_CONVERTED, ...warnings, ...validationResult.warnings],
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
          warnings: [WARNING_MESSAGES.SINGLE_CHART_FILE, ...warnings],
          migrationInfo
        };
      }
    }
    
    return {
      success: false,
      charts: [],
      errors: [ERROR_MESSAGES.INVALID_DATA_FORMAT],
      warnings,
      migrationInfo
    };
  }

  // バージョンチェック
  if (data.version && data.version !== EXPORT_VERSION) {
    warnings.push(WARNING_MESSAGES.DIFFERENT_VERSION(data.version, EXPORT_VERSION));
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

// ============================================================================
// データ検証関数
// ============================================================================

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

  // 必須フィールドのチェック（型定義に合わせて修正）
  if (!chartObj.id || typeof chartObj.id !== 'string') errors.push('IDが不正です');
  if (!chartObj.title || typeof chartObj.title !== 'string') errors.push('タイトルが不正です');
  if (!chartObj.key || typeof chartObj.key !== 'string') errors.push('キーが不正です');
  if (!chartObj.timeSignature || typeof chartObj.timeSignature !== 'string') errors.push('拍子が不正です');
  if (!Array.isArray(chartObj.sections)) errors.push('セクションが不正です');
  
  // artistは型定義上オプショナルなので、存在する場合のみチェック
  if (chartObj.artist !== undefined && typeof chartObj.artist !== 'string') {
    errors.push('アーティスト名が不正です');
  }

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
    artist: typeof chartObj.artist === 'string' ? chartObj.artist : undefined,
    key: chartObj.key as string,
    tempo: typeof chartObj.tempo === 'number' ? chartObj.tempo : undefined,
    timeSignature: chartObj.timeSignature as string,
    createdAt,
    updatedAt,
    sections: validSections as unknown as ChordSection[],
    tags: Array.isArray(chartObj.tags) ? chartObj.tags as string[] : [],
    notes: typeof chartObj.notes === 'string' ? chartObj.notes : ''
  };

  return { isValid: true, chart: validatedChart, errors: [], warnings };
};

