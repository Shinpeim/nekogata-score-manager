import type { Chord } from '../types';

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
    // ルートが2文字で、2文字目がbの場合のみ♭に正規化
    if (root.length === 2 && root[1] === 'b') {
      return root[0].toUpperCase() + '♭';
    }
    // 常に大文字に正規化
    return root.toUpperCase();
  }
  
  // マッチしない場合はデフォルト値を返す
  return 'C';
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
    // bを♭に正規化し、大文字に統一
    let normalizedBase = base;
    if (base.length === 2 && base[1] === 'b') {
      normalizedBase = base[0].toUpperCase() + '♭';
    } else {
      normalizedBase = base.toUpperCase();
    }
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
 * 単一のコードテキストを統一的にパースする
 * 
 * @param text - コードテキスト (例: "Am[2]", "C7", "F#m", "E7(#9)[4]", "C/E[2]")
 * @param defaultDuration - 拍数指定がない場合のデフォルト拍数
 * @returns パースされたコード、またはnull
 */
export const parseChordInput = (text: string, defaultDuration: number = 4): Chord | null => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  // [拍数]記法をチェック（任意の文字列に対応、拍数は数値のみ、負数も含む）
  const bracketMatch = trimmed.match(/^(.+?)\[(-?\d+(?:\.\d+)?)\]$/);
  if (bracketMatch) {
    const [, inputText, durationStr] = bracketMatch;
    const duration = parseFloat(durationStr);
    
    // 無効な拍数をチェック
    if (isNaN(duration) || duration <= 0 || duration > 16) {
      // 拍数が無効でも、テキスト部分はそのまま使用
      const parsed = parseOnChord(inputText);
      const root = extractChordRoot(parsed.chord);
      
      return {
        name: parsed.chord,
        root,
        base: parsed.base,
        duration: defaultDuration,
        memo: ''
      };
    }
    
    // オンコード解析（コード名として認識できない場合でもそのまま使用）
    const parsed = parseOnChord(inputText);
    const root = extractChordRoot(parsed.chord);
    
    return {
      name: parsed.chord,
      root,
      base: parsed.base,
      duration,
      memo: ''
    };
  }
  
  // 拍数指定なしの場合、どんな文字列でも受け入れる
  // コード名として認識できない場合でもそのまま使用
  const parsed = parseOnChord(trimmed);
  const root = extractChordRoot(parsed.chord);
  
  return {
    name: parsed.chord,
    root,
    base: parsed.base,
    duration: defaultDuration,
    memo: ''
  };
};