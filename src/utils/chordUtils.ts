import type { ChordChart, ChordSection } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const createEmptyChordChart = (): Omit<ChordChart, 'id' | 'createdAt' | 'updatedAt'> => {
  const timeSignature = '4/4';
  return {
    title: '新しいコード譜',
    artist: '',
    key: 'C',
    tempo: 120,
    timeSignature,
    sections: [createEmptySection('イントロ', timeSignature)],
    tags: [],
    notes: ''
  };
};

export const createEmptySection = (name: string = 'セクション', timeSignature: string = '4/4'): ChordSection => {
  const beatsPerBar = parseInt(timeSignature.split('/')[0]);
  return {
    id: uuidv4(),
    name,
    chords: [],
    beatsPerBar,
    barsCount: 4
  };
};

export const createNewChordChart = (
  data: Partial<ChordChart>
): ChordChart => {
  const now = new Date();
  const empty = createEmptyChordChart();
  
  return {
    id: uuidv4(),
    ...empty,
    ...data,
    // sectionsが未定義の場合はデフォルトセクションを使用
    sections: data.sections || empty.sections,
    createdAt: now,
    updatedAt: now
  };
};

export const validateChordChart = (chart: Partial<ChordChart>): string[] => {
  const errors: string[] = [];
  
  if (!chart.title?.trim()) {
    errors.push('タイトルは必須です');
  }
  
  if (!chart.key?.trim()) {
    errors.push('キーは必須です');
  }
  
  if (!chart.timeSignature?.trim()) {
    errors.push('拍子は必須です');
  }
  
  // 新規作成時はセクションがundefinedの場合があるので、その場合は検証をスキップ
  // createNewChordChart関数でデフォルトセクションが追加される
  if (chart.sections !== undefined && chart.sections.length === 0) {
    errors.push('少なくとも1つのセクションが必要です');
  }
  
  return errors;
};

export const COMMON_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
];

export const COMMON_TIME_SIGNATURES = ['4/4', '3/4', '2/4', '6/8', '12/8'];

export const COMMON_SECTION_NAMES = [
  'イントロ', 'Aメロ', 'Bメロ', 'サビ', 'アウトロ', 'ブリッジ', 'ソロ', 'インタールード'
];

// 既存データの移行処理：拍子に応じてbeatsPerBarを修正
export const migrateChartData = (chart: ChordChart): ChordChart => {
  const beatsPerBar = chart.timeSignature ? parseInt(chart.timeSignature.split('/')[0]) : 4;
  
  return {
    ...chart,
    sections: chart.sections?.map(section => ({
      ...section,
      // beatsPerBarが未定義、または4拍以外の拍子で4拍になっている場合は修正
      beatsPerBar: (!section.beatsPerBar || (beatsPerBar !== 4 && section.beatsPerBar === 4)) ? beatsPerBar : section.beatsPerBar
    })) || []
  };
};

/**
 * コード名からルート音を抽出する
 * 
 * @param chordName - コード名 (例: "Am", "F#7", "B♭maj7", "D♭m7(♭5)")
 * @returns ルート音 (例: "A", "F#", "B♭", "D♭")
 */
export const extractChordRoot = (chordName: string): string => {
  if (!chordName || typeof chordName !== 'string') {
    return 'C'; // デフォルト値
  }

  // ルート音のパターンにマッチ: A-Gで始まり、#、b、♭のいずれかが続く可能性
  const rootMatch = chordName.match(/^([A-G][#b♭]?)/i);
  
  if (rootMatch) {
    return rootMatch[1];
  }
  
  // マッチしない場合はデフォルト値を返す
  return 'C';
};

/**
 * コード名が有効かどうかをチェックする
 * 
 * @param chordName - チェックするコード名
 * @returns 有効な場合はtrue
 */
export const isValidChordName = (chordName: string): boolean => {
  if (!chordName || typeof chordName !== 'string') {
    return false;
  }

  const trimmed = chordName.trim();
  if (!trimmed) {
    return false;
  }

  // ルート音（A-G）で始まることのみチェック、あとはユーザーの入力をそのまま受け入れる
  const rootPattern = /^[A-G][#b♭]?/i;
  return rootPattern.test(trimmed);
};

/**
 * コード名を正規化する（不要な空白を削除など）
 * 
 * @param chordName - 正規化するコード名
 * @returns 正規化されたコード名
 */
export const normalizeChordName = (chordName: string): string => {
  if (!chordName || typeof chordName !== 'string') {
    return 'C';
  }
  
  const trimmed = chordName.trim();
  if (!trimmed) {
    return 'C';
  }
  
  return trimmed;
};