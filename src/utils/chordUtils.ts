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
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
];

export const KEY_DISPLAY_NAMES: Record<string, string> = {
  'C': 'C / Am',
  'Db': 'D♭ / B♭m',
  'D': 'D / Bm',
  'Eb': 'E♭ / Cm',
  'E': 'E / C#m',
  'F': 'F / Dm',
  'Gb': 'G♭ / E♭m',
  'G': 'G / Em',
  'Ab': 'A♭ / Fm',
  'A': 'A / F#m',
  'Bb': 'B♭ / Gm',
  'B': 'B / G#m'
};

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

// 移調機能のためのユーティリティ関数

/**
 * 12音階の音名マッピング（半音単位）
 */
const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * キーごとの適切な音名選択（#と♭の使い分け）
 */
const KEY_ACCIDENTALS: Record<string, Record<string, string>> = {
  'C': {}, // 臨時記号なし
  'Db': { 'C#': 'D♭', 'D#': 'E♭', 'F#': 'G♭', 'G#': 'A♭', 'A#': 'B♭' },
  'D': { 'C#': 'C#', 'F#': 'F#' },
  'Eb': { 'D#': 'E♭', 'A#': 'B♭', 'C#': 'D♭' },
  'E': { 'C#': 'C#', 'D#': 'D#', 'F#': 'F#', 'G#': 'G#' },
  'F': { 'A#': 'B♭', 'G#': 'A♭' },
  'Gb': { 'C#': 'D♭', 'D#': 'E♭', 'F#': 'G♭', 'G#': 'A♭', 'A#': 'B♭', 'B': 'C♭' },
  'G': { 'F#': 'F#' },
  'Ab': { 'D#': 'E♭', 'G#': 'A♭', 'A#': 'B♭', 'C#': 'D♭' },
  'A': { 'C#': 'C#', 'F#': 'F#', 'G#': 'G#' },
  'Bb': { 'D#': 'E♭', 'A#': 'B♭' },
  'B': { 'C#': 'C#', 'D#': 'D#', 'F#': 'F#', 'G#': 'G#', 'A#': 'A#' }
};

/**
 * 音名を半音単位のインデックスに変換
 * 
 * @param noteName - 音名 (例: "C", "F#", "B♭")
 * @returns 半音単位のインデックス (0-11)
 */
const noteNameToIndex = (noteName: string): number => {
  // ♭をbに正規化してから処理
  const normalized = noteName.replace(/♭/g, 'b');
  
  const noteMap: Record<string, number> = {
    'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5,
    'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11,
    'C#': 1, 'D#': 3, 'F#': 6, 'G#': 8, 'A#': 10
  };
  
  return noteMap[normalized] ?? 0;
};

/**
 * 半音単位のインデックスを音名に変換（キーに適した記法で）
 * 
 * @param index - 半音単位のインデックス (0-11)
 * @param targetKey - 目標キー
 * @returns 音名
 */
const indexToNoteName = (index: number, targetKey: string): string => {
  const normalizedIndex = ((index % 12) + 12) % 12;
  const sharpNote = CHROMATIC_NOTES[normalizedIndex];
  
  // 目標キーに適した音名を選択
  const accidentals = KEY_ACCIDENTALS[targetKey] || {};
  return accidentals[sharpNote] || sharpNote;
};

/**
 * コード名を移調する
 * 
 * @param chordName - 移調するコード名
 * @param semitones - 移調する半音数（正の値で上に、負の値で下に）
 * @param targetKey - 目標キー（適切な音名選択のため）
 * @returns 移調されたコード名
 */
export const transposeChordName = (chordName: string, semitones: number, targetKey: string): string => {
  if (!chordName || typeof chordName !== 'string') {
    return 'C';
  }

  const trimmed = chordName.trim();
  if (!trimmed) {
    return 'C';
  }

  // オンコードの場合は分離して処理
  if (isOnChord(trimmed)) {
    const parsed = parseOnChord(trimmed);
    const transposedChord = transposeChordName(parsed.chord, semitones, targetKey);
    const transposedBase = parsed.base ? transposeNoteName(parsed.base, semitones, targetKey) : '';
    return transposedBase ? `${transposedChord}/${transposedBase}` : transposedChord;
  }

  // ルート音を抽出
  const rootMatch = trimmed.match(/^([A-G][#b♭]?)/i);
  if (!rootMatch) {
    return trimmed; // ルート音が見つからない場合はそのまま返す
  }

  const originalRoot = rootMatch[1];
  const suffix = trimmed.slice(originalRoot.length);
  
  // ルート音を移調
  const transposedRoot = transposeNoteName(originalRoot, semitones, targetKey);
  
  return transposedRoot + suffix;
};

/**
 * 単一の音名を移調する
 * 
 * @param noteName - 移調する音名
 * @param semitones - 移調する半音数
 * @param targetKey - 目標キー
 * @returns 移調された音名
 */
const transposeNoteName = (noteName: string, semitones: number, targetKey: string): string => {
  const currentIndex = noteNameToIndex(noteName);
  const newIndex = currentIndex + semitones;
  return indexToNoteName(newIndex, targetKey);
};

/**
 * キー間の半音数の差を計算
 * 
 * @param fromKey - 元のキー
 * @param toKey - 目標キー
 * @returns 半音数の差
 */
export const calculateSemitonesDifference = (fromKey: string, toKey: string): number => {
  const fromIndex = noteNameToIndex(fromKey);
  const toIndex = noteNameToIndex(toKey);
  return toIndex - fromIndex;
};

/**
 * コード譜全体を移調する
 * 
 * @param chart - 移調するコード譜
 * @param newKey - 新しいキー
 * @returns 移調されたコード譜
 */
export const transposeChart = (chart: ChordChart, newKey: string): ChordChart => {
  const semitones = calculateSemitonesDifference(chart.key, newKey);
  
  if (semitones === 0) {
    // 移調の必要がない場合はキーのみ更新
    return {
      ...chart,
      key: newKey,
      updatedAt: new Date()
    };
  }

  const transposedSections = chart.sections.map(section => ({
    ...section,
    chords: section.chords.map(chord => {
      if (chord.isLineBreak) {
        return chord; // 改行マーカーはそのまま
      }
      
      const transposedName = transposeChordName(chord.name, semitones, newKey);
      const transposedRoot = extractChordRoot(transposedName);
      const transposedBase = chord.base ? transposeNoteName(chord.base, semitones, newKey) : undefined;
      
      return {
        ...chord,
        name: transposedName,
        root: transposedRoot,
        base: transposedBase
      };
    })
  }));

  return {
    ...chart,
    key: newKey,
    sections: transposedSections,
    updatedAt: new Date()
  };
};