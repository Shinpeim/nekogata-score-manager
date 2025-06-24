import type { ChordChart } from '../types';


/**
 * v1.0.0のマイグレーション: beatsPerBar修正 + notes/version初期化
 */
const migrateChartDataV1 = (chart: ChordChart): ChordChart => {
  const beatsPerBar = chart.timeSignature ? parseInt(chart.timeSignature.split('/')[0]) : 4;
  
  return {
    ...chart,
    sections: chart.sections?.map(section => ({
      ...section,
      // beatsPerBarが未定義、または4拍以外の拍子で4拍になっている場合は修正
      beatsPerBar: (!section.beatsPerBar || (beatsPerBar !== 4 && section.beatsPerBar === 4)) ? beatsPerBar : section.beatsPerBar
    })) || [],
    // notesが未設定の場合は空文字で初期化
    notes: chart.notes ?? '',
    // version情報を1.0.0に設定
    version: '1.0.0'
  };
};

/**
 * v2.0.0のマイグレーション: memoフィールド追加
 */
const migrateChartDataV2 = (chart: ChordChart): ChordChart => {
  return {
    ...chart,
    sections: chart.sections?.map(section => ({
      ...section,
      // 各コードにmemoフィールドを追加（既存コードには空文字列を設定）
      chords: section.chords?.map(chord => ({
        ...chord,
        memo: chord.memo ?? ''
      })) || []
    })) || [],
    // version情報を2.0.0に設定
    version: '2.0.0'
  };
};

/**
 * v3.0.0のマイグレーション: tagsフィールド削除
 */
const migrateChartDataV3 = (chart: ChordChart): ChordChart => {
  // tagsフィールドを削除
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tags, ...chartWithoutTags } = chart as ChordChart & { tags?: string[] };
  return {
    ...chartWithoutTags,
    // version情報を3.0.0に設定
    version: '3.0.0'
  };
};

/**
 * セマンティックバージョンを解析
 */
const parseVersion = (version: string): { major: number; minor: number; patch: number } => {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major: major || 0, minor: minor || 0, patch: patch || 0 };
};

/**
 * マイグレーション関数の型定義
 */
type MigrationFunction = (chart: ChordChart) => ChordChart;

/**
 * マイグレーション定義の型
 */
interface Migration {
  version: string;
  migrate: MigrationFunction;
}

/**
 * マイグレーション定義配列
 * 新しいバージョンのマイグレーションはここに追加するだけ
 * 
 * 使用例:
 * 新しいv3.0.0マイグレーションを追加する場合:
 * { version: '3.0.0', migrate: migrateChartDataV3 },
 */
const migrations: Migration[] = [
  { version: '1.0.0', migrate: migrateChartDataV1 },
  { version: '2.0.0', migrate: migrateChartDataV2 },
  { version: '3.0.0', migrate: migrateChartDataV3 },
];

/**
 * チャートデータを段階的に最新バージョンにマイグレーション
 * 現在のバージョンより新しいマイグレーションを順次実行
 */
export const migrateChartData = (chart: ChordChart): ChordChart => {
  const currentVersion = chart.version || '0.0.0'; // versionなしは0.0.0として扱う
  const currentMajor = parseVersion(currentVersion).major;
  
  let migratedChart = { ...chart };
  
  // 現在のバージョンより新しいマイグレーションを順次実行
  for (const migration of migrations) {
    const targetMajor = parseVersion(migration.version).major;
    if (currentMajor < targetMajor) {
      migratedChart = migration.migrate(migratedChart);
    }
  }
  
  return migratedChart;
};