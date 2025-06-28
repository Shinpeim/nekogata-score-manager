import type { Chord } from '../types';
import { parseChordInput } from './chordParsing';
import { v4 as uuidv4 } from 'uuid';


/**
 * 文字列からコード進行をパースする
 * 
 * @param text - テキスト形式のコード進行
 * @param defaultDuration - 拍数指定がない場合のデフォルト拍数
 * @returns コードの配列
 * 
 * サポートする形式:
 * - "C F G Am" (デフォルト拍数使用)
 * - "C[4] F[2] G[2] Am[4]" (拍数指定)
 * - "C F | G Am" (改行あり)
 * - "C[1.5] F[2.5]" (小数拍数)
 * - "E7(#9)[2] C7(b5)[4]" (テンションコード)
 */
export const textToChords = (text: string, defaultDuration: number = 4): Chord[] => {
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
      const chord = parseChordText(part, defaultDuration);
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
 * @param defaultDuration - 拍数指定がない場合のデフォルト拍数
 * @returns パースされたコード、またはnull
 */
const parseChordText = (text: string, defaultDuration: number = 4): Chord | null => {
  const parsedChord = parseChordInput(text, defaultDuration);
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

