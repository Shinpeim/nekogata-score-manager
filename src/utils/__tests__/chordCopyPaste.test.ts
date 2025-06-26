import { describe, it, expect } from 'vitest';
import {
  textToChords,
  isValidChordProgression
} from '../chordCopyPaste';

describe('chordCopyPaste', () => {
  describe('textToChords', () => {
    it('should parse simple chord names', () => {
      const result = textToChords('C F G Am');
      
      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({ name: 'C', root: 'C', duration: 4, memo: '' });
      expect(result[1]).toMatchObject({ name: 'F', root: 'F', duration: 4, memo: '' });
      expect(result[2]).toMatchObject({ name: 'G', root: 'G', duration: 4, memo: '' });
      expect(result[3]).toMatchObject({ name: 'Am', root: 'A', duration: 4, memo: '' });
      // idフィールドが存在することも確認
      result.forEach(chord => expect(chord.id).toBeDefined());
    });

    it('should parse chords with bracket durations and normalize roots', () => {
      const result = textToChords('C[2] Bb[2] G[4]');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ name: 'C', root: 'C', duration: 2, memo: '' });
      expect(result[1]).toMatchObject({ name: 'Bb', root: 'B♭', duration: 2, memo: '' });
      expect(result[2]).toMatchObject({ name: 'G', root: 'G', duration: 4, memo: '' });
      result.forEach(chord => expect(chord.id).toBeDefined());
    });


    it('should parse decimal durations with brackets', () => {
      const result = textToChords('C[1.5] F[2.5]');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ name: 'C', root: 'C', duration: 1.5, memo: '' });
      expect(result[1]).toMatchObject({ name: 'F', root: 'F', duration: 2.5, memo: '' });
      result.forEach(chord => expect(chord.id).toBeDefined());
    });


    it('should parse line breaks', () => {
      const result = textToChords('C F | G Am');
      
      expect(result).toHaveLength(5);
      expect(result[0]).toMatchObject({ name: 'C', root: 'C', duration: 4, memo: '' });
      expect(result[1]).toMatchObject({ name: 'F', root: 'F', duration: 4, memo: '' });
      expect(result[2]).toMatchObject({ name: '__LINE_BREAK__', root: '', isLineBreak: true, memo: '' });
      expect(result[3]).toMatchObject({ name: 'G', root: 'G', duration: 4, memo: '' });
      expect(result[4]).toMatchObject({ name: 'Am', root: 'A', duration: 4, memo: '' });
      result.forEach(chord => expect(chord.id).toBeDefined());
    });

    it('should handle complex chord names', () => {
      const result = textToChords('C7 Dm7 G7 Cmaj7');
      
      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({ name: 'C7', root: 'C', duration: 4, memo: '' });
      expect(result[1]).toMatchObject({ name: 'Dm7', root: 'D', duration: 4, memo: '' });
      expect(result[2]).toMatchObject({ name: 'G7', root: 'G', duration: 4, memo: '' });
      expect(result[3]).toMatchObject({ name: 'Cmaj7', root: 'C', duration: 4, memo: '' });
      result.forEach(chord => expect(chord.id).toBeDefined());
    });

    it('should handle sharp and flat chords with root normalization', () => {
      const result = textToChords('C# F# Bb Eb');
      
      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({ name: 'C#', root: 'C#', duration: 4, memo: '' });
      expect(result[1]).toMatchObject({ name: 'F#', root: 'F#', duration: 4, memo: '' });
      expect(result[2]).toMatchObject({ name: 'Bb', root: 'B♭', duration: 4, memo: '' });
      expect(result[3]).toMatchObject({ name: 'Eb', root: 'E♭', duration: 4, memo: '' });
      result.forEach(chord => expect(chord.id).toBeDefined());
    });

    it('should handle flat symbol (♭) in addition to b', () => {
      const result = textToChords('B♭ E♭ A♭ D♭');
      
      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({ name: 'B♭', root: 'B♭', duration: 4, memo: '' });
      expect(result[1]).toMatchObject({ name: 'E♭', root: 'E♭', duration: 4, memo: '' });
      expect(result[2]).toMatchObject({ name: 'A♭', root: 'A♭', duration: 4, memo: '' });
      expect(result[3]).toMatchObject({ name: 'D♭', root: 'D♭', duration: 4, memo: '' });
      result.forEach(chord => expect(chord.id).toBeDefined());
    });

    it('should handle mixed b and ♭ symbols with duration brackets', () => {
      const result = textToChords('Bb[2] E♭m7[4] Ab[1.5]');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ name: 'Bb', root: 'B♭', duration: 2, memo: '' });
      expect(result[1]).toMatchObject({ name: 'E♭m7', root: 'E♭', duration: 4, memo: '' });
      expect(result[2]).toMatchObject({ name: 'Ab', root: 'A♭', duration: 1.5, memo: '' });
      result.forEach(chord => expect(chord.id).toBeDefined());
    });

    it('should handle flat symbol (♭) in tension chords', () => {
      const result = textToChords('E♭7(♭9)[2] B♭7(♭5)[4]');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ name: 'E♭7(♭9)', root: 'E♭', duration: 2, memo: '' });
      expect(result[1]).toMatchObject({ name: 'B♭7(♭5)', root: 'B♭', duration: 4, memo: '' });
      result.forEach(chord => expect(chord.id).toBeDefined());
    });

    it('should handle tension chords with bracket notation and normalize roots', () => {
      const result = textToChords('E7(#9)[2] Bb7(b5)[4] Am7(11)[1]');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ name: 'E7(#9)', root: 'E', duration: 2, memo: '' });
      expect(result[1]).toMatchObject({ name: 'Bb7(b5)', root: 'B♭', duration: 4, memo: '' });
      expect(result[2]).toMatchObject({ name: 'Am7(11)', root: 'A', duration: 1, memo: '' });
      result.forEach(chord => expect(chord.id).toBeDefined());
    });

    it('should handle complex tension chords with root normalization', () => {
      const result = textToChords('Eb7(#9) Bb7(b5) Am7(11)');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ name: 'Eb7(#9)', root: 'E♭', duration: 4, memo: '' });
      expect(result[1]).toMatchObject({ name: 'Bb7(b5)', root: 'B♭', duration: 4, memo: '' });
      expect(result[2]).toMatchObject({ name: 'Am7(11)', root: 'A', duration: 4, memo: '' });
      result.forEach(chord => expect(chord.id).toBeDefined());
    });

    it('should ignore empty parts', () => {
      const result = textToChords('C   F  G     Am');
      
      expect(result).toHaveLength(4);
    });

    it('should accept all text input including non-musical terms', () => {
      const result = textToChords('Bb invalid Eb');
      
      // 寛容な入力により、「invalid」も受け入れられる
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ name: 'Bb', root: 'B♭', duration: 4, memo: '' });
      expect(result[1]).toMatchObject({ name: 'invalid', root: 'C', duration: 4, memo: '' });
      expect(result[2]).toMatchObject({ name: 'Eb', root: 'E♭', duration: 4, memo: '' });
      result.forEach(chord => expect(chord.id).toBeDefined());
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
});