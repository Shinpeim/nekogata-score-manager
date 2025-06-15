import { describe, it, expect, beforeEach } from 'vitest';
import { createEmptyChordChart, createEmptySection, createNewChordChart } from '../chordCreation';
import { validateChordChart, isValidChordName, isValidDuration, isValidFullChordName, validateChartInputs } from '../chordValidation';
import { COMMON_KEYS, COMMON_TIME_SIGNATURES, COMMON_SECTION_NAMES, KEY_DISPLAY_NAMES } from '../musicConstants';
import { extractChordRoot, normalizeChordName, parseOnChord, isOnChord } from '../chordParsing';
import type { ChordChart } from '../../types';

describe('chordUtils', () => {
  describe('createEmptyChordChart', () => {
    it('should create an empty chord chart with default values', () => {
      const chart = createEmptyChordChart();
      
      expect(chart.title).toBe('新しいコード譜');
      expect(chart.artist).toBe('');
      expect(chart.key).toBe('C');
      expect(chart.tempo).toBe(120);
      expect(chart.timeSignature).toBe('4/4');
      expect(chart.sections).toHaveLength(1);
      expect(chart.sections[0].name).toBe('イントロ');
      expect(chart.tags).toEqual([]);
      expect(chart.notes).toBe('');
    });

    it('should create a section with default values', () => {
      const chart = createEmptyChordChart();
      const section = chart.sections[0];
      
      expect(section.id).toBeDefined();
      expect(section.name).toBe('イントロ');
      expect(section.chords).toEqual([]);
      expect(section.beatsPerBar).toBe(4);
      expect(section.barsCount).toBe(4);
    });
  });

  describe('createEmptySection', () => {
    it('should create a section with default name', () => {
      const section = createEmptySection();
      
      expect(section.id).toBeDefined();
      expect(section.name).toBe('セクション');
      expect(section.chords).toEqual([]);
      expect(section.beatsPerBar).toBe(4);
      expect(section.barsCount).toBe(4);
    });

    it('should create a section with custom name', () => {
      const section = createEmptySection('Aメロ');
      
      expect(section.name).toBe('Aメロ');
    });

    it('should create sections with unique IDs', () => {
      const section1 = createEmptySection();
      const section2 = createEmptySection();
      
      expect(section1.id).not.toBe(section2.id);
    });
  });

  describe('createNewChordChart', () => {
    it('should create a new chord chart with provided data', () => {
      const data = {
        title: 'テスト曲',
        artist: 'テストアーティスト',
        key: 'G',
        tempo: 140,
      };

      const chart = createNewChordChart(data);
      
      expect(chart.id).toBeDefined();
      expect(chart.title).toBe('テスト曲');
      expect(chart.artist).toBe('テストアーティスト');
      expect(chart.key).toBe('G');
      expect(chart.tempo).toBe(140);
      expect(chart.timeSignature).toBe('4/4'); // default
      expect(chart.createdAt).toBeInstanceOf(Date);
      expect(chart.updatedAt).toBeInstanceOf(Date);
      expect(chart.sections).toHaveLength(1);
    });

    it('should ensure sections exist even when data.sections is undefined', () => {
      const data = {
        title: 'テスト曲',
        sections: undefined
      };

      const chart = createNewChordChart(data);
      
      expect(chart.sections).toHaveLength(1);
      expect(chart.sections[0].name).toBe('イントロ');
    });

    it('should preserve provided sections', () => {
      const customSections = [
        createEmptySection('カスタムセクション')
      ];
      
      const data = {
        title: 'テスト曲',
        sections: customSections
      };

      const chart = createNewChordChart(data);
      
      expect(chart.sections).toHaveLength(1);
      expect(chart.sections[0].name).toBe('カスタムセクション');
    });

    it('should create charts with unique IDs', () => {
      const chart1 = createNewChordChart({ title: 'Chart 1' });
      const chart2 = createNewChordChart({ title: 'Chart 2' });
      
      expect(chart1.id).not.toBe(chart2.id);
    });
  });

  describe('validateChordChart', () => {
    let validChart: Partial<ChordChart>;

    beforeEach(() => {
      validChart = {
        title: 'Valid Chart',
        key: 'C',
        timeSignature: '4/4',
        sections: [createEmptySection()]
      };
    });

    it('should return no errors for valid chart', () => {
      const errors = validateChordChart(validChart);
      expect(errors).toEqual([]);
    });

    it('should return error for missing title', () => {
      validChart.title = '';
      const errors = validateChordChart(validChart);
      expect(errors).toContain('タイトルは必須です');
    });

    it('should return error for whitespace-only title', () => {
      validChart.title = '   ';
      const errors = validateChordChart(validChart);
      expect(errors).toContain('タイトルは必須です');
    });

    it('should return error for missing key', () => {
      validChart.key = '';
      const errors = validateChordChart(validChart);
      expect(errors).toContain('キーは必須です');
    });

    it('should return error for missing time signature', () => {
      validChart.timeSignature = '';
      const errors = validateChordChart(validChart);
      expect(errors).toContain('拍子は必須です');
    });

    it('should not return error when sections is undefined (for new charts)', () => {
      validChart.sections = undefined;
      const errors = validateChordChart(validChart);
      expect(errors).not.toContain('少なくとも1つのセクションが必要です');
    });

    it('should return error when sections is empty array', () => {
      validChart.sections = [];
      const errors = validateChordChart(validChart);
      expect(errors).toContain('少なくとも1つのセクションが必要です');
    });

    it('should return multiple errors for multiple issues', () => {
      const invalidChart = {
        title: '',
        key: '',
        timeSignature: '',
        sections: []
      };
      
      const errors = validateChordChart(invalidChart);
      expect(errors).toHaveLength(4);
      expect(errors).toContain('タイトルは必須です');
      expect(errors).toContain('キーは必須です');
      expect(errors).toContain('拍子は必須です');
      expect(errors).toContain('少なくとも1つのセクションが必要です');
    });
  });

  describe('Constants', () => {
    it('should export COMMON_KEYS array with 12 proper keys', () => {
      expect(Array.isArray(COMMON_KEYS)).toBe(true);
      expect(COMMON_KEYS).toContain('C');
      expect(COMMON_KEYS).toContain('G');
      expect(COMMON_KEYS).toContain('Gb');
      expect(COMMON_KEYS).not.toContain('F#');
      expect(COMMON_KEYS).not.toContain('C#');
      expect(COMMON_KEYS).not.toContain('D#');
      expect(COMMON_KEYS).not.toContain('G#');
      expect(COMMON_KEYS).not.toContain('A#');
      expect(COMMON_KEYS.length).toBe(12);
    });

    it('should export KEY_DISPLAY_NAMES with proper parallel keys', () => {
      expect(KEY_DISPLAY_NAMES).toBeDefined();
      expect(KEY_DISPLAY_NAMES['C']).toBe('C / Am');
      expect(KEY_DISPLAY_NAMES['Db']).toBe('D♭ / B♭m');
      expect(KEY_DISPLAY_NAMES['D']).toBe('D / Bm');
      expect(KEY_DISPLAY_NAMES['Eb']).toBe('E♭ / Cm');
      expect(KEY_DISPLAY_NAMES['E']).toBe('E / C#m');
      expect(KEY_DISPLAY_NAMES['F']).toBe('F / Dm');
      expect(KEY_DISPLAY_NAMES['Gb']).toBe('G♭ / E♭m');
      expect(KEY_DISPLAY_NAMES['G']).toBe('G / Em');
      expect(KEY_DISPLAY_NAMES['Ab']).toBe('A♭ / Fm');
      expect(KEY_DISPLAY_NAMES['A']).toBe('A / F#m');
      expect(KEY_DISPLAY_NAMES['Bb']).toBe('B♭ / Gm');
      expect(KEY_DISPLAY_NAMES['B']).toBe('B / G#m');
      
      // すべてのCOMMON_KEYSにdisplay nameがあることを確認
      COMMON_KEYS.forEach(key => {
        expect(KEY_DISPLAY_NAMES[key]).toBeDefined();
      });
    });

    it('should export COMMON_TIME_SIGNATURES array', () => {
      expect(Array.isArray(COMMON_TIME_SIGNATURES)).toBe(true);
      expect(COMMON_TIME_SIGNATURES).toContain('4/4');
      expect(COMMON_TIME_SIGNATURES).toContain('3/4');
      expect(COMMON_TIME_SIGNATURES).toContain('6/8');
    });

    it('should export COMMON_SECTION_NAMES array', () => {
      expect(Array.isArray(COMMON_SECTION_NAMES)).toBe(true);
      expect(COMMON_SECTION_NAMES).toContain('イントロ');
      expect(COMMON_SECTION_NAMES).toContain('Aメロ');
      expect(COMMON_SECTION_NAMES).toContain('サビ');
    });
  });

  describe('extractChordRoot', () => {
    it('should extract root from basic chord names', () => {
      expect(extractChordRoot('C')).toBe('C');
      expect(extractChordRoot('Am')).toBe('A');
      expect(extractChordRoot('F7')).toBe('F');
      expect(extractChordRoot('Gmaj7')).toBe('G');
    });

    it('should extract root from sharp chords', () => {
      expect(extractChordRoot('C#')).toBe('C#');
      expect(extractChordRoot('F#m')).toBe('F#');
      expect(extractChordRoot('G#7')).toBe('G#');
    });

    it('should extract root from flat chords with b and normalize to ♭', () => {
      expect(extractChordRoot('Bb')).toBe('B♭');
      expect(extractChordRoot('Ebm')).toBe('E♭');
      expect(extractChordRoot('Ab7')).toBe('A♭');
    });

    it('should extract root from flat chords with ♭ symbol', () => {
      expect(extractChordRoot('B♭')).toBe('B♭');
      expect(extractChordRoot('E♭m')).toBe('E♭');
      expect(extractChordRoot('A♭7')).toBe('A♭');
    });

    it('should extract root from complex chord names', () => {
      expect(extractChordRoot('Dm7(♭5)')).toBe('D');
      expect(extractChordRoot('E♭maj7(#11)')).toBe('E♭');
      expect(extractChordRoot('F#m7(♭9)')).toBe('F#');
    });

    it('should normalize mixed b and ♭ notations in root', () => {
      expect(extractChordRoot('Dbmaj7')).toBe('D♭');
      expect(extractChordRoot('Gbm')).toBe('G♭');
      expect(extractChordRoot('Abm7(b5)')).toBe('A♭');
    });

    it('should return C for invalid input', () => {
      expect(extractChordRoot('')).toBe('C');
      expect(extractChordRoot('invalid')).toBe('C');
      expect(extractChordRoot('123')).toBe('C');
    });

    it('should handle null/undefined input', () => {
      expect(extractChordRoot(null as unknown as string)).toBe('C');
      expect(extractChordRoot(undefined as unknown as string)).toBe('C');
    });
  });

  describe('isValidChordName', () => {
    it('should validate basic chord names', () => {
      expect(isValidChordName('C')).toBe(true);
      expect(isValidChordName('Am')).toBe(true);
      expect(isValidChordName('F7')).toBe(true);
      expect(isValidChordName('Gmaj7')).toBe(true);
    });

    it('should validate sharp and flat chords', () => {
      expect(isValidChordName('C#')).toBe(true);
      expect(isValidChordName('Bb')).toBe(true);
      expect(isValidChordName('F♭')).toBe(true);
      expect(isValidChordName('G♭m7')).toBe(true);
    });

    it('should validate complex chord names', () => {
      expect(isValidChordName('Dm7(♭5)')).toBe(true);
      expect(isValidChordName('E7(#9)')).toBe(true);
      expect(isValidChordName('Amaj7(add9)')).toBe(true);
    });

    it('should reject invalid chord names', () => {
      expect(isValidChordName('')).toBe(false);
      expect(isValidChordName('invalid')).toBe(false);
      expect(isValidChordName('123')).toBe(false);
      expect(isValidChordName('H')).toBe(false); // H is not valid in English notation
    });

    it('should handle null/undefined input', () => {
      expect(isValidChordName(null as unknown as string)).toBe(false);
      expect(isValidChordName(undefined as unknown as string)).toBe(false);
    });
  });

  describe('normalizeChordName', () => {
    it('should trim whitespace', () => {
      expect(normalizeChordName('  C  ')).toBe('C');
      expect(normalizeChordName(' Am7 ')).toBe('Am7');
    });

    it('should return C for invalid input', () => {
      expect(normalizeChordName('')).toBe('C');
      expect(normalizeChordName('   ')).toBe('C');
    });

    it('should handle null/undefined input', () => {
      expect(normalizeChordName(null as unknown as string)).toBe('C');
      expect(normalizeChordName(undefined as unknown as string)).toBe('C');
    });

    it('should preserve valid chord names', () => {
      expect(normalizeChordName('F#m7')).toBe('F#m7');
      expect(normalizeChordName('B♭maj7')).toBe('B♭maj7');
    });
  });

  describe('parseOnChord', () => {
    it('should parse basic on chords', () => {
      expect(parseOnChord('C/E')).toEqual({ chord: 'C', base: 'E' });
      expect(parseOnChord('Am/G')).toEqual({ chord: 'Am', base: 'G' });
      expect(parseOnChord('F/C')).toEqual({ chord: 'F', base: 'C' });
    });

    it('should parse on chords with sharp base', () => {
      expect(parseOnChord('D/F#')).toEqual({ chord: 'D', base: 'F#' });
      expect(parseOnChord('G/C#')).toEqual({ chord: 'G', base: 'C#' });
    });

    it('should parse on chords with flat base and normalize b to ♭', () => {
      expect(parseOnChord('C/Bb')).toEqual({ chord: 'C', base: 'B♭' });
      expect(parseOnChord('F/Eb')).toEqual({ chord: 'F', base: 'E♭' });
      expect(parseOnChord('G/Ab')).toEqual({ chord: 'G', base: 'A♭' });
    });

    it('should parse on chords with ♭ symbol in base', () => {
      expect(parseOnChord('C/B♭')).toEqual({ chord: 'C', base: 'B♭' });
      expect(parseOnChord('F/E♭')).toEqual({ chord: 'F', base: 'E♭' });
    });

    it('should parse complex on chords', () => {
      expect(parseOnChord('Am7/G')).toEqual({ chord: 'Am7', base: 'G' });
      expect(parseOnChord('Dm7(♭5)/A♭')).toEqual({ chord: 'Dm7(♭5)', base: 'A♭' });
      expect(parseOnChord('F#m7/C#')).toEqual({ chord: 'F#m7', base: 'C#' });
    });

    it('should return just chord for non-on chords', () => {
      expect(parseOnChord('C')).toEqual({ chord: 'C' });
      expect(parseOnChord('Am7')).toEqual({ chord: 'Am7' });
      expect(parseOnChord('F#m')).toEqual({ chord: 'F#m' });
    });

    it('should handle invalid input', () => {
      expect(parseOnChord('')).toEqual({ chord: 'C' });
      expect(parseOnChord('invalid')).toEqual({ chord: 'invalid' });
    });

    it('should handle null/undefined input', () => {
      expect(parseOnChord(null as unknown as string)).toEqual({ chord: 'C' });
      expect(parseOnChord(undefined as unknown as string)).toEqual({ chord: 'C' });
    });

    it('should not parse invalid on chord patterns', () => {
      expect(parseOnChord('C/invalid')).toEqual({ chord: 'C/invalid' });
      expect(parseOnChord('C/1')).toEqual({ chord: 'C/1' });
      expect(parseOnChord('C/')).toEqual({ chord: 'C/' });
    });
  });

  describe('isOnChord', () => {
    it('should identify basic on chords', () => {
      expect(isOnChord('C/E')).toBe(true);
      expect(isOnChord('Am/G')).toBe(true);
      expect(isOnChord('F/C')).toBe(true);
    });

    it('should identify on chords with sharp and flat base', () => {
      expect(isOnChord('D/F#')).toBe(true);
      expect(isOnChord('C/Bb')).toBe(true);
      expect(isOnChord('F/E♭')).toBe(true);
    });

    it('should identify complex on chords', () => {
      expect(isOnChord('Am7/G')).toBe(true);
      expect(isOnChord('Dm7(♭5)/A♭')).toBe(true);
      expect(isOnChord('F#m7/C#')).toBe(true);
    });

    it('should not identify non-on chords', () => {
      expect(isOnChord('C')).toBe(false);
      expect(isOnChord('Am7')).toBe(false);
      expect(isOnChord('F#m')).toBe(false);
    });

    it('should not identify invalid on chord patterns', () => {
      expect(isOnChord('C/invalid')).toBe(false);
      expect(isOnChord('C/1')).toBe(false);
      expect(isOnChord('C/')).toBe(false);
    });

    it('should handle invalid input', () => {
      expect(isOnChord('')).toBe(false);
      expect(isOnChord(null as unknown as string)).toBe(false);
      expect(isOnChord(undefined as unknown as string)).toBe(false);
    });
  });

  describe('isValidDuration', () => {
    it('should validate numeric durations', () => {
      expect(isValidDuration(1)).toBe(true);
      expect(isValidDuration(0.5)).toBe(true);
      expect(isValidDuration(16)).toBe(true);
      expect(isValidDuration(8.5)).toBe(true);
    });

    it('should validate string durations', () => {
      expect(isValidDuration('1')).toBe(true);
      expect(isValidDuration('0.5')).toBe(true);
      expect(isValidDuration('16')).toBe(true);
      expect(isValidDuration('8.5')).toBe(true);
      expect(isValidDuration(' 2 ')).toBe(true); // trimmed
    });

    it('should reject invalid durations', () => {
      expect(isValidDuration(0)).toBe(false);
      expect(isValidDuration(0.4)).toBe(false);
      expect(isValidDuration(17)).toBe(false);
      expect(isValidDuration('0')).toBe(false);
      expect(isValidDuration('0.4')).toBe(false);
      expect(isValidDuration('17')).toBe(false);
      expect(isValidDuration('abc')).toBe(false);
      expect(isValidDuration('')).toBe(false);
      expect(isValidDuration('   ')).toBe(false);
    });

    it('should handle invalid input types', () => {
      expect(isValidDuration(null as unknown as string)).toBe(false);
      expect(isValidDuration(undefined as unknown as string)).toBe(false);
      expect(isValidDuration(NaN)).toBe(false);
    });
  });

  describe('isValidFullChordName', () => {
    it('should validate basic chord names', () => {
      expect(isValidFullChordName('C')).toBe(true);
      expect(isValidFullChordName('Am')).toBe(true);
      expect(isValidFullChordName('F7')).toBe(true);
      expect(isValidFullChordName('Gmaj7')).toBe(true);
    });

    it('should validate chord names with sharps and flats', () => {
      expect(isValidFullChordName('C#')).toBe(true);
      expect(isValidFullChordName('Bb')).toBe(true);
      expect(isValidFullChordName('F♭')).toBe(true);
      expect(isValidFullChordName('G♭m7')).toBe(true);
    });

    it('should validate on chords', () => {
      expect(isValidFullChordName('C/E')).toBe(true);
      expect(isValidFullChordName('Am/G')).toBe(true);
      expect(isValidFullChordName('F#m7/C#')).toBe(true);
      expect(isValidFullChordName('Dm7(♭5)/A♭')).toBe(true);
    });

    it('should reject invalid chord names', () => {
      expect(isValidFullChordName('')).toBe(false);
      expect(isValidFullChordName('   ')).toBe(false);
      expect(isValidFullChordName('invalid')).toBe(false);
      expect(isValidFullChordName('123')).toBe(false);
      expect(isValidFullChordName('H')).toBe(false); // H is not valid
    });

    it('should reject invalid on chords', () => {
      expect(isValidFullChordName('C/invalid')).toBe(false);
      expect(isValidFullChordName('C/1')).toBe(false);
      expect(isValidFullChordName('C/')).toBe(false);
      expect(isValidFullChordName('invalid/E')).toBe(false);
    });

    it('should handle null/undefined input', () => {
      expect(isValidFullChordName(null as unknown as string)).toBe(false);
      expect(isValidFullChordName(undefined as unknown as string)).toBe(false);
    });
  });

  describe('validateChartInputs', () => {
    let validChart: ChordChart;

    beforeEach(() => {
      validChart = {
        id: 'test-chart',
        title: 'Test Chart',
        artist: 'Test Artist',
        key: 'C',
        tempo: 120,
        timeSignature: '4/4',
        sections: [
          {
            id: 'section1',
            name: 'テストセクション',
            chords: [
              { name: 'C', root: 'C', duration: 4, memo: '' },
              { name: 'Am', root: 'A', duration: 2, memo: '' },
              { name: 'F', root: 'F', duration: 2, memo: '' }
            ],
            beatsPerBar: 4,
            barsCount: 4
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    it('should validate valid chart', () => {
      const result = validateChartInputs(validChart);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect invalid chord names', () => {
      validChart.sections![0].chords[0].name = 'invalid';
      const result = validateChartInputs(validChart);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('1番目のコード名「invalid」が無効です');
    });

    it('should detect invalid durations', () => {
      validChart.sections![0].chords[1].duration = 0.4;
      const result = validateChartInputs(validChart);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('2番目の拍数「0.4」が無効です');
    });

    it('should detect multiple errors', () => {
      validChart.sections![0].chords[0].name = 'invalid';
      validChart.sections![0].chords[1].duration = 17;
      const result = validateChartInputs(validChart);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should validate with editing state (chord name)', () => {
      const editingState = {
        sectionId: 'section1',
        chordIndex: 0,
        displayValue: 'invalid',
        isEditing: true
      };
      const result = validateChartInputs(validChart, editingState);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('1番目のコード名「invalid」が無効です');
    });

    it('should validate with editing state (duration)', () => {
      const editingState = {
        sectionId: 'section1',
        chordIndex: 1,
        durationDisplayValue: '20',
        isDurationEditing: true
      };
      const result = validateChartInputs(validChart, editingState);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('2番目の拍数「20」が無効です');
    });

    it('should skip line break markers', () => {
      validChart.sections![0].chords.push({
        name: '__LINE_BREAK__',
        root: '',
        isLineBreak: true,
        memo: ''
      });
      const result = validateChartInputs(validChart);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle chart with no sections', () => {
      const chartWithNoSections = { ...validChart };
      delete (chartWithNoSections as Partial<ChordChart>).sections;
      const result = validateChartInputs(chartWithNoSections as ChordChart);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate on chords', () => {
      validChart.sections![0].chords[0] = { name: 'C', root: 'C', base: 'E', duration: 4, memo: '' };
      const result = validateChartInputs(validChart);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect invalid on chords', () => {
      validChart.sections![0].chords[0].name = 'C';
      // 編集中に無効なオンコードを入力
      const editingState = {
        sectionId: 'section1',
        chordIndex: 0,
        displayValue: 'C/invalid',
        isEditing: true
      };
      const result = validateChartInputs(validChart, editingState);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('1番目のコード名「C/invalid」が無効です');
    });
  });
});