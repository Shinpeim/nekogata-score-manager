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

/**
 * 12音階の音名マッピング（半音単位）
 */
export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * キーごとの適切な音名選択（#と♭の使い分け）
 */
export const KEY_ACCIDENTALS: Record<string, Record<string, string>> = {
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