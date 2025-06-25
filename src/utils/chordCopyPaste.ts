import type { Chord } from '../types';
import { parseChordInput } from './chordParsing';
import { v4 as uuidv4 } from 'uuid';

/**
 * コード進行を文字列形式に変換する
 * 
 * @param chords - コードの配列
 * @returns テキスト形式のコード進行
 * 
 * 例: "C[4] F[2] G[2] | Am[4]"
 * - コード名[拍数]の形式
 * - 改行は "|" で表現
 */
export const chordsToText = (chords: Chord[]): string => {
  const parts: string[] = [];
  
  for (const chord of chords) {
    if (chord.isLineBreak === true) {
      parts.push('|');
    } else {
      const duration = chord.duration || 4;
      // 整数拍数は拍数のみ、小数拍数は小数点付きで表示
      const durationStr = duration % 1 === 0 ? duration.toString() : duration.toString();
      // オンコードの場合は元の形式（コード名/ベース音）で出力
      const fullChordName = chord.base ? `${chord.name}/${chord.base}` : chord.name;
      parts.push(`${fullChordName}[${durationStr}]`);
    }
  }
  
  return parts.join(' ');
};

/**
 * 文字列からコード進行をパースする
 * 
 * @param text - テキスト形式のコード進行
 * @returns コードの配列
 * 
 * サポートする形式:
 * - "C F G Am" (デフォルト4拍)
 * - "C[4] F[2] G[2] Am[4]" (拍数指定)
 * - "C F | G Am" (改行あり)
 * - "C[1.5] F[2.5]" (小数拍数)
 * - "E7(#9)[2] C7(b5)[4]" (テンションコード)
 */
export const textToChords = (text: string): Chord[] => {
  const chords: Chord[] = [];
  
  // 文字列を空白で分割
  const parts = text.trim().split(/\s+/);
  
  for (const part of parts) {
    if (part === '|') {
      // 改行マーカー
      chords.push({
        id: uuidv4(),
        name: '__LINE_BREAK__',
        root: '',
        isLineBreak: true,
        memo: ''
      });
    } else if (part.trim()) {
      // コード解析
      const chord = parseChordText(part);
      if (chord) {
        chords.push(chord);
      }
    }
  }
  
  return chords;
};

/**
 * 個別のコードテキストをパースする
 * 
 * @param text - コードテキスト (例: "Am[2]", "C7", "F#m", "E7(#9)[4]", "C/E[2]")
 * @returns パースされたコード、またはnull
 */
const parseChordText = (text: string): Chord | null => {
  const parsedChord = parseChordInput(text, 4);
  if (parsedChord) {
    return {
      ...parsedChord,
      id: uuidv4()
    };
  }
  return null;
};

/**
 * コード進行が有効かチェックする
 * 
 * @param text - チェックするテキスト
 * @returns 有効な場合はtrue
 */
export const isValidChordProgression = (text: string): boolean => {
  try {
    const chords = textToChords(text);
    return chords.length > 0;
  } catch {
    return false;
  }
};

/**
 * クリップボードにコード進行をコピーする
 * 
 * @param chords - コピーするコードの配列
 * @returns コピーが成功したかどうか
 */
export const copyChordProgressionToClipboard = async (chords: Chord[]): Promise<boolean> => {
  try {
    const text = chordsToText(chords);
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('クリップボードへのコピーに失敗しました:', error);
    return false;
  }
};

/**
 * クリップボードからコード進行を読み取る
 * 
 * @returns パースされたコードの配列、またはnull
 */
export const pasteChordProgressionFromClipboard = async (): Promise<Chord[] | null> => {
  try {
    const text = await navigator.clipboard.readText();
    if (!text.trim()) {
      return null;
    }
    
    const chords = textToChords(text);
    return chords.length > 0 ? chords : null;
  } catch (error) {
    console.error('クリップボードからの読み取りに失敗しました:', error);
    return null;
  }
};