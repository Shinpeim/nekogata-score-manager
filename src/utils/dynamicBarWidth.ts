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
 * コードの実際の必要幅を計算（最低幅考慮）
 */
function calculateRequiredWidth(chords: Chord[], beatsPerBar: number): number {
  if (chords.length === 0) return DYNAMIC_BAR_WIDTH_CONFIG.BASE_MIN_WIDTH;
  
  const MIN_CHORD_WIDTH = 47; // ChordGridRendererの値と合わせる（36px * 1.3）
  const PADDING = 8; // 左右パディング
  
  // 各コードの必要幅を計算
  const totalRequiredWidth = chords.reduce((sum, chord) => {
    const chordDuration = chord.duration || 4;
    const proportionalWidth = (chordDuration / beatsPerBar) * 100; // 仮の基準幅
    const requiredWidth = Math.max(proportionalWidth, MIN_CHORD_WIDTH);
    return sum + requiredWidth;
  }, 0);
  
  return totalRequiredWidth + PADDING;
}

/**
 * 小節のコード配列から直接幅を計算するヘルパー関数
 * 従来の動的幅と実際必要幅の大きい方を採用
 */
export function calculateBarWidth(chords: Chord[], beatsPerBar: number = 4): number {
  const analysis = analyzeBarContent(chords);
  const baseWidth = calculateDynamicBarWidth(analysis);
  const requiredWidth = calculateRequiredWidth(chords, beatsPerBar);
  
  // 大きい方を採用して、横スクロールを回避
  return Math.max(baseWidth, requiredWidth);
}