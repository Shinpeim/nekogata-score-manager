import type { ChordChart, ChordLibrary } from '../types';

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
 * JSON文字列をパースしてコード譜データを抽出
 */
export const parseImportData = (jsonString: string): ImportResult => {
  const warnings: string[] = [];

  try {
    const data = JSON.parse(jsonString);
    
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
          warnings: ['旧形式のデータです。新形式に変換しました。', ...validationResult.warnings]
        };
      }
      
      // 単一のChordChartオブジェクトかどうかチェック
      if (data && typeof data === 'object' && data.id && data.title) {
        const validationResult = validateSingleChart(data);
        if (validationResult.isValid) {
          return {
            success: true,
            charts: [validationResult.chart!],
            errors: [],
            warnings: ['単一のコード譜ファイルです。']
          };
        }
      }
      
      return {
        success: false,
        charts: [],
        errors: ['無効なデータフォーマットです'],
        warnings: []
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
      warnings: [...warnings, ...validationResult.warnings]
    };

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
 * エクスポートデータの形式チェック
 */
const isValidExportData = (data: unknown): data is ExportData => {
  return data && 
         typeof data === 'object' && 
         typeof (data as Record<string, unknown>).version === 'string' && 
         Array.isArray((data as Record<string, unknown>).charts);
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
    ...chartObj,
    createdAt,
    updatedAt,
    sections: validSections,
    tags: Array.isArray(chartObj.tags) ? chartObj.tags : [],
    notes: typeof chartObj.notes === 'string' ? chartObj.notes : ''
  } as ChordChart;

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