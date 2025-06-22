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
    // bを♭に正規化
    return root.replace(/b/g, '♭');
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

  // [拍数]記法をチェック（オンコード対応）
  const bracketMatch = trimmed.match(/^([A-G][#b♭]?(?:maj|min|m|dim|aug|sus[24]|add\d+|\d+)*(?:\([#b♭]?\d+\))*(?:\/[A-G][#b♭]?)?)\[(\d*\.?\d*)\]$/i);
  if (bracketMatch) {
    const [, fullChordName, durationStr] = bracketMatch;
    const duration = durationStr ? parseFloat(durationStr) : defaultDuration;
    
    // 無効な拍数をチェック
    if (isNaN(duration) || duration <= 0 || duration > 16) {
      return null;
    }
    
    // オンコード解析
    const parsed = parseOnChord(fullChordName);
    const root = extractChordRoot(parsed.chord);
    
    return {
      name: parsed.chord,
      root,
      base: parsed.base,
      duration,
      memo: ''
    };
  }
  
  // 拍数指定なしのコード名のみ（テンションコード・オンコード含む）
  const basicMatch = trimmed.match(/^([A-G][#b♭]?(?:maj|min|m|dim|aug|sus[24]|add\d+|\d+)*(?:\([#b♭]?\d+\))*(?:\/[A-G][#b♭]?)?)$/i);
  if (basicMatch) {
    const [, fullChordName] = basicMatch;
    
    // オンコード解析
    const parsed = parseOnChord(fullChordName);
    const root = extractChordRoot(parsed.chord);
    
    return {
      name: parsed.chord,
      root,
      base: parsed.base,
      duration: defaultDuration,
      memo: ''
    };
  }
  
  return null;
};