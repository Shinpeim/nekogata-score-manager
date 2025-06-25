import type { ChordChart } from '../types';
import { CHROMATIC_NOTES, KEY_ACCIDENTALS } from './musicConstants';
import { extractChordRoot, parseOnChord, isOnChord } from './chordParsing';

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

  const transposedSections = chart.sections.map((section) => {
    return {
      ...section,
      chords: section.chords.map((chord) => {
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
    };
  });

  return {
    ...chart,
    key: newKey,
    sections: transposedSections,
    updatedAt: new Date()
  };
};