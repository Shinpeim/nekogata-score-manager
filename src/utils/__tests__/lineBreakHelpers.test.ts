import { describe, it, expect } from 'vitest';
import { 
  createLineBreakMarker, 
  filterNormalChords, 
  splitChordsIntoRows 
} from '../lineBreakHelpers';
import type { Chord } from '../../types';
import { createTestChord, createTestChords } from '../../test-utils/chord-test-helpers';

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
      const normalChord: Chord = createTestChord({ name: 'C', root: 'C', duration: 4 });
      
      expect(lineBreak.isLineBreak === true).toBe(true);
      expect(normalChord.isLineBreak === true).toBe(false);
    });

    it('isLineBreakが未定義のコードを通常コードとして判定する', () => {
      const chord: Chord = createTestChord({ name: 'Am', root: 'A', duration: 2 });
      
      expect(chord.isLineBreak === true).toBe(false);
    });
  });

  describe('filterNormalChords', () => {
    it('改行マーカーを除外して通常のコードのみを返す', () => {
      const chords: Chord[] = [
        createTestChord({ name: 'C', root: 'C', duration: 4 }),
        createLineBreakMarker(),
        createTestChord({ name: 'F', root: 'F', duration: 4 }),
        createTestChord({ name: 'G', root: 'G', duration: 4 }),
        createLineBreakMarker(),
        createTestChord({ name: 'Am', root: 'A', duration: 4 })
      ];

      const normalChords = filterNormalChords(chords);
      
      expect(normalChords).toHaveLength(4);
      expect(normalChords.map(c => c.name)).toEqual(['C', 'F', 'G', 'Am']);
    });

    it('改行マーカーがない場合はそのまま返す', () => {
      const chords: Chord[] = createTestChords([
        { name: 'C', root: 'C', duration: 4 },
        { name: 'F', root: 'F', duration: 4 }
      ]);

      const result = filterNormalChords(chords);
      
      expect(result).toEqual(chords);
    });
  });

  describe('splitChordsIntoRows', () => {
    it('改行マーカーで行を分割する', () => {
      const chords: Chord[] = [
        createTestChord({ name: 'C', root: 'C', duration: 4 }),
        createTestChord({ name: 'F', root: 'F', duration: 4 }),
        createLineBreakMarker(),
        createTestChord({ name: 'G', root: 'G', duration: 4 }),
        createTestChord({ name: 'Am', root: 'A', duration: 4 })
      ];

      const rows = splitChordsIntoRows(chords, 8, 4);
      
      expect(rows).toHaveLength(2);
      expect(rows[0].map(c => c.name)).toEqual(['C', 'F']);
      expect(rows[1].map(c => c.name)).toEqual(['G', 'Am']);
    });

    it('改行マーカーがない場合は小節数制限で分割', () => {
      const chords: Chord[] = createTestChords([
        { name: 'C', root: 'C', duration: 4 }, // 1小節
        { name: 'F', root: 'F', duration: 4 }, // 1小節
        { name: 'G', root: 'G', duration: 4 }, // 1小節
        { name: 'Am', root: 'A', duration: 4 } // 1小節
      ]);

      const rows = splitChordsIntoRows(chords, 2, 4); // 2小節/行

      expect(rows).toHaveLength(2);
      expect(rows[0].map(c => c.name)).toEqual(['C', 'F']);
      expect(rows[1].map(c => c.name)).toEqual(['G', 'Am']);
    });

    it('複数の拍数のコードを正しく処理する', () => {
      const chords: Chord[] = createTestChords([
        { name: 'C', root: 'C', duration: 2 }, // 2拍
        { name: 'F', root: 'F', duration: 2 }, // 2拍 = 1小節完了
        { name: 'G', root: 'G', duration: 1 }, // 1拍
        { name: 'Am', root: 'A', duration: 3 } // 3拍 = 1小節完了
      ]);

      const rows = splitChordsIntoRows(chords, 2, 4); // 2小節/行

      expect(rows).toHaveLength(1);
      expect(rows[0].map(c => c.name)).toEqual(['C', 'F', 'G', 'Am']);
    });

    it('改行マーカーが連続している場合を正しく処理する', () => {
      const chords: Chord[] = [
        createTestChord({ name: 'C', root: 'C', duration: 4 }),
        createLineBreakMarker(),
        createLineBreakMarker(),
        createTestChord({ name: 'F', root: 'F', duration: 4 })
      ];

      const rows = splitChordsIntoRows(chords, 8, 4);
      
      expect(rows).toHaveLength(2);
      expect(rows[0].map(c => c.name)).toEqual(['C']);
      expect(rows[1].map(c => c.name)).toEqual(['F']);
    });

    it('小節の途中で改行マーカーがある場合を正しく処理する', () => {
      const chords: Chord[] = [
        createTestChord({ name: 'C', root: 'C', duration: 2 }), // 2拍
        createLineBreakMarker(),
        createTestChord({ name: 'F', root: 'F', duration: 4 }) // 新しい行の4拍
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