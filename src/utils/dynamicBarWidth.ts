import type { Chord } from '../types';

interface BarContentAnalysis {
  chordCount: number;
  hasLongMemo: boolean;
  maxMemoLength: number;
  longestChordName: number;
}

export const DYNAMIC_BAR_WIDTH_CONFIG = {
  BASE_MIN_WIDTH: 50,        // さらに小さい最小幅でスペース効率向上
  BASE_MAX_WIDTH: 480,       // 最大幅を拡大してより多くの情報を表示
  WIDTH_PER_CHORD: 18,       // コード1つあたりの追加幅を微増
  WIDTH_PER_MEMO_CHAR: 5,    // メモ1文字あたりの追加幅を微増
  LONG_MEMO_THRESHOLD: 8,    // 「長いメモ」と判定する文字数
  LONG_MEMO_BONUS: 50,       // 長いメモに対する追加幅を増加
} as const;

/**
 * 小節内のコードを分析してコンテンツの特徴を取得
 */
export function analyzeBarContent(chords: Chord[]): BarContentAnalysis {
  if (chords.length === 0) {
    return {
      chordCount: 0,
      hasLongMemo: false,
      maxMemoLength: 0,
      longestChordName: 0,
    };
  }

  const chordCount = chords.length;
  const memoLengths = chords
    .map(chord => chord.memo?.length || 0)
    .filter(length => length > 0);
  
  const maxMemoLength = memoLengths.length > 0 ? Math.max(...memoLengths) : 0;
  const hasLongMemo = maxMemoLength >= DYNAMIC_BAR_WIDTH_CONFIG.LONG_MEMO_THRESHOLD;
  
  const chordNameLengths = chords.map(chord => {
    const nameLength = chord.name.length;
    const baseLength = chord.base ? chord.base.length + 1 : 0; // +1 for "/"
    return nameLength + baseLength;
  });
  
  const longestChordName = chordNameLengths.length > 0 ? Math.max(...chordNameLengths) : 0;

  return {
    chordCount,
    hasLongMemo,
    maxMemoLength,
    longestChordName,
  };
}

/**
 * 小節のコンテンツ分析結果から動的な幅を計算
 */
export function calculateDynamicBarWidth(analysis: BarContentAnalysis): number {
  let width = DYNAMIC_BAR_WIDTH_CONFIG.BASE_MIN_WIDTH;
  
  // コード数による幅増加
  width += analysis.chordCount * DYNAMIC_BAR_WIDTH_CONFIG.WIDTH_PER_CHORD;
  
  // メモ長による幅増加
  width += analysis.maxMemoLength * DYNAMIC_BAR_WIDTH_CONFIG.WIDTH_PER_MEMO_CHAR;
  
  // 長いメモのボーナス
  if (analysis.hasLongMemo) {
    width += DYNAMIC_BAR_WIDTH_CONFIG.LONG_MEMO_BONUS;
  }
  
  // 最小・最大幅で制限
  return Math.max(
    DYNAMIC_BAR_WIDTH_CONFIG.BASE_MIN_WIDTH,
    Math.min(DYNAMIC_BAR_WIDTH_CONFIG.BASE_MAX_WIDTH, width)
  );
}

/**
 * 小節のコード配列から直接幅を計算するヘルパー関数
 * フォントサイズを考慮した動的幅計算
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function calculateBarWidth(chords: Chord[], _beatsPerBar = 4, fontSize: number = 14): number {
  if (chords.length === 0) return DYNAMIC_BAR_WIDTH_CONFIG.BASE_MIN_WIDTH;
  
  // フォントサイズベースのコード幅を合計
  const totalChordWidth = chords.reduce((sum, chord) => {
    return sum + calculateChordWidthWithFontSize(chord, fontSize);
  }, 0);
  
  // パディングを追加
  const PADDING = 8;
  const calculatedWidth = totalChordWidth + PADDING;
  
  // 最小・最大幅で制限
  return Math.max(
    DYNAMIC_BAR_WIDTH_CONFIG.BASE_MIN_WIDTH,
    Math.min(DYNAMIC_BAR_WIDTH_CONFIG.BASE_MAX_WIDTH, calculatedWidth)
  );
}

/**
 * 文字列にマルチバイト文字が含まれているかチェック
 */
function hasMultiByteCharacters(str: string): boolean {
  // ASCII範囲外の文字があればマルチバイト文字とみなす
  // eslint-disable-next-line no-control-regex
  return /[^\x00-\x7F]/.test(str);
}

/**
 * フォントサイズに基づいたコードごとの動的幅を計算
 */
export function calculateChordWidthWithFontSize(chord: Chord, fontSize: number = 14): number {
  // ベースは14px時に47px、フォントサイズに比例して調整
  const baseWidth = Math.round((fontSize / 14) * 47);
  
  // コード名の長さに応じた追加幅
  const chordNameLength = chord.name.length + (chord.base ? chord.base.length + 1 : 0);
  const nameBonus = Math.round(Math.max(0, (chordNameLength - 3) * (fontSize / 14) * 5)); // 3文字超えたら追加
  
  // メモがある場合の追加幅
  if (chord.memo) {
    // マルチバイト文字（日本語など）の場合は幅を大きく取る
    const multiplier = hasMultiByteCharacters(chord.memo) ? 12 : 5;
    const memoBonus = Math.round(Math.max(20, chord.memo.length * (fontSize / 14) * multiplier));
    return baseWidth + nameBonus + memoBonus;
  }
  
  return baseWidth + nameBonus;
}