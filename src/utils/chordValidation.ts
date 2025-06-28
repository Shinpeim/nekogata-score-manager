import type { ChordChart } from '../types';
import { isOnChord, parseOnChord } from './chordParsing';

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

  // N.C. (No Chord) は有効なコードとして扱う
  if (trimmed.toUpperCase() === 'N.C.' || trimmed.toUpperCase() === 'NC') {
    return true;
  }

  // ルート音（A-G）で始まることのみチェック、あとはユーザーの入力をそのまま受け入れる
  const rootPattern = /^[A-G][#b♭]?/i;
  return rootPattern.test(trimmed);
};

/**
 * 拍数が有効かどうかをチェックする
 * 
 * @param duration - チェックする拍数（文字列または数値）
 * @returns 有効な場合はtrue
 */
export const isValidDuration = (duration: string | number): boolean => {
  if (typeof duration === 'number') {
    return !isNaN(duration) && duration >= 0.5 && duration <= 16 && (duration * 2) % 1 === 0;
  }
  
  if (typeof duration === 'string') {
    const trimmed = duration.trim();
    if (!trimmed) {
      return false;
    }
    
    const parsed = parseFloat(trimmed);
    return !isNaN(parsed) && parsed >= 0.5 && parsed <= 16 && (parsed * 2) % 1 === 0;
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

