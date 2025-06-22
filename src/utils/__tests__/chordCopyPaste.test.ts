import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Chord } from '../../types';
import {
  chordsToText,
  textToChords,
  isValidChordProgression,
  copyChordProgressionToClipboard,
  pasteChordProgressionFromClipboard
} from '../chordCopyPaste';

describe('chordCopyPaste', () => {
  describe('chordsToText', () => {
    it('should convert simple chords to text', () => {
      const chords: Chord[] = [
        { name: 'C', root: 'C', duration: 4, memo: '' },
        { name: 'F', root: 'F', duration: 4, memo: '' },
        { name: 'G', root: 'G', duration: 4, memo: '' },
        { name: 'Am', root: 'A', duration: 4, memo: '' }
      ];

      const result = chordsToText(chords);
      expect(result).toBe('C[4] F[4] G[4] Am[4]');
    });

    it('should convert chords with different durations', () => {
      const chords: Chord[] = [
        { name: 'C', root: 'C', duration: 2, memo: '' },
        { name: 'F', root: 'F', duration: 2, memo: '' },
        { name: 'G', root: 'G', duration: 4, memo: '' }
      ];

      const result = chordsToText(chords);
      expect(result).toBe('C[2] F[2] G[4]');
    });

    it('should convert chords with decimal durations', () => {
      const chords: Chord[] = [
        { name: 'C', root: 'C', duration: 1.5, memo: '' },
        { name: 'F', root: 'F', duration: 2.5, memo: '' }
      ];

      const result = chordsToText(chords);
      expect(result).toBe('C[1.5] F[2.5]');
    });

    it('should include line breaks as |', () => {
      const chords: Chord[] = [
        { name: 'C', root: 'C', duration: 4, memo: '' },
        { name: '__LINE_BREAK__', root: '', isLineBreak: true, memo: '' },
        { name: 'F', root: 'F', duration: 4, memo: '' }
      ];

      const result = chordsToText(chords);
      expect(result).toBe('C[4] | F[4]');
    });

    it('should handle default duration', () => {
      const chords: Chord[] = [
        { name: 'C', root: 'C', memo: '' },
        { name: 'F', root: 'F', duration: undefined, memo: '' }
      ];

      const result = chordsToText(chords);
      expect(result).toBe('C[4] F[4]');
    });
  });

  describe('textToChords', () => {
    it('should parse simple chord names', () => {
      const result = textToChords('C F G Am');
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ name: 'C', root: 'C', duration: 4, memo: '' });
      expect(result[1]).toEqual({ name: 'F', root: 'F', duration: 4, memo: '' });
      expect(result[2]).toEqual({ name: 'G', root: 'G', duration: 4, memo: '' });
      expect(result[3]).toEqual({ name: 'Am', root: 'A', duration: 4, memo: '' });
    });

    it('should parse chords with bracket durations and normalize roots', () => {
      const result = textToChords('C[2] Bb[2] G[4]');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: 'C', root: 'C', duration: 2, memo: '' });
      expect(result[1]).toEqual({ name: 'Bb', root: 'B♭', duration: 2, memo: '' });
      expect(result[2]).toEqual({ name: 'G', root: 'G', duration: 4, memo: '' });
    });


    it('should parse decimal durations with brackets', () => {
      const result = textToChords('C[1.5] F[2.5]');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: 'C', root: 'C', duration: 1.5, memo: '' });
      expect(result[1]).toEqual({ name: 'F', root: 'F', duration: 2.5, memo: '' });
    });


    it('should parse line breaks', () => {
      const result = textToChords('C F | G Am');
      
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ name: 'C', root: 'C', duration: 4, memo: '' });
      expect(result[1]).toEqual({ name: 'F', root: 'F', duration: 4, memo: '' });
      expect(result[2]).toEqual({ name: '__LINE_BREAK__', root: '', isLineBreak: true, memo: '' });
      expect(result[3]).toEqual({ name: 'G', root: 'G', duration: 4, memo: '' });
      expect(result[4]).toEqual({ name: 'Am', root: 'A', duration: 4, memo: '' });
    });

    it('should handle complex chord names', () => {
      const result = textToChords('C7 Dm7 G7 Cmaj7');
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ name: 'C7', root: 'C', duration: 4, memo: '' });
      expect(result[1]).toEqual({ name: 'Dm7', root: 'D', duration: 4, memo: '' });
      expect(result[2]).toEqual({ name: 'G7', root: 'G', duration: 4, memo: '' });
      expect(result[3]).toEqual({ name: 'Cmaj7', root: 'C', duration: 4, memo: '' });
    });

    it('should handle sharp and flat chords with root normalization', () => {
      const result = textToChords('C# F# Bb Eb');
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ name: 'C#', root: 'C#', duration: 4, memo: '' });
      expect(result[1]).toEqual({ name: 'F#', root: 'F#', duration: 4, memo: '' });
      expect(result[2]).toEqual({ name: 'Bb', root: 'B♭', duration: 4, memo: '' });
      expect(result[3]).toEqual({ name: 'Eb', root: 'E♭', duration: 4, memo: '' });
    });

    it('should handle flat symbol (♭) in addition to b', () => {
      const result = textToChords('B♭ E♭ A♭ D♭');
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ name: 'B♭', root: 'B♭', duration: 4, memo: '' });
      expect(result[1]).toEqual({ name: 'E♭', root: 'E♭', duration: 4, memo: '' });
      expect(result[2]).toEqual({ name: 'A♭', root: 'A♭', duration: 4, memo: '' });
      expect(result[3]).toEqual({ name: 'D♭', root: 'D♭', duration: 4, memo: '' });
    });

    it('should handle mixed b and ♭ symbols with duration brackets', () => {
      const result = textToChords('Bb[2] E♭m7[4] Ab[1.5]');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: 'Bb', root: 'B♭', duration: 2, memo: '' });
      expect(result[1]).toEqual({ name: 'E♭m7', root: 'E♭', duration: 4, memo: '' });
      expect(result[2]).toEqual({ name: 'Ab', root: 'A♭', duration: 1.5, memo: '' });
    });

    it('should handle flat symbol (♭) in tension chords', () => {
      const result = textToChords('E♭7(♭9)[2] B♭7(♭5)[4]');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: 'E♭7(♭9)', root: 'E♭', duration: 2, memo: '' });
      expect(result[1]).toEqual({ name: 'B♭7(♭5)', root: 'B♭', duration: 4, memo: '' });
    });

    it('should handle tension chords with bracket notation and normalize roots', () => {
      const result = textToChords('E7(#9)[2] Bb7(b5)[4] Am7(11)[1]');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: 'E7(#9)', root: 'E', duration: 2, memo: '' });
      expect(result[1]).toEqual({ name: 'Bb7(b5)', root: 'B♭', duration: 4, memo: '' });
      expect(result[2]).toEqual({ name: 'Am7(11)', root: 'A', duration: 1, memo: '' });
    });

    it('should handle complex tension chords with root normalization', () => {
      const result = textToChords('Eb7(#9) Bb7(b5) Am7(11)');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: 'Eb7(#9)', root: 'E♭', duration: 4, memo: '' });
      expect(result[1]).toEqual({ name: 'Bb7(b5)', root: 'B♭', duration: 4, memo: '' });
      expect(result[2]).toEqual({ name: 'Am7(11)', root: 'A', duration: 4, memo: '' });
    });

    it('should ignore empty parts', () => {
      const result = textToChords('C   F  G     Am');
      
      expect(result).toHaveLength(4);
    });

    it('should accept all text input including non-musical terms', () => {
      const result = textToChords('Bb invalid Eb');
      
      // 寛容な入力により、「invalid」も受け入れられる
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: 'Bb', root: 'B♭', duration: 4, memo: '' });
      expect(result[1]).toEqual({ name: 'invalid', root: 'C', duration: 4, memo: '' });
      expect(result[2]).toEqual({ name: 'Eb', root: 'E♭', duration: 4, memo: '' });
    });
  });

  describe('isValidChordProgression', () => {
    it('should return true for valid chord progressions', () => {
      expect(isValidChordProgression('C F G Am')).toBe(true);
      expect(isValidChordProgression('C[2] F[2] G[4]')).toBe(true);
      expect(isValidChordProgression('C F | G Am')).toBe(true);
      expect(isValidChordProgression('E7(#9)[2] C7(b5)[4]')).toBe(true);
    });

    it('should return false for empty progressions', () => {
      expect(isValidChordProgression('')).toBe(false);
      expect(isValidChordProgression('   ')).toBe(false);
    });

    it('should return true for any non-empty text (tolerant input)', () => {
      // 寛容な入力により、どんなテキストでも有効として扱われる
      expect(isValidChordProgression('invalid text')).toBe(true);
      expect(isValidChordProgression('練習 休符')).toBe(true);
      expect(isValidChordProgression('123 456')).toBe(true);
    });

    it('should return true for mixed valid/invalid input', () => {
      expect(isValidChordProgression('C invalid F')).toBe(true);
    });
  });

  describe('clipboard functions', () => {
    const mockWriteText = vi.fn();
    const mockReadText = vi.fn();

    beforeEach(() => {
      // Clipboard API をモック
      Object.defineProperty(globalThis.navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
          readText: mockReadText,
        },
        writable: true,
      });
      
      mockWriteText.mockClear();
      mockReadText.mockClear();
    });

    describe('copyChordProgressionToClipboard', () => {
      it('should copy chord progression to clipboard', async () => {
        mockWriteText.mockResolvedValue(undefined);
        
        const chords: Chord[] = [
          { name: 'C', root: 'C', duration: 4, memo: '' },
          { name: 'F', root: 'F', duration: 4, memo: '' }
        ];

        const result = await copyChordProgressionToClipboard(chords);

        expect(result).toBe(true);
        expect(mockWriteText).toHaveBeenCalledWith('C[4] F[4]');
      });

      it('should return false on error', async () => {
        mockWriteText.mockRejectedValue(new Error('Clipboard error'));
        
        const chords: Chord[] = [
          { name: 'C', root: 'C', duration: 4, memo: '' }
        ];

        const result = await copyChordProgressionToClipboard(chords);

        expect(result).toBe(false);
      });
    });

    describe('pasteChordProgressionFromClipboard', () => {
      it('should paste and parse chord progression from clipboard', async () => {
        mockReadText.mockResolvedValue('C F G Am');

        const result = await pasteChordProgressionFromClipboard();

        expect(result).toHaveLength(4);
        expect(result![0]).toEqual({ name: 'C', root: 'C', duration: 4, memo: '' });
        expect(mockReadText).toHaveBeenCalled();
      });

      it('should return null for empty clipboard', async () => {
        mockReadText.mockResolvedValue('');

        const result = await pasteChordProgressionFromClipboard();

        expect(result).toBeNull();
      });

      it('should accept any content as valid (tolerant input)', async () => {
        mockReadText.mockResolvedValue('invalid content');

        const result = await pasteChordProgressionFromClipboard();

        // 寛容な入力により、どんなテキストでも有効なコード進行として扱われる
        expect(result).toEqual([
          { name: 'invalid', root: 'C', base: undefined, duration: 4, memo: '' },
          { name: 'content', root: 'C', base: undefined, duration: 4, memo: '' }
        ]);
      });

      it('should return null on error', async () => {
        mockReadText.mockRejectedValue(new Error('Clipboard error'));

        const result = await pasteChordProgressionFromClipboard();

        expect(result).toBeNull();
      });
    });
  });
});