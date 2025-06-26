import type { Chord } from '../types';

/**
 * 音名から半音数を取得する
 * 
 * @param note - 音名 (例: "C", "C#", "D♭")
 * @returns 半音数 (0-11)
 */
const getNoteIndex = (note: string): number => {
  // ♭をbに一時的に変換して処理
  const normalizedNote = note.replace('♭', 'b');
  
  // C#/Db形式の音名に対応
  const noteMap: Record<string, number> = {
    'C': 0, 'B#': 0,
    'C#': 1, 'Db': 1,
    'D': 2,
    'D#': 3, 'Eb': 3,
    'E': 4, 'Fb': 4,
    'F': 5, 'E#': 5,
    'F#': 6, 'Gb': 6,
    'G': 7,
    'G#': 8, 'Ab': 8,
    'A': 9,
    'A#': 10, 'Bb': 10,
    'B': 11, 'Cb': 11
  };
  
  return noteMap[normalizedNote] ?? 0;
};

/**
 * コードを品質保持型ディグリー表記に変換する
 * 
 * @param chord - コードオブジェクト
 * @param key - 楽曲のキー (例: "C", "Am", "G#m")
 * @returns ディグリー表記 (例: "VIm7", "IIm7(♭5)", "V7/I")
 */
export const chordToDegreeWithQuality = (chord: Chord, key: string): string => {
  if (!chord || !chord.name || !key) {
    return '';
  }

  // キーからルート音を抽出（メジャー/マイナーキーの両方に対応）
  const keyRoot = key.match(/^([A-G][#♭b]?)/i)?.[1] || 'C';
  const keyRootIndex = getNoteIndex(keyRoot);

  // コードのルート音インデックスを取得
  const chordRootIndex = getNoteIndex(chord.root);

  // 度数を計算（半音数）
  const interval = ((chordRootIndex - keyRootIndex + 12) % 12);
  
  // 半音数からディグリーと変化記号を取得
  let degreeName = '';
  switch (interval) {
    case 0: degreeName = 'I'; break;
    case 1: degreeName = '♭II'; break;
    case 2: degreeName = 'II'; break;
    case 3: degreeName = '♭III'; break;
    case 4: degreeName = 'III'; break;
    case 5: degreeName = 'IV'; break;
    case 6: degreeName = '#IV'; break;  // F#はCから見て#IV
    case 7: degreeName = 'V'; break;
    case 8: degreeName = '♭VI'; break;
    case 9: degreeName = 'VI'; break;
    case 10: degreeName = '♭VII'; break;
    case 11: degreeName = 'VII'; break;
    default: degreeName = 'I';
  }

  // 品質部分を抽出（ルート音を除いた部分）
  const quality = chord.name.substring(chord.root.length);

  // ベース音がある場合のディグリー変換
  let bassDegree = '';
  if (chord.base) {
    const bassIndex = getNoteIndex(chord.base);
    const bassInterval = ((bassIndex - keyRootIndex + 12) % 12);
    
    switch (bassInterval) {
      case 0: bassDegree = '/I'; break;
      case 1: bassDegree = '/♭II'; break;
      case 2: bassDegree = '/II'; break;
      case 3: bassDegree = '/♭III'; break;
      case 4: bassDegree = '/III'; break;
      case 5: bassDegree = '/IV'; break;
      case 6: bassDegree = '/#IV'; break;
      case 7: bassDegree = '/V'; break;
      case 8: bassDegree = '/♭VI'; break;
      case 9: bassDegree = '/VI'; break;
      case 10: bassDegree = '/♭VII'; break;
      case 11: bassDegree = '/VII'; break;
      default: bassDegree = '/I';
    }
  }

  return degreeName + quality + bassDegree;
};

/**
 * キーが有効かどうかを判定する
 * 
 * @param key - キー名
 * @returns 有効なキーの場合true
 */
export const isValidKey = (key: string): boolean => {
  if (!key || typeof key !== 'string') {
    return false;
  }
  
  // メジャーキーのパターンにマッチ（アプリ内部ではメジャーキーのみ使用）
  return /^[A-G][#♭b]?$/i.test(key.trim());
};