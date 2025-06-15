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