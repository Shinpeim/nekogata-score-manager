import type { ChordChart, ChordSection } from '../types';
import { v4 as uuidv4 } from 'uuid';
import type { ExportData } from './export';
import { storageService } from './storage';

// ============================================================================
// 型定義
// ============================================================================

interface ImportResult {
  success: boolean;
  charts: ChordChart[];
  errors: string[];
  warnings: string[];
}

// ============================================================================
// 定数
// ============================================================================


// エラーメッセージ
const ERROR_MESSAGES = {
  FILE_READ_FAILED: 'ファイルの読み込みに失敗しました',
  FILE_READ_ERROR: 'ファイルの読み込みでエラーが発生しました',
  JSON_PARSE_FAILED: 'JSONの解析に失敗しました',
  UNKNOWN_ERROR: '不明なエラー',
  INVALID_DATA_FORMAT: '無効なデータフォーマットです',
} as const;



// ============================================================================
// インポート機能
// ============================================================================


/**
 * Storage-first方式でJSONファイルからコード譜をインポート
 * 1. ファイルを読み込んでバリデーション
 * 2. Storageに直接保存（Migration自動実行）
 * 3. 成功/失敗の結果を返す
 */
export const importChartsToStorage = async (file: File): Promise<{ success: boolean; error?: string; importedCount?: number }> => {
  try {
    // ファイル読み込み
    const jsonString = await file.text();
    
    // バリデーション
    const validationResult = parseImportData(jsonString);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.errors.join(', ')
      };
    }
    
    // Storage経由でインポート（Migration自動実行）
    await storageService.importCharts(validationResult.charts);
    
    return {
      success: true,
      importedCount: validationResult.charts.length
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
};

/**
 * JSON文字列をパースしてコード譜データを抽出
 */
export const parseImportData = (jsonString: string): ImportResult => {
  try {
    const rawData = JSON.parse(jsonString);
    return processImportData(rawData);
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
 * ExportData形式のみサポート
 */
const processImportData = (data: unknown): ImportResult => {
  // ExportData形式の検証
  if (isValidExportData(data)) {
    const validationResult = validateChartArray(data.charts || [], data.version);
    
    return {
      success: validationResult.charts.length > 0,
      charts: validationResult.charts,
      errors: validationResult.errors,
      warnings: validationResult.warnings
    };
  }
  
  return {
    success: false,
    charts: [],
    errors: [ERROR_MESSAGES.INVALID_DATA_FORMAT],
    warnings: []
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
 * ChordChart配列の検証
 */
const validateChartArray = (charts: unknown[], exportVersion?: string): { charts: ChordChart[]; errors: string[]; warnings: string[] } => {
  const validCharts: ChordChart[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  charts.forEach((chart, index) => {
    const result = validateSingleChart(chart, exportVersion);
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
const validateSingleChart = (chart: unknown, exportVersion?: string): { 
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

  if (chartObj.createdAt) {
    const parsed = new Date(chartObj.createdAt as string);
    if (!isNaN(parsed.getTime())) {
      createdAt = parsed;
    } else {
      warnings.push('作成日時が不正なため現在時刻に設定しました');
    }
  }

  // セクションの検証と修正
  const validSections = (chartObj.sections as unknown[]).map((section: unknown, index: number) => {
    const sectionWarnings: string[] = [];
    const sectionObj = section as Record<string, unknown>;
    
    // インポート時に新しいIDを生成
    sectionObj.id = uuidv4();
    sectionWarnings.push(`セクション${index + 1}にIDを自動生成しました`);
    
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
    id: uuidv4(), // インポート時に新しいIDを生成して衝突を防ぐ
    title: chartObj.title as string,
    artist: typeof chartObj.artist === 'string' ? chartObj.artist : undefined,
    key: chartObj.key as string,
    tempo: typeof chartObj.tempo === 'number' ? chartObj.tempo : undefined,
    timeSignature: chartObj.timeSignature as string,
    createdAt,
    updatedAt: new Date(), // インポート時に更新日時を現在に設定
    sections: validSections as unknown as ChordSection[],
    notes: typeof chartObj.notes === 'string' ? chartObj.notes : '',
    version: typeof chartObj.version === 'string' ? chartObj.version : exportVersion
  };

  return { isValid: true, chart: validatedChart, errors: [], warnings };
};

