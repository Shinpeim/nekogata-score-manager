import { describe, it, expect } from 'vitest';
import { chordToDegreeWithQuality, isValidKey } from '../degreeNames';
import type { Chord } from '../../types';

describe('degreeNames', () => {
  describe('chordToDegreeWithQuality', () => {
    it('メジャーキーでの基本的なディグリー変換', () => {
      const key = 'C';
      
      // Cメジャースケールの各コード
      expect(chordToDegreeWithQuality(createChord('C', 'C'), key)).toBe('I');
      expect(chordToDegreeWithQuality(createChord('Dm', 'D'), key)).toBe('IIm');
      expect(chordToDegreeWithQuality(createChord('Em', 'E'), key)).toBe('IIIm');
      expect(chordToDegreeWithQuality(createChord('F', 'F'), key)).toBe('IV');
      expect(chordToDegreeWithQuality(createChord('G', 'G'), key)).toBe('V');
      expect(chordToDegreeWithQuality(createChord('Am', 'A'), key)).toBe('VIm');
      expect(chordToDegreeWithQuality(createChord('Bdim', 'B'), key)).toBe('VIIdim');
    });

    it('Aキーでの基本的なディグリー変換', () => {
      const key = 'A';  // 内部的にはメジャーキーとして扱われる
      
      // Aメジャースケールの各コード
      expect(chordToDegreeWithQuality(createChord('A', 'A'), key)).toBe('I');
      expect(chordToDegreeWithQuality(createChord('Bm', 'B'), key)).toBe('IIm');
      expect(chordToDegreeWithQuality(createChord('C#m', 'C#'), key)).toBe('IIIm');
      expect(chordToDegreeWithQuality(createChord('D', 'D'), key)).toBe('IV');
      expect(chordToDegreeWithQuality(createChord('E', 'E'), key)).toBe('V');
      expect(chordToDegreeWithQuality(createChord('F#m', 'F#'), key)).toBe('VIm');
      expect(chordToDegreeWithQuality(createChord('G#dim', 'G#'), key)).toBe('VIIdim');
    });

    it('テンションコードの品質保持', () => {
      const key = 'C';
      
      expect(chordToDegreeWithQuality(createChord('Am7', 'A'), key)).toBe('VIm7');
      expect(chordToDegreeWithQuality(createChord('Dm7(♭5)', 'D'), key)).toBe('IIm7(♭5)');
      expect(chordToDegreeWithQuality(createChord('G7sus4', 'G'), key)).toBe('V7sus4');
      expect(chordToDegreeWithQuality(createChord('Cmaj7(#11)', 'C'), key)).toBe('Imaj7(#11)');
    });

    it('オンコードの処理', () => {
      const key = 'C';
      
      expect(chordToDegreeWithQuality(createChordWithBase('Am7', 'A', 'C'), key)).toBe('VIm7/I');
      expect(chordToDegreeWithQuality(createChordWithBase('G7', 'G', 'B'), key)).toBe('V7/VII');
      expect(chordToDegreeWithQuality(createChordWithBase('C', 'C', 'E'), key)).toBe('I/III');
    });

    it('#/♭キーでの変換', () => {
      const key = 'G';
      
      // Gメジャースケール
      expect(chordToDegreeWithQuality(createChord('G', 'G'), key)).toBe('I');
      expect(chordToDegreeWithQuality(createChord('Am', 'A'), key)).toBe('IIm');
      expect(chordToDegreeWithQuality(createChord('Bm', 'B'), key)).toBe('IIIm');
      expect(chordToDegreeWithQuality(createChord('C', 'C'), key)).toBe('IV');
      expect(chordToDegreeWithQuality(createChord('D', 'D'), key)).toBe('V');
      expect(chordToDegreeWithQuality(createChord('Em', 'E'), key)).toBe('VIm');
      expect(chordToDegreeWithQuality(createChord('F#dim', 'F#'), key)).toBe('VIIdim');
    });

    it('CキーでのF#の扱い', () => {
      const key = 'C';
      
      // F#はCメジャースケールでは#IV (増4度)
      expect(chordToDegreeWithQuality(createChord('F#m7b5', 'F#'), key)).toBe('#IVm7b5');
      expect(chordToDegreeWithQuality(createChord('F#m7-5', 'F#'), key)).toBe('#IVm7-5');
      expect(chordToDegreeWithQuality(createChord('F#m7(♭5)', 'F#'), key)).toBe('#IVm7(♭5)');
    });

    it('異名同音の処理', () => {
      const key = 'C';
      
      // C#とD♭は同じディグリー（♭II）
      expect(chordToDegreeWithQuality(createChord('C#', 'C#'), key)).toBe('♭II');
      expect(chordToDegreeWithQuality(createChord('D♭', 'D♭'), key)).toBe('♭II');
    });

    it('複雑なコード名の品質保持', () => {
      const key = 'C';
      
      expect(chordToDegreeWithQuality(createChord('Am7(♭5,♭9)', 'A'), key)).toBe('VIm7(♭5,♭9)');
      expect(chordToDegreeWithQuality(createChord('G13(#11)', 'G'), key)).toBe('V13(#11)');
      expect(chordToDegreeWithQuality(createChord('Dm6/9', 'D'), key)).toBe('IIm6/9');
    });

    it('エッジケース処理', () => {
      // 無効な入力
      expect(chordToDegreeWithQuality(null as unknown as Chord, 'C')).toBe('');
      expect(chordToDegreeWithQuality(createChord('Am', 'A'), '')).toBe('');
      expect(chordToDegreeWithQuality(createChord('', ''), 'C')).toBe('');
      
      // 特殊な音名
      expect(chordToDegreeWithQuality(createChord('B#', 'B#'), 'C')).toBe('I'); // B# = C
      expect(chordToDegreeWithQuality(createChord('Cb', 'Cb'), 'C')).toBe('VII'); // Cb = B
    });
  });

  describe('isValidKey', () => {
    it('有効なメジャーキー', () => {
      expect(isValidKey('C')).toBe(true);
      expect(isValidKey('G')).toBe(true);
      expect(isValidKey('F#')).toBe(true);
      expect(isValidKey('B♭')).toBe(true);
      expect(isValidKey('Db')).toBe(true);
    });

    it('マイナーキーは無効として扱う', () => {
      // アプリ内部ではメジャーキーのみ使用
      expect(isValidKey('Am')).toBe(false);
      expect(isValidKey('Em')).toBe(false);
      expect(isValidKey('F#m')).toBe(false);
      expect(isValidKey('B♭m')).toBe(false);
      expect(isValidKey('Dbm')).toBe(false);
    });

    it('無効なキー', () => {
      expect(isValidKey('')).toBe(false);
      expect(isValidKey(null as unknown as string)).toBe(false);
      expect(isValidKey(undefined as unknown as string)).toBe(false);
      expect(isValidKey('Cmaj7')).toBe(false);
      expect(isValidKey('Am7')).toBe(false);
      expect(isValidKey('X')).toBe(false);
      expect(isValidKey('C#maj')).toBe(false);
    });
  });
});

// テスト用ヘルパー関数
function createChord(name: string, root: string): Chord {
  return {
    id: 'test-id',
    name,
    root,
    duration: 4,
    memo: ''
  };
}

function createChordWithBase(name: string, root: string, base: string): Chord {
  return {
    id: 'test-id',
    name,
    root,
    base,
    duration: 4,
    memo: ''
  };
}