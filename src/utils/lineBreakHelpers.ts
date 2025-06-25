import type { Chord } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 改行マーカーを作成する
 */
export function createLineBreakMarker(): Chord {
  return {
    id: uuidv4(),
    name: '改行',
    root: '',
    isLineBreak: true,
    duration: 0, // 改行マーカーは拍数を占めない
    memo: ''
  };
}


/**
 * 改行マーカーではない通常のコードのみを抽出する
 */
export function filterNormalChords(chords: Chord[]): Chord[] {
  return chords.filter(chord => chord.isLineBreak !== true);
}

/**
 * 改行マーカーを考慮してコードを行に分割する
 */
export function splitChordsIntoRows(chords: Chord[], barsPerRow: number, beatsPerBar: number): Chord[][] {
  const rows: Chord[][] = [];
  let currentRow: Chord[] = [];
  let currentBarBeats = 0;
  let currentRowBars = 0;

  for (const chord of chords) {
    if (chord.isLineBreak === true) {
      // 改行マーカーに出会ったら現在の行を終了
      if (currentRow.length > 0) {
        rows.push([...currentRow]);
        currentRow = [];
        currentRowBars = 0;
        currentBarBeats = 0;
      }
      continue;
    }

    const chordDuration = chord.duration || 4;
    
    // 小節が変わるかチェック
    if (currentBarBeats + chordDuration > beatsPerBar) {
      // 新しい小節へ
      currentRowBars++;
      currentBarBeats = chordDuration;
      
      // 行の小節数制限に達したら改行
      if (currentRowBars >= barsPerRow) {
        if (currentRow.length > 0) {
          rows.push([...currentRow]);
          currentRow = [chord];
          currentRowBars = 0;
          currentBarBeats = chordDuration;
        }
      } else {
        currentRow.push(chord);
      }
    } else {
      // 同じ小節内
      currentBarBeats += chordDuration;
      currentRow.push(chord);
      
      // 小節が完了したかチェック
      if (currentBarBeats === beatsPerBar) {
        currentRowBars++;
        currentBarBeats = 0;
        
        // 行の小節数制限に達したら改行
        if (currentRowBars >= barsPerRow) {
          rows.push([...currentRow]);
          currentRow = [];
          currentRowBars = 0;
        }
      }
    }
  }

  // 最後の行を追加
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}