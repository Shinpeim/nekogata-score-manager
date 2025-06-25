import { describe, expect, test } from 'vitest';
import { 
  analyzeBarContent, 
  calculateDynamicBarWidth, 
  calculateBarWidth,
  DYNAMIC_BAR_WIDTH_CONFIG 
} from '../dynamicBarWidth';
import type { Chord } from '../../types';
import { createTestChords } from '../../test-utils/chord-test-helpers';

describe('dynamicBarWidth', () => {
  describe('analyzeBarContent', () => {
    test('空の小節を正しく分析する', () => {
      const result = analyzeBarContent([]);
      expect(result).toEqual({
        chordCount: 0,
        hasLongMemo: false,
        maxMemoLength: 0,
        longestChordName: 0,
      });
    });

    test('基本的なコードを分析する', () => {
      const chords: Chord[] = createTestChords([
        { name: 'C', root: 'C' },
        { name: 'F', root: 'F' },
        { name: 'G', root: 'G' },
        { name: 'C', root: 'C' },
      ]);
      
      const result = analyzeBarContent(chords);
      expect(result).toEqual({
        chordCount: 4,
        hasLongMemo: false,
        maxMemoLength: 0,
        longestChordName: 1,
      });
    });

    test('メモ付きコードを分析する', () => {
      const chords: Chord[] = createTestChords([
        { name: 'C', root: 'C', memo: '短いメモ' },
        { name: 'F', root: 'F', memo: 'これは長いメモです' },
      ]);
      
      const result = analyzeBarContent(chords);
      expect(result).toEqual({
        chordCount: 2,
        hasLongMemo: true,
        maxMemoLength: 9, // 'これは長いメモです'の文字数
        longestChordName: 1,
      });
    });

    test('ベース音付きコードを分析する', () => {
      const chords: Chord[] = createTestChords([
        { name: 'C', root: 'C', base: 'E' },
        { name: 'F7', root: 'F', base: 'A' },
      ]);
      
      const result = analyzeBarContent(chords);
      expect(result).toEqual({
        chordCount: 2,
        hasLongMemo: false,
        maxMemoLength: 0,
        longestChordName: 4, // 'F7/A'の文字数
      });
    });

    test('複雑なコードとメモの組み合わせを分析する', () => {
      const chords: Chord[] = createTestChords([
        { name: 'Cmaj7', root: 'C', memo: '普通のメモ' },
        { name: 'Am7', root: 'A', base: 'C', memo: 'とても長いメモテキストです' },
        { name: 'F', root: 'F' },
      ]);
      
      const result = analyzeBarContent(chords);
      expect(result).toEqual({
        chordCount: 3,
        hasLongMemo: true,
        maxMemoLength: 13, // 'とても長いメモテキストです'の文字数
        longestChordName: 5, // 'Am7/C'の文字数
      });
    });
  });

  describe('calculateDynamicBarWidth', () => {
    test('空の小節は最小幅になる', () => {
      const analysis = {
        chordCount: 0,
        hasLongMemo: false,
        maxMemoLength: 0,
        longestChordName: 0,
      };
      
      const width = calculateDynamicBarWidth(analysis);
      expect(width).toBe(DYNAMIC_BAR_WIDTH_CONFIG.BASE_MIN_WIDTH);
    });

    test('コード数に応じて幅が増加する', () => {
      const analysis = {
        chordCount: 4,
        hasLongMemo: false,
        maxMemoLength: 0,
        longestChordName: 1,
      };
      
      const width = calculateDynamicBarWidth(analysis);
      const expectedWidth = DYNAMIC_BAR_WIDTH_CONFIG.BASE_MIN_WIDTH + 
                           (4 * DYNAMIC_BAR_WIDTH_CONFIG.WIDTH_PER_CHORD);
      expect(width).toBe(expectedWidth);
    });

    test('メモ長に応じて幅が増加する', () => {
      const analysis = {
        chordCount: 2,
        hasLongMemo: false,
        maxMemoLength: 5,
        longestChordName: 1,
      };
      
      const width = calculateDynamicBarWidth(analysis);
      const expectedWidth = DYNAMIC_BAR_WIDTH_CONFIG.BASE_MIN_WIDTH + 
                           (2 * DYNAMIC_BAR_WIDTH_CONFIG.WIDTH_PER_CHORD) +
                           (5 * DYNAMIC_BAR_WIDTH_CONFIG.WIDTH_PER_MEMO_CHAR);
      expect(width).toBe(expectedWidth);
    });

    test('長いメモボーナスが適用される', () => {
      const analysis = {
        chordCount: 2,
        hasLongMemo: true,
        maxMemoLength: 10,
        longestChordName: 1,
      };
      
      const width = calculateDynamicBarWidth(analysis);
      const expectedWidth = DYNAMIC_BAR_WIDTH_CONFIG.BASE_MIN_WIDTH + 
                           (2 * DYNAMIC_BAR_WIDTH_CONFIG.WIDTH_PER_CHORD) +
                           (10 * DYNAMIC_BAR_WIDTH_CONFIG.WIDTH_PER_MEMO_CHAR) +
                           DYNAMIC_BAR_WIDTH_CONFIG.LONG_MEMO_BONUS;
      expect(width).toBe(expectedWidth);
    });

    test('最大幅を超える場合は制限される', () => {
      const analysis = {
        chordCount: 20,
        hasLongMemo: true,
        maxMemoLength: 50,
        longestChordName: 10,
      };
      
      const width = calculateDynamicBarWidth(analysis);
      expect(width).toBe(DYNAMIC_BAR_WIDTH_CONFIG.BASE_MAX_WIDTH);
    });
  });

  describe('calculateBarWidth', () => {
    test('実際のコード配列から幅を計算する', () => {
      const chords: Chord[] = createTestChords([
        { name: 'C', root: 'C' },
        { name: 'Am', root: 'A', memo: '短いメモ' },
        { name: 'F', root: 'F' },
        { name: 'G', root: 'G' },
      ]);
      
      const width = calculateBarWidth(chords, 4);
      
      // 従来の動的幅計算
      // BASE_MIN_WIDTH: 50 + (4 * WIDTH_PER_CHORD: 18) + (4 * WIDTH_PER_MEMO_CHAR: 5) = 50 + 72 + 20 = 142px
      // メモがあるので: 142 + LONG_MEMO_BONUS: 50 = 192px（但し、メモが8文字未満なのでボーナスなし）
      // 実際: 50 + 72 + 20 = 142px
      
      // 実際必要幅（各コードに最低47px、パディング8px）
      const expectedRequiredWidth = (47 * 4) + 8; // 196px
      
      // 実際の動的幅計算結果を確認
      expect(width).toBeGreaterThanOrEqual(expectedRequiredWidth);
    });

    test('空の配列では最小幅を返す', () => {
      const width = calculateBarWidth([], 4);
      expect(width).toBe(DYNAMIC_BAR_WIDTH_CONFIG.BASE_MIN_WIDTH);
    });

    test('短いコードが多い場合は必要幅が採用される', () => {
      const chords: Chord[] = createTestChords([
        { name: 'C', root: 'C', duration: 0.5 },
        { name: 'F', root: 'F', duration: 0.5 },
        { name: 'G', root: 'G', duration: 0.5 },
        { name: 'C', root: 'C', duration: 2.5 },
      ]);
      
      const width = calculateBarWidth(chords, 4);
      
      // 各コード47px + パディング8px = 196px
      expect(width).toBeGreaterThanOrEqual(196);
    });
  });
});