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
    const root = rootMatch[1];
    // bを♭に正規化
    return root.replace(/b/g, '♭');
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

/**
 * コード名からオンコード情報を解析する
 * 
 * @param chordName - コード名 (例: "C/E", "Am7/G", "F#m/C#")
 * @returns オンコード情報を含むオブジェクト
 */
export const parseOnChord = (chordName: string): { chord: string; base?: string } => {
  if (!chordName || typeof chordName !== 'string') {
    return { chord: 'C' };
  }

  const trimmed = chordName.trim();
  if (!trimmed) {
    return { chord: 'C' };
  }

  // オンコードのパターン: /[A-G][#♭b]?で終わる
  const onChordMatch = trimmed.match(/^(.+)\/([A-G][#♭b]?)$/i);
  
  if (onChordMatch) {
    const chord = onChordMatch[1];
    const base = onChordMatch[2];
    // bを♭に正規化
    const normalizedBase = base.replace(/b/g, '♭');
    return { chord, base: normalizedBase };
  }
  
  return { chord: trimmed };
};

/**
 * オンコードかどうかを判定する
 * 
 * @param chordName - コード名
 * @returns オンコードの場合はtrue
 */
export const isOnChord = (chordName: string): boolean => {
  if (!chordName || typeof chordName !== 'string') {
    return false;
  }

  // /[A-G][#♭b]?で終わるパターンをチェック
  return /\/[A-G][#♭b]?$/i.test(chordName.trim());
};

/**
 * 拍数が有効かどうかをチェックする
 * 
 * @param duration - チェックする拍数（文字列または数値）
 * @returns 有効な場合はtrue
 */
export const isValidDuration = (duration: string | number): boolean => {
  if (typeof duration === 'number') {
    return !isNaN(duration) && duration >= 0.5 && duration <= 16;
  }
  
  if (typeof duration === 'string') {
    const trimmed = duration.trim();
    if (!trimmed) {
      return false;
    }
    
    const parsed = parseFloat(trimmed);
    return !isNaN(parsed) && parsed >= 0.5 && parsed <= 16;
  }
  
  return false;
};

/**
 * コード名の完全バリデーション（オンコード含む）
 * 
 * @param chordName - チェックするコード名
 * @returns 有効な場合はtrue
 */
export const isValidFullChordName = (chordName: string): boolean => {
  if (!chordName || typeof chordName !== 'string') {
    return false;
  }

  const trimmed = chordName.trim();
  if (!trimmed) {
    return false;
  }

  // スラッシュが含まれる場合はオンコードの可能性
  if (trimmed.includes('/')) {
    // 有効なオンコードパターンかチェック
    if (isOnChord(trimmed)) {
      const parsed = parseOnChord(trimmed);
      // コード部分とベース音の両方が有効であることを確認
      return isValidChordName(parsed.chord) && parsed.base !== undefined && /^[A-G][#b♭]?$/i.test(parsed.base);
    } else {
      // スラッシュがあるが有効なオンコードパターンでない場合は無効
      return false;
    }
  }
  
  // 通常のコード名のバリデーション
  return isValidChordName(trimmed);
};

/**
 * コード譜全体のバリデーション（現在編集中の入力値を含む）
 * 
 * @param chart - チェックするコード譜
 * @param editingState - 現在編集中の状態（SortableChordItemから取得）
 * @returns バリデーション結果
 */
export const validateChartInputs = (
  chart: ChordChart,
  editingState?: {
    sectionId?: string;
    chordIndex?: number;
    displayValue?: string;
    durationDisplayValue?: string;
    isEditing?: boolean;
    isDurationEditing?: boolean;
  }
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!chart.sections) {
    return { isValid: true, errors: [] };
  }

  for (const section of chart.sections) {
    for (let chordIndex = 0; chordIndex < section.chords.length; chordIndex++) {
      const chord = section.chords[chordIndex];
      
      // 改行マーカーはスキップ
      if (chord.isLineBreak) {
        continue;
      }

      // 現在編集中のコードかチェック
      const isCurrentlyEditing = editingState?.sectionId === section.id && 
                                editingState?.chordIndex === chordIndex;

      // コード名のバリデーション
      let chordNameToCheck = chord.name;
      if (isCurrentlyEditing && editingState?.isEditing && editingState?.displayValue) {
        chordNameToCheck = editingState.displayValue;
      }

      if (!isValidFullChordName(chordNameToCheck)) {
        errors.push(
          `セクション「${section.name || 'セクション'}」の${chordIndex + 1}番目のコード名「${chordNameToCheck}」が無効です`
        );
      }

      // 拍数のバリデーション
      let durationToCheck: string | number = chord.duration || 4;
      if (isCurrentlyEditing && editingState?.isDurationEditing && editingState?.durationDisplayValue) {
        durationToCheck = editingState.durationDisplayValue;
      }

      if (!isValidDuration(durationToCheck)) {
        errors.push(
          `セクション「${section.name || 'セクション'}」の${chordIndex + 1}番目の拍数「${durationToCheck}」が無効です（0.5-16の範囲で入力してください）`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};