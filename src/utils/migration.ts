import type { ChordLibrary } from '../types';
import { migrateChartData } from './chordUtils';

// データスキーマのバージョン定義
export const CURRENT_DATA_VERSION = 2;

// 各バージョンのスキーマ定義
export interface DataVersionInfo {
  version: number;
  description: string;
  migrationRequired: boolean;
}

export const DATA_VERSIONS: DataVersionInfo[] = [
  {
    version: 1,
    description: '初期バージョン（beatsPerBar問題あり）',
    migrationRequired: true
  },
  {
    version: 2,
    description: 'beatsPerBar修正版、メモ機能追加',
    migrationRequired: false
  }
];

// 保存されるデータの型定義（バージョン情報付き）
export interface VersionedChordLibrary {
  version: number;
  data: ChordLibrary;
  createdAt: Date;
  updatedAt: Date;
}

// マイグレーション関数の型定義
type MigrationFunction = (data: ChordLibrary) => ChordLibrary;

// バージョン別マイグレーション関数
const MIGRATIONS: Record<number, MigrationFunction> = {
  // バージョン1から2への移行
  1: (data: ChordLibrary): ChordLibrary => {
    console.log('データをバージョン1から2に移行中...');
    
    const migratedData: ChordLibrary = {};
    
    for (const [id, chart] of Object.entries(data)) {
      // 既存のmigrateChartData関数を使用してbeatsPerBarを修正
      const migratedChart = migrateChartData(chart);
      
      // メモ機能がない場合は空文字で初期化
      migratedData[id] = {
        ...migratedChart,
        notes: migratedChart.notes ?? ''
      };
    }
    
    console.log(`${Object.keys(data).length}件のコード譜を移行しました`);
    return migratedData;
  }
};

/**
 * データのバージョンを取得する
 * 
 * @param rawData - ローカルストレージから取得した生データ
 * @returns バージョン番号（バージョン情報がない場合は1を返す）
 */
export const getDataVersion = (rawData: unknown): number => {
  if (!rawData) return CURRENT_DATA_VERSION;
  
  // バージョン情報付きデータの場合
  if (typeof rawData === 'object' && rawData !== null && 'version' in rawData && 'data' in rawData) {
    return (rawData as { version: number }).version;
  }
  
  // バージョン情報がない古いデータの場合（バージョン1とみなす）
  return 1;
};

/**
 * データをバージョン情報付きで包装する
 * 
 * @param data - コード譜データ
 * @returns バージョン情報付きデータ
 */
export const wrapWithVersion = (data: ChordLibrary): VersionedChordLibrary => {
  const now = new Date();
  
  return {
    version: CURRENT_DATA_VERSION,
    data,
    createdAt: now,
    updatedAt: now
  };
};

/**
 * バージョン情報付きデータからコード譜データを抽出する
 * 
 * @param versionedData - バージョン情報付きデータ
 * @returns コード譜データ
 */
export const extractChordLibrary = (versionedData: VersionedChordLibrary): ChordLibrary => {
  return versionedData.data;
};

/**
 * データが移行を必要とするかチェックする
 * 
 * @param version - データのバージョン
 * @returns 移行が必要な場合はtrue
 */
export const needsMigration = (version: number): boolean => {
  return version < CURRENT_DATA_VERSION;
};

/**
 * データを現在のバージョンに移行する
 * 
 * @param rawData - ローカルストレージから取得した生データ
 * @returns 移行されたコード譜データ
 */
export const migrateData = (rawData: unknown): ChordLibrary => {
  const currentVersion = getDataVersion(rawData);
  
  console.log(`データバージョン: ${currentVersion}, 最新バージョン: ${CURRENT_DATA_VERSION}`);
  
  // 移行が不要な場合
  if (!needsMigration(currentVersion)) {
    if (typeof rawData === 'object' && rawData !== null && 'data' in rawData) {
      // バージョン情報付きデータの場合
      return (rawData as { data: ChordLibrary }).data;
    } else {
      // 現在のバージョンの生データの場合
      return (rawData as ChordLibrary) || {};
    }
  }
  
  // 移行が必要な場合
  let data: ChordLibrary;
  
  if (typeof rawData === 'object' && rawData !== null && 'data' in rawData) {
    // バージョン情報付きデータの場合
    data = (rawData as { data: ChordLibrary }).data;
  } else {
    // 古いバージョンの生データの場合
    data = (rawData as ChordLibrary) || {};
  }
  
  // 段階的にマイグレーションを実行
  let migratedData = data;
  
  for (let version = currentVersion; version < CURRENT_DATA_VERSION; version++) {
    const migrationFunction = MIGRATIONS[version];
    
    if (migrationFunction) {
      console.log(`バージョン${version}から${version + 1}に移行中...`);
      migratedData = migrationFunction(migratedData);
    } else {
      console.warn(`バージョン${version}の移行関数が見つかりません`);
    }
  }
  
  return migratedData;
};

/**
 * バージョン情報を含むマイグレーション統計を取得する
 * 
 * @param originalData - 元のデータ
 * @param migratedData - 移行後のデータ
 * @returns 移行統計
 */
export const getMigrationStats = (
  originalVersion: number,
  migratedData: ChordLibrary
): {
  originalVersion: number;
  currentVersion: number;
  totalCharts: number;
  migrationPerformed: boolean;
  migrationSteps: string[];
} => {
  const migrationSteps: string[] = [];
  
  for (let version = originalVersion; version < CURRENT_DATA_VERSION; version++) {
    const versionInfo = DATA_VERSIONS.find(v => v.version === version + 1);
    if (versionInfo) {
      migrationSteps.push(`v${version} → v${version + 1}: ${versionInfo.description}`);
    }
  }
  
  return {
    originalVersion,
    currentVersion: CURRENT_DATA_VERSION,
    totalCharts: Object.keys(migratedData).length,
    migrationPerformed: originalVersion < CURRENT_DATA_VERSION,
    migrationSteps
  };
};

/**
 * 移行のプレビューを行う（実際には移行せず、統計のみ返す）
 * 
 * @param rawData - ローカルストレージから取得した生データ
 * @returns 移行プレビュー情報
 */
export const previewMigration = (rawData: unknown): {
  currentVersion: number;
  targetVersion: number;
  needsMigration: boolean;
  chartCount: number;
  migrationSteps: string[];
} => {
  const currentVersion = getDataVersion(rawData);
  const needsMigrationFlag = needsMigration(currentVersion);
  
  let data: ChordLibrary;
  if (typeof rawData === 'object' && rawData !== null && 'data' in rawData) {
    data = (rawData as { data: ChordLibrary }).data;
  } else {
    data = (rawData as ChordLibrary) || {};
  }
  
  const migrationSteps: string[] = [];
  if (needsMigrationFlag) {
    for (let version = currentVersion; version < CURRENT_DATA_VERSION; version++) {
      const versionInfo = DATA_VERSIONS.find(v => v.version === version + 1);
      if (versionInfo) {
        migrationSteps.push(versionInfo.description);
      }
    }
  }
  
  return {
    currentVersion,
    targetVersion: CURRENT_DATA_VERSION,
    needsMigration: needsMigrationFlag,
    chartCount: Object.keys(data).length,
    migrationSteps
  };
};