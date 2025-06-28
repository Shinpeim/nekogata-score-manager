import { describe, it, expect } from 'vitest';
import {
  isValidChordName,
  isValidDuration,
  isValidFullChordName,
  validateChordChart,
  validateChartInputs
} from '../chordValidation';
import type { ChordChart } from '../../types';

describe('chordValidation', () => {
  describe('isValidChordName', () => {
    it('有効なコード名を正しく判定する', () => {
      expect(isValidChordName('C')).toBe(true);
      expect(isValidChordName('Dm')).toBe(true);
      expect(isValidChordName('F#')).toBe(true);
      expect(isValidChordName('Bb')).toBe(true);
      expect(isValidChordName('G7')).toBe(true);
      expect(isValidChordName('Am7')).toBe(true);
      expect(isValidChordName('Cmaj7')).toBe(true);
      // N.C. (No Chord) のテスト
      expect(isValidChordName('N.C.')).toBe(true);
      expect(isValidChordName('NC')).toBe(true);
      expect(isValidChordName('n.c.')).toBe(true);
      expect(isValidChordName('nc')).toBe(true);
    });

    it('無効なコード名を正しく判定する', () => {
      expect(isValidChordName('')).toBe(false);
      expect(isValidChordName('   ')).toBe(false);
      expect(isValidChordName('X')).toBe(false);
      expect(isValidChordName('H')).toBe(false);
      expect(isValidChordName('123')).toBe(false);
      // 実装は大文字小文字を区別しないので、cも有効
      expect(isValidChordName('c')).toBe(true);
    });

    it('nullやundefinedを正しく処理する', () => {
      expect(isValidChordName(null as unknown as string)).toBe(false);
      expect(isValidChordName(undefined as unknown as string)).toBe(false);
    });
  });

  describe('isValidFullChordName', () => {
    it('有効なフルコード名を正しく判定する', () => {
      expect(isValidFullChordName('C')).toBe(true);
      expect(isValidFullChordName('C/E')).toBe(true);
      expect(isValidFullChordName('Dm/F')).toBe(true);
      expect(isValidFullChordName('F#m7/A#')).toBe(true);
    });

    it('無効なフルコード名を正しく判定する', () => {
      expect(isValidFullChordName('')).toBe(false);
      expect(isValidFullChordName('   ')).toBe(false);
      expect(isValidFullChordName('C/')).toBe(false);
      expect(isValidFullChordName('/E')).toBe(false);
      expect(isValidFullChordName('C/X')).toBe(false);
    });
  });

  describe('isValidDuration', () => {
    it('有効な拍数を正しく判定する', () => {
      expect(isValidDuration('0.5')).toBe(true);
      expect(isValidDuration('1')).toBe(true);
      expect(isValidDuration('1.5')).toBe(true);
      expect(isValidDuration('2')).toBe(true);
      expect(isValidDuration('4')).toBe(true);
      expect(isValidDuration('8')).toBe(true);
      expect(isValidDuration('16')).toBe(true);
    });

    it('無効な拍数を正しく判定する（範囲外）', () => {
      expect(isValidDuration('0')).toBe(false);
      expect(isValidDuration('0.25')).toBe(false);
      expect(isValidDuration('17')).toBe(false);
      expect(isValidDuration('100')).toBe(false);
    });

    it('無効な拍数を正しく判定する（0.5刻みでない）', () => {
      expect(isValidDuration('1.1')).toBe(false);
      expect(isValidDuration('1.3')).toBe(false);
      expect(isValidDuration('2.7')).toBe(false);
      expect(isValidDuration('1.01')).toBe(false);
    });

    it('無効な拍数を正しく判定する（非数値）', () => {
      expect(isValidDuration('')).toBe(false);
      expect(isValidDuration('   ')).toBe(false);
      expect(isValidDuration('abc')).toBe(false);
      expect(isValidDuration('not-a-number')).toBe(false);
    });

    it('nullやundefinedを正しく処理する', () => {
      expect(isValidDuration(null as unknown as string | number)).toBe(false);
      expect(isValidDuration(undefined as unknown as string | number)).toBe(false);
    });
  });

  describe('validateChordChart', () => {
    const validChart: ChordChart = {
      id: 'test-1',
      title: 'テスト楽曲',
      artist: 'テストアーティスト',
      key: 'C',
      tempo: 120,
      timeSignature: '4/4',
      sections: [
        {
          id: 'section-1',
          name: 'イントロ',
          chords: [],
          beatsPerBar: 4,
          barsCount: 1
        }
      ],
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('有効なチャートでエラーが発生しない', () => {
      const errors = validateChordChart(validChart);
      expect(errors).toEqual([]);
    });

    it('タイトルが空の場合エラーを返す', () => {
      const invalidChart = { ...validChart, title: '' };
      const errors = validateChordChart(invalidChart);
      expect(errors).toContain('タイトルは必須です');
    });

    it('タイトルが空白のみの場合エラーを返す', () => {
      const invalidChart = { ...validChart, title: '   ' };
      const errors = validateChordChart(invalidChart);
      expect(errors).toContain('タイトルは必須です');
    });

    it('キーが空の場合エラーを返す', () => {
      const invalidChart = { ...validChart, key: '' };
      const errors = validateChordChart(invalidChart);
      expect(errors).toContain('キーは必須です');
    });

    it('拍子が空の場合エラーを返す', () => {
      const invalidChart = { ...validChart, timeSignature: '' };
      const errors = validateChordChart(invalidChart);
      expect(errors).toContain('拍子は必須です');
    });

    it('セクションが空の場合エラーを返す', () => {
      const invalidChart = { ...validChart, sections: [] };
      const errors = validateChordChart(invalidChart);
      expect(errors).toContain('少なくとも1つのセクションが必要です');
    });

    it('複数のエラーを同時に検出する', () => {
      const invalidChart = { ...validChart, title: '', key: '', timeSignature: '', sections: [] };
      const errors = validateChordChart(invalidChart);
      expect(errors).toHaveLength(4);
      expect(errors).toContain('タイトルは必須です');
      expect(errors).toContain('キーは必須です');
      expect(errors).toContain('拍子は必須です');
      expect(errors).toContain('少なくとも1つのセクションが必要です');
    });
  });

  describe('validateChartInputs', () => {
    const validChart: ChordChart = {
      id: 'test-1',
      title: 'テスト楽曲',
      artist: 'テストアーティスト',
      key: 'C',
      tempo: 120,
      timeSignature: '4/4',
      sections: [
        {
          id: 'section-1',
          name: 'イントロ',
          chords: [
            { id: 'chord-1', name: 'C', root: 'C', duration: 4, memo: '' }
          ],
          beatsPerBar: 4,
          barsCount: 1
        }
      ],
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('有効なチャートでバリデーションが通る', () => {
      const result = validateChartInputs(validChart);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('無効なコード名でバリデーションが失敗する', () => {
      const invalidChart = {
        ...validChart,
        sections: [
          {
            ...validChart.sections![0],
            chords: [
              { id: 'chord-2', name: '', root: '', duration: 4, memo: '' }
            ]
          }
        ]
      };
      const result = validateChartInputs(invalidChart);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('無効な拍数でバリデーションが失敗する', () => {
      const invalidChart = {
        ...validChart,
        sections: [
          {
            ...validChart.sections![0],
            chords: [
              { id: 'chord-3', name: 'C', root: 'C', duration: 0.25, memo: '' } // 無効な拍数
            ]
          }
        ]
      };
      const result = validateChartInputs(invalidChart);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('改行マーカーはバリデーションをスキップする', () => {
      const chartWithLineBreak = {
        ...validChart,
        sections: [
          {
            ...validChart.sections![0],
            chords: [
              { id: 'chord-4', name: 'C', root: 'C', duration: 4, memo: '' },
              { id: 'chord-5', name: '', root: '', duration: undefined, memo: '', isLineBreak: true }
            ]
          }
        ]
      };
      const result = validateChartInputs(chartWithLineBreak);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});