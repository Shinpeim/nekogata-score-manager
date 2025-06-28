import { describe, it, expect } from 'vitest';
import { createNewChordChart, createEmptySection, createEmptyChordChart } from '../chordCreation';

describe('chordCreation', () => {
  describe('createEmptySection', () => {
    it('4/4拍子の場合、beatsPerBarが4になる', () => {
      const section = createEmptySection('Intro', '4/4');
      expect(section.beatsPerBar).toBe(4);
      expect(section.name).toBe('Intro');
    });

    it('3/4拍子の場合、beatsPerBarが3になる', () => {
      const section = createEmptySection('Verse', '3/4');
      expect(section.beatsPerBar).toBe(3);
      expect(section.name).toBe('Verse');
    });

    it('6/8拍子の場合、beatsPerBarが6になる', () => {
      const section = createEmptySection('Chorus', '6/8');
      expect(section.beatsPerBar).toBe(6);
      expect(section.name).toBe('Chorus');
    });

    it('12/8拍子の場合、beatsPerBarが12になる', () => {
      const section = createEmptySection('Bridge', '12/8');
      expect(section.beatsPerBar).toBe(12);
      expect(section.name).toBe('Bridge');
    });

    it('デフォルトのパラメータで作成した場合、4/4拍子になる', () => {
      const section = createEmptySection();
      expect(section.beatsPerBar).toBe(4);
      expect(section.name).toBe('セクション');
    });
  });

  describe('createEmptyChordChart', () => {
    it('デフォルトのコード譜を作成する', () => {
      const chart = createEmptyChordChart();
      expect(chart.title).toBe('新しいコード譜');
      expect(chart.timeSignature).toBe('4/4');
      expect(chart.sections).toHaveLength(1);
      expect(chart.sections[0].name).toBe('イントロ');
      expect(chart.sections[0].beatsPerBar).toBe(4);
    });
  });

  describe('createNewChordChart', () => {
    it('指定した拍子でセクションが作成される（4/4）', () => {
      const chart = createNewChordChart({
        title: 'Test Chart',
        timeSignature: '4/4'
      });
      
      expect(chart.title).toBe('Test Chart');
      expect(chart.timeSignature).toBe('4/4');
      expect(chart.sections).toHaveLength(1);
      expect(chart.sections[0].beatsPerBar).toBe(4);
    });

    it('指定した拍子でセクションが作成される（3/4）', () => {
      const chart = createNewChordChart({
        title: 'Waltz',
        timeSignature: '3/4'
      });
      
      expect(chart.timeSignature).toBe('3/4');
      expect(chart.sections[0].beatsPerBar).toBe(3);
    });

    it('指定した拍子でセクションが作成される（6/8）', () => {
      const chart = createNewChordChart({
        title: 'Compound Time',
        timeSignature: '6/8'
      });
      
      expect(chart.timeSignature).toBe('6/8');
      expect(chart.sections[0].beatsPerBar).toBe(6);
    });

    it('指定した拍子でセクションが作成される（12/8）', () => {
      const chart = createNewChordChart({
        title: 'Blues',
        timeSignature: '12/8'
      });
      
      expect(chart.timeSignature).toBe('12/8');
      expect(chart.sections[0].beatsPerBar).toBe(12);
    });

    it('拍子を指定しない場合はデフォルトの4/4になる', () => {
      const chart = createNewChordChart({
        title: 'Default Time'
      });
      
      expect(chart.timeSignature).toBe('4/4');
      expect(chart.sections[0].beatsPerBar).toBe(4);
    });

    it('カスタムセクションが指定された場合はそれを使用する', () => {
      const customSections = [
        createEmptySection('Custom Section', '7/8')
      ];
      
      const chart = createNewChordChart({
        title: 'Custom',
        timeSignature: '3/4',
        sections: customSections
      });
      
      expect(chart.sections).toBe(customSections);
      // カスタムセクションが使われるので、chartのtimeSignatureとは関係なく7/8のbeatsPerBarになる
      expect(chart.sections[0].beatsPerBar).toBe(7);
    });

    it('必須フィールドが正しく設定される', () => {
      const chart = createNewChordChart({});
      
      expect(chart.id).toBeDefined();
      expect(chart.createdAt).toBeInstanceOf(Date);
      expect(chart.updatedAt).toBeInstanceOf(Date);
      expect(chart.tempo).toBe(120);
      expect(chart.key).toBe('C');
    });

    it('tempoが0の場合でも保持される', () => {
      const chart = createNewChordChart({
        tempo: 0
      });
      
      expect(chart.tempo).toBe(0);
    });

    it('tempoが未定義の場合はデフォルト値が使用される', () => {
      const chart = createNewChordChart({
        tempo: undefined
      });
      
      expect(chart.tempo).toBe(120);
    });
  });
});