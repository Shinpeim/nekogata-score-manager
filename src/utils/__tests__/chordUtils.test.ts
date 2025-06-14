import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEmptyChordChart,
  createEmptySection,
  createNewChordChart,
  validateChordChart,
  COMMON_KEYS,
  COMMON_TIME_SIGNATURES,
  COMMON_SECTION_NAMES
} from '../chordUtils';
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
    it('should export COMMON_KEYS array', () => {
      expect(Array.isArray(COMMON_KEYS)).toBe(true);
      expect(COMMON_KEYS).toContain('C');
      expect(COMMON_KEYS).toContain('G');
      expect(COMMON_KEYS).toContain('F#');
      expect(COMMON_KEYS.length).toBeGreaterThan(10);
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
});