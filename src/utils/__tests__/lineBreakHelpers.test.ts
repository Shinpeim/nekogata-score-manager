import { describe, it, expect } from 'vitest';
import { 
  createLineBreakMarker, 
  isLineBreakMarker, 
  filterNormalChords, 
  splitChordsIntoRows 
} from '../lineBreakHelpers';
import type { Chord } from '../../types';

describe('lineBreakHelpers', () => {
  describe('createLineBreakMarker', () => {
    it('改行マーカーを作成する', () => {
      const marker = createLineBreakMarker();
      
      expect(marker.name).toBe('改行');
      expect(marker.root).toBe('');
      expect(marker.isLineBreak).toBe(true);
      expect(marker.duration).toBe(0);
    });
  });

  describe('isLineBreakMarker', () => {
    it('改行マーカーを正しく判定する', () => {
      const lineBreak = createLineBreakMarker();
      const normalChord: Chord = { name: 'C', root: 'C', duration: 4, memo: '' };
      
      expect(isLineBreakMarker(lineBreak)).toBe(true);
      expect(isLineBreakMarker(normalChord)).toBe(false);
    });

    it('isLineBreakが未定義のコードを通常コードとして判定する', () => {
      const chord: Chord = { name: 'Am', root: 'A', duration: 2, memo: '' };
      
      expect(isLineBreakMarker(chord)).toBe(false);
    });
  });

  describe('filterNormalChords', () => {
    it('改行マーカーを除外して通常のコードのみを返す', () => {
      const chords: Chord[] = [
        { name: 'C', root: 'C', duration: 4, memo: '' },
        createLineBreakMarker(),
        { name: 'F', root: 'F', duration: 4, memo: '' },
        { name: 'G', root: 'G', duration: 4, memo: '' },
        createLineBreakMarker(),
        { name: 'Am', root: 'A', duration: 4, memo: '' }
      ];

      const normalChords = filterNormalChords(chords);
      
      expect(normalChords).toHaveLength(4);
      expect(normalChords.map(c => c.name)).toEqual(['C', 'F', 'G', 'Am']);
    });

    it('改行マーカーがない場合はそのまま返す', () => {
      const chords: Chord[] = [
        { name: 'C', root: 'C', duration: 4, memo: '' },
        { name: 'F', root: 'F', duration: 4, memo: '' }
      ];

      const result = filterNormalChords(chords);
      
      expect(result).toEqual(chords);
    });
  });

  describe('splitChordsIntoRows', () => {
    it('改行マーカーで行を分割する', () => {
      const chords: Chord[] = [
        { name: 'C', root: 'C', duration: 4, memo: '' },
        { name: 'F', root: 'F', duration: 4, memo: '' },
        createLineBreakMarker(),
        { name: 'G', root: 'G', duration: 4, memo: '' },
        { name: 'Am', root: 'A', duration: 4, memo: '' }
      ];

      const rows = splitChordsIntoRows(chords, 8, 4);
      
      expect(rows).toHaveLength(2);
      expect(rows[0].map(c => c.name)).toEqual(['C', 'F']);
      expect(rows[1].map(c => c.name)).toEqual(['G', 'Am']);
    });

    it('改行マーカーがない場合は小節数制限で分割', () => {
      const chords: Chord[] = [
        { name: 'C', root: 'C', duration: 4, memo: '' }, // 1小節
        { name: 'F', root: 'F', duration: 4, memo: '' }, // 1小節
        { name: 'G', root: 'G', duration: 4, memo: '' }, // 1小節
        { name: 'Am', root: 'A', duration: 4, memo: '' } // 1小節
      ];

      const rows = splitChordsIntoRows(chords, 2, 4); // 2小節/行

      expect(rows).toHaveLength(2);
      expect(rows[0].map(c => c.name)).toEqual(['C', 'F']);
      expect(rows[1].map(c => c.name)).toEqual(['G', 'Am']);
    });

    it('複数の拍数のコードを正しく処理する', () => {
      const chords: Chord[] = [
        { name: 'C', root: 'C', duration: 2, memo: '' }, // 2拍
        { name: 'F', root: 'F', duration: 2, memo: '' }, // 2拍 = 1小節完了
        { name: 'G', root: 'G', duration: 1, memo: '' }, // 1拍
        { name: 'Am', root: 'A', duration: 3, memo: '' } // 3拍 = 1小節完了
      ];

      const rows = splitChordsIntoRows(chords, 2, 4); // 2小節/行

      expect(rows).toHaveLength(1);
      expect(rows[0].map(c => c.name)).toEqual(['C', 'F', 'G', 'Am']);
    });

    it('改行マーカーが連続している場合を正しく処理する', () => {
      const chords: Chord[] = [
        { name: 'C', root: 'C', duration: 4, memo: '' },
        createLineBreakMarker(),
        createLineBreakMarker(),
        { name: 'F', root: 'F', duration: 4, memo: '' }
      ];

      const rows = splitChordsIntoRows(chords, 8, 4);
      
      expect(rows).toHaveLength(2);
      expect(rows[0].map(c => c.name)).toEqual(['C']);
      expect(rows[1].map(c => c.name)).toEqual(['F']);
    });

    it('小節の途中で改行マーカーがある場合を正しく処理する', () => {
      const chords: Chord[] = [
        { name: 'C', root: 'C', duration: 2, memo: '' }, // 2拍
        createLineBreakMarker(),
        { name: 'F', root: 'F', duration: 4, memo: '' } // 新しい行の4拍
      ];

      const rows = splitChordsIntoRows(chords, 8, 4);
      
      expect(rows).toHaveLength(2);
      expect(rows[0].map(c => c.name)).toEqual(['C']);
      expect(rows[1].map(c => c.name)).toEqual(['F']);
    });

    it('空のコード配列を正しく処理する', () => {
      const rows = splitChordsIntoRows([], 8, 4);
      
      expect(rows).toHaveLength(0);
    });

    it('改行マーカーのみの配列を正しく処理する', () => {
      const chords: Chord[] = [
        createLineBreakMarker(),
        createLineBreakMarker()
      ];

      const rows = splitChordsIntoRows(chords, 8, 4);
      
      expect(rows).toHaveLength(0);
    });
  });
});