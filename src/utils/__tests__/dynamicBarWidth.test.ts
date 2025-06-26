import { describe, expect, test } from 'vitest';
import { 
  analyzeBarContent, 
  calculateDynamicBarWidth, 
  calculateBarWidth,
  calculateChordWidthWithFontSize,
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

    test('フォントサイズを指定した場合、それに応じた幅が計算される', () => {
      const chords: Chord[] = createTestChords([
        { name: 'C', root: 'C' },
        { name: 'Am', root: 'A' },
        { name: 'F', root: 'F' },
        { name: 'G', root: 'G' },
      ]);
      
      // フォントサイズ10px（最小）
      const widthSmall = calculateBarWidth(chords, 4, 10);
      
      // フォントサイズ14px（デフォルト）
      const widthDefault = calculateBarWidth(chords, 4, 14);
      
      // フォントサイズ20px
      const widthLarge = calculateBarWidth(chords, 4, 20);
      
      // フォントサイズが大きいほど幅も大きくなる
      expect(widthSmall).toBeLessThanOrEqual(widthDefault);
      expect(widthDefault).toBeLessThan(widthLarge);
      
      // 具体的な値も確認（10px時は各コード約33px、20px時は約67px）
      const expectedSmall = Math.round((10 / 14) * 47) * 4 + 8; // 約142px
      const expectedLarge = Math.round((20 / 14) * 47) * 4 + 8; // 約276px
      
      expect(widthSmall).toBeGreaterThanOrEqual(expectedSmall);
      expect(widthLarge).toBeGreaterThanOrEqual(expectedLarge);
    });
  });

  describe('calculateChordWidthWithFontSize', () => {
    test('基本的なコードの幅計算', () => {
      const chord: Chord = createTestChords([{ name: 'C', root: 'C' }])[0];
      
      // デフォルトフォントサイズ（14px）
      const width = calculateChordWidthWithFontSize(chord);
      expect(width).toBe(47); // ベース幅のみ
      
      // フォントサイズ10px
      const widthSmall = calculateChordWidthWithFontSize(chord, 10);
      expect(widthSmall).toBe(Math.round((10 / 14) * 47)); // 約34px
      
      // フォントサイズ20px
      const widthLarge = calculateChordWidthWithFontSize(chord, 20);
      expect(widthLarge).toBe(Math.round((20 / 14) * 47)); // 約67px
    });

    test('長いコード名の幅計算', () => {
      const chord: Chord = createTestChords([{ name: 'Cmaj7', root: 'C' }])[0];
      
      // デフォルトフォントサイズ（14px）
      const width = calculateChordWidthWithFontSize(chord);
      // ベース幅47 + (5文字 - 3) * 5 = 47 + 10 = 57
      expect(width).toBe(57);
      
      // フォントサイズ20px
      const widthLarge = calculateChordWidthWithFontSize(chord, 20);
      // 20/14 * 57 = 81.42... → 81
      expect(widthLarge).toBe(81);
    });

    test('ベース音付きコードの幅計算', () => {
      const chord: Chord = createTestChords([{ name: 'C', root: 'C', base: 'E' }])[0];
      
      // デフォルトフォントサイズ（14px）
      const width = calculateChordWidthWithFontSize(chord);
      // ベース幅47 + (3文字 - 3) * 5 = 47 + 0 = 47
      expect(width).toBe(47);
      
      // 長いベース音付き
      const longChord: Chord = createTestChords([{ name: 'Am7', root: 'A', base: 'C' }])[0];
      const widthLong = calculateChordWidthWithFontSize(longChord);
      // ベース幅47 + (5文字 - 3) * 5 = 47 + 10 = 57
      expect(widthLong).toBe(57);
    });

    test('メモ付きコードの幅計算', () => {
      const chord: Chord = createTestChords([{ name: 'C', root: 'C', memo: '短いメモ' }])[0];
      
      // デフォルトフォントサイズ（14px）
      const width = calculateChordWidthWithFontSize(chord);
      // ベース幅47 + メモボーナス max(20, 4文字 * 12) = 47 + 48 = 95 (日本語なので12倍)
      expect(width).toBe(95);
      
      // 長いメモ
      const longMemoChord: Chord = createTestChords([{ name: 'C', root: 'C', memo: 'これは非常に長いメモです' }])[0];
      const widthLongMemo = calculateChordWidthWithFontSize(longMemoChord);
      // ベース幅47 + メモボーナス max(20, 12文字 * 12) = 47 + 144 = 191
      expect(widthLongMemo).toBe(191);
      
      // フォントサイズ20pxでの長いメモ
      const widthLargeFontLongMemo = calculateChordWidthWithFontSize(longMemoChord, 20);
      // ベース幅67 + メモボーナス max(20, 12 * (20/14) * 12) = 67 + 206 = 273
      expect(widthLargeFontLongMemo).toBe(273);
    });

    test('複雑なコード（長い名前、ベース音、メモ）の幅計算', () => {
      const chord: Chord = createTestChords([{ 
        name: 'Cmaj7', 
        root: 'C', 
        base: 'E', 
        memo: 'アルペジオで' 
      }])[0];
      
      // デフォルトフォントサイズ（14px）
      const width = calculateChordWidthWithFontSize(chord);
      // ベース幅47 + 名前ボーナス(7文字 - 3) * 5 = 47 + 20 = 67
      // + メモボーナス max(20, 6文字 * 12) = 72 (マルチバイト文字)
      // = 139
      expect(width).toBe(139);
      
      // フォントサイズでスケーリング
      const widthSmall = calculateChordWidthWithFontSize(chord, 10);
      const widthLarge = calculateChordWidthWithFontSize(chord, 20);
      
      // フォントサイズに比例して幅が変化
      expect(widthSmall).toBeLessThan(width);
      expect(widthLarge).toBeGreaterThan(width);
    });

    test('マルチバイト文字（日本語）vs ASCII文字のメモ幅計算', () => {
      // 日本語メモ
      const chordJapanese: Chord = createTestChords([{ 
        name: 'C', 
        root: 'C', 
        memo: 'ストローク' // 5文字
      }])[0];
      
      // ASCII文字メモ（同じ文字数）
      const chordAscii: Chord = createTestChords([{ 
        name: 'C', 
        root: 'C', 
        memo: 'strum' // 5文字
      }])[0];
      
      const widthJapanese = calculateChordWidthWithFontSize(chordJapanese);
      const widthAscii = calculateChordWidthWithFontSize(chordAscii);
      
      // 日本語の方が幅が大きい
      expect(widthJapanese).toBeGreaterThan(widthAscii);
      
      // 日本語: 47 + max(20, 5 * 12) = 47 + 60 = 107
      expect(widthJapanese).toBe(107);
      
      // ASCII: 47 + max(20, 5 * 5) = 47 + 25 = 72
      expect(widthAscii).toBe(72);
    });

    test('混在メモ（日本語+ASCII）の幅計算', () => {
      const chord: Chord = createTestChords([{ 
        name: 'C', 
        root: 'C', 
        memo: 'down ダウン' // 混在
      }])[0];
      
      const width = calculateChordWidthWithFontSize(chord);
      
      // マルチバイト文字が1つでも含まれていれば12倍
      // 47 + max(20, 8文字 * 12) = 47 + 96 = 143
      expect(width).toBe(143);
    });
  });
});