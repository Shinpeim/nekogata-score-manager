import { describe, it, expect } from 'vitest';
import { 
  extractChordRoot, 
  parseOnChord, 
  isOnChord,
  parseChordInput
} from '../chordParsing';

describe('chordParsing', () => {
  describe('extractChordRoot', () => {
    it('should extract root from simple chords', () => {
      expect(extractChordRoot('C')).toBe('C');
      expect(extractChordRoot('Am')).toBe('A');
      expect(extractChordRoot('F#')).toBe('F#');
      expect(extractChordRoot('Bb')).toBe('B♭');
      expect(extractChordRoot('D♭')).toBe('D♭');
    });

    it('should handle complex chord names', () => {
      expect(extractChordRoot('C7')).toBe('C');
      expect(extractChordRoot('Am7')).toBe('A');
      expect(extractChordRoot('F#maj7')).toBe('F#');
      expect(extractChordRoot('Bbm7(b5)')).toBe('B♭');
    });

    it('should return default for invalid input', () => {
      expect(extractChordRoot('')).toBe('C');
      expect(extractChordRoot('invalid')).toBe('C');
    });
  });

  describe('parseOnChord', () => {
    it('should parse on-chords correctly', () => {
      expect(parseOnChord('C/E')).toEqual({ chord: 'C', base: 'E' });
      expect(parseOnChord('Am7/G')).toEqual({ chord: 'Am7', base: 'G' });
      expect(parseOnChord('F#m/C#')).toEqual({ chord: 'F#m', base: 'C#' });
      expect(parseOnChord('Bb/D')).toEqual({ chord: 'Bb', base: 'D' });
    });

    it('should handle non-on-chords', () => {
      expect(parseOnChord('C')).toEqual({ chord: 'C' });
      expect(parseOnChord('Am7')).toEqual({ chord: 'Am7' });
    });

    it('should normalize flat symbols', () => {
      expect(parseOnChord('Bb/Db')).toEqual({ chord: 'Bb', base: 'D♭' });
    });
  });

  describe('isOnChord', () => {
    it('should identify on-chords correctly', () => {
      expect(isOnChord('C/E')).toBe(true);
      expect(isOnChord('Am7/G')).toBe(true);
      expect(isOnChord('F#m/C#')).toBe(true);
    });

    it('should identify non-on-chords correctly', () => {
      expect(isOnChord('C')).toBe(false);
      expect(isOnChord('Am7')).toBe(false);
      expect(isOnChord('F#m')).toBe(false);
    });
  });

  describe('parseChordInput', () => {
    describe('duration syntax [n]', () => {
      it('should parse chords with integer duration', () => {
        const result = parseChordInput('C[2]');
        expect(result).toEqual({
          name: 'C',
          root: 'C',
          duration: 2,
          memo: ''
        });
      });

      it('should parse chords with decimal duration', () => {
        const result = parseChordInput('Am[1.5]');
        expect(result).toEqual({
          name: 'Am',
          root: 'A',
          duration: 1.5,
          memo: ''
        });
      });

      it('should parse complex chords with duration', () => {
        const result = parseChordInput('E7(#9)[2]');
        expect(result).toEqual({
          name: 'E7(#9)',
          root: 'E',
          duration: 2,
          memo: ''
        });
      });

      it('should parse on-chords with duration', () => {
        const result = parseChordInput('C/E[4]');
        expect(result).toEqual({
          name: 'C',
          root: 'C',
          base: 'E',
          duration: 4,
          memo: ''
        });
      });

      it('should handle invalid durations gracefully', () => {
        // 無効な拍数の場合、デフォルト拍数で受け入れる
        expect(parseChordInput('C[0]')).toEqual({
          name: 'C',
          root: 'C',
          base: undefined,
          duration: 4,
          memo: ''
        });
        expect(parseChordInput('C[-1]')).toEqual({
          name: 'C',
          root: 'C',
          base: undefined,
          duration: 4,
          memo: ''
        });
        expect(parseChordInput('C[17]')).toEqual({
          name: 'C',
          root: 'C',
          base: undefined,
          duration: 4,
          memo: ''
        });
        expect(parseChordInput('C[abc]')).toEqual({
          name: 'C[abc]',
          root: 'C',
          base: undefined,
          duration: 4,
          memo: ''
        });
      });
    });

    describe('default duration', () => {
      it('should use default duration when no duration specified', () => {
        const result = parseChordInput('C', 8);
        expect(result).toEqual({
          name: 'C',
          root: 'C',
          duration: 8,
          memo: ''
        });
      });

      it('should use default duration of 4 when not specified', () => {
        const result = parseChordInput('Am');
        expect(result).toEqual({
          name: 'Am',
          root: 'A',
          duration: 4,
          memo: ''
        });
      });
    });

    describe('complex chord names', () => {
      it('should parse various chord types', () => {
        const testCases = [
          { input: 'Cmaj7', expected: { name: 'Cmaj7', root: 'C' } },
          { input: 'Am7', expected: { name: 'Am7', root: 'A' } },
          { input: 'F#m', expected: { name: 'F#m', root: 'F#' } },
          { input: 'Bb7', expected: { name: 'Bb7', root: 'B♭' } },
          { input: 'Ddim', expected: { name: 'Ddim', root: 'D' } },
          { input: 'Gaug', expected: { name: 'Gaug', root: 'G' } },
          { input: 'Csus4', expected: { name: 'Csus4', root: 'C' } },
          { input: 'Asus2', expected: { name: 'Asus2', root: 'A' } },
          { input: 'Cadd9', expected: { name: 'Cadd9', root: 'C' } }
        ];

        for (const { input, expected } of testCases) {
          const result = parseChordInput(input);
          expect(result?.name).toBe(expected.name);
          expect(result?.root).toBe(expected.root);
          expect(result?.duration).toBe(4);
        }
      });

      it('should parse tension chords', () => {
        const result = parseChordInput('C7(b5)');
        expect(result).toEqual({
          name: 'C7(b5)',
          root: 'C',
          duration: 4,
          memo: ''
        });
      });
    });

    describe('edge cases', () => {
      it('should handle empty input', () => {
        expect(parseChordInput('')).toBeNull();
        expect(parseChordInput('   ')).toBeNull();
      });

      it('should accept any non-empty text', () => {
        expect(parseChordInput('invalid')).toEqual({
          name: 'invalid',
          root: 'C',
          duration: 4,
          memo: ''
        });
        expect(parseChordInput('123')).toEqual({
          name: '123',
          root: 'C',
          duration: 4,
          memo: ''
        });
      });

      it('should normalize flat symbols', () => {
        const result = parseChordInput('Bb/Db[2]');
        expect(result).toEqual({
          name: 'Bb',
          root: 'B♭',
          base: 'D♭',
          duration: 2,
          memo: ''
        });
      });
    });

    describe('integration with existing functionality', () => {
      it('should work with textToChords patterns', () => {
        // 一括入力でよく使われるパターンをテスト
        const patterns = [
          'C[4]',
          'F[2]',
          'G[2]',
          'Am[4]',
          'E7(#9)[2]',
          'C/E[1.5]'
        ];

        for (const pattern of patterns) {
          const result = parseChordInput(pattern);
          expect(result).not.toBeNull();
          expect(typeof result?.duration).toBe('number');
          expect(result?.duration).toBeGreaterThan(0);
        }
      });

      it('should work with single chord input patterns', () => {
        // 個別入力でよく使われるパターンをテスト
        const patterns = [
          'C',
          'Am',
          'F#m',
          'Bb7',
          'C/E',
          'Am7/G'
        ];

        for (const pattern of patterns) {
          const result = parseChordInput(pattern);
          expect(result).not.toBeNull();
          expect(result?.duration).toBe(4); // デフォルト拍数
        }
      });
    });

    describe('free text input (tolerant input)', () => {
      it('should accept any text as chord input', () => {
        const freeTextPatterns = [
          { input: '練習', expectedRoot: 'C' },
          { input: '休符', expectedRoot: 'C' },
          { input: 'ブレイク', expectedRoot: 'C' }, // 日本語なのでマッチしない
          { input: 'rest', expectedRoot: 'C' },
          { input: 'break', expectedRoot: 'B' }, // 小文字のbが抽出されて大文字に正規化
          { input: 'memo', expectedRoot: 'C' },
          { input: '????', expectedRoot: 'C' },
          { input: '123', expectedRoot: 'C' },
          { input: 'テスト', expectedRoot: 'C' }
        ];

        for (const { input, expectedRoot } of freeTextPatterns) {
          const result = parseChordInput(input);
          expect(result).not.toBeNull();
          expect(result?.name).toBe(input);
          expect(result?.duration).toBe(4); // デフォルト拍数
          // デバッグ用ログ
          if (result?.root !== expectedRoot) {
            console.log(`Input: "${input}", Expected: "${expectedRoot}", Actual: "${result?.root}"`);
          }
          // 一部のパターンで予期しないroot値が返される可能性があるため、実際の値をチェック
          expect(result?.root).toBe(expectedRoot);
        }
      });

      it('should debug specific problematic patterns', () => {
        // 'break' パターンのデバッグ
        console.log('=== Debug break pattern ===');
        const parsed = parseOnChord('break');
        console.log('parseOnChord("break"):', parsed);
        
        const root = extractChordRoot(parsed.chord);
        console.log('extractChordRoot(parsed.chord):', root);
        
        const result = parseChordInput('break');
        console.log('parseChordInput("break") result:', result);
        
        // 期待値: breakの小文字のbが抽出されて大文字に正規化
        expect(result?.root).toBe('B');
      });

      it('should accept free text with duration notation', () => {
        const testCases = [
          { input: '練習[2]', expectedName: '練習', expectedDuration: 2 },
          { input: 'rest[4]', expectedName: 'rest', expectedDuration: 4 },
          { input: 'ブレイク[1.5]', expectedName: 'ブレイク', expectedDuration: 1.5 },
          { input: '???[8]', expectedName: '???', expectedDuration: 8 }
        ];

        for (const { input, expectedName, expectedDuration } of testCases) {
          const result = parseChordInput(input);
          expect(result).not.toBeNull();
          expect(result?.name).toBe(expectedName);
          expect(result?.duration).toBe(expectedDuration);
        }
      });

      it('should handle invalid duration gracefully in free text', () => {
        // 数値以外が拍数部分にある場合、全体をnameとして扱う
        const result = parseChordInput('練習[abc]');
        expect(result).not.toBeNull();
        expect(result?.name).toBe('練習[abc]');
        expect(result?.duration).toBe(4); // デフォルト拍数
      });
    });
  });
});