import { 
  transposeChordName, 
  calculateSemitonesDifference, 
  transposeChart 
} from '../transpose';
import type { ChordChart } from '../../types';

describe('移調機能のテスト', () => {
  describe('transposeChordName', () => {
    test('基本的なコード名の移調', () => {
      expect(transposeChordName('C', 2, 'D')).toBe('D');
      expect(transposeChordName('Am', 2, 'D')).toBe('Bm');
      expect(transposeChordName('F#7', -1, 'F')).toBe('F7');
    });

    test('♭を含むコード名の移調', () => {
      expect(transposeChordName('B♭', 2, 'C')).toBe('C');
      expect(transposeChordName('E♭m', 3, 'Gb')).toBe('G♭m');
    });

    test('複雑なコード名の移調', () => {
      expect(transposeChordName('Cmaj7', 5, 'F')).toBe('Fmaj7');
      expect(transposeChordName('Am7(♭5)', 2, 'D')).toBe('Bm7(♭5)');
      expect(transposeChordName('D7(#9)', -2, 'C')).toBe('C7(#9)');
    });

    test('オンコードの移調', () => {
      expect(transposeChordName('C/E', 2, 'D')).toBe('D/F#');
      expect(transposeChordName('Am/C', 3, 'Eb')).toBe('Cm/E♭');
      expect(transposeChordName('F#m/A', -1, 'F')).toBe('Fm/A♭');
    });

    test('キーに応じた適切な音名選択', () => {
      // Fキーでは♭を使用
      expect(transposeChordName('C', 5, 'F')).toBe('F');
      expect(transposeChordName('D', 3, 'F')).toBe('F');
      expect(transposeChordName('G', 3, 'F')).toBe('B♭');
      
      // Dキーでは#を使用
      expect(transposeChordName('C', 2, 'D')).toBe('D');
      expect(transposeChordName('F', 2, 'D')).toBe('G');
      expect(transposeChordName('G', 4, 'D')).toBe('B');
    });

    test('無効な入力の処理', () => {
      expect(transposeChordName('', 2, 'D')).toBe('C');
      expect(transposeChordName('Invalid', 2, 'D')).toBe('Invalid');
    });

    test('N.C. (No Chord) の処理', () => {
      expect(transposeChordName('N.C.', 2, 'D')).toBe('N.C.');
      expect(transposeChordName('NC', 5, 'F')).toBe('NC');
      expect(transposeChordName('n.c.', -3, 'A')).toBe('n.c.');
      expect(transposeChordName('nc', 7, 'G')).toBe('nc');
    });
  });

  describe('calculateSemitonesDifference', () => {
    test('キー間の半音数計算', () => {
      expect(calculateSemitonesDifference('C', 'D')).toBe(2);
      expect(calculateSemitonesDifference('C', 'F')).toBe(5);
      expect(calculateSemitonesDifference('G', 'C')).toBe(-7);
      expect(calculateSemitonesDifference('Db', 'Gb')).toBe(5);
    });

    test('同じキーの場合', () => {
      expect(calculateSemitonesDifference('C', 'C')).toBe(0);
      expect(calculateSemitonesDifference('F#', 'Gb')).toBe(0); // 異名同音
    });
  });

  describe('transposeChart', () => {
    const createTestChart = (): ChordChart => ({
      id: 'test-1',
      title: 'テスト楽曲',
      key: 'C',
      timeSignature: '4/4',
      sections: [
        {
          id: 'section-1',
          name: 'Aメロ',
          chords: [
            { id: 'chord-1', name: 'C', root: 'C', duration: 2, memo: '' },
            { id: 'chord-2', name: 'Am', root: 'A', duration: 2, memo: '' },
            { id: 'chord-3', name: 'F/A', root: 'F', base: 'A', duration: 2, memo: '' },
            { id: 'chord-4', name: 'G7', root: 'G', duration: 2, memo: '' }
          ],
          beatsPerBar: 4,
          barsCount: 4
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    test('コード譜全体の移調', () => {
      const chart = createTestChart();
      const transposed = transposeChart(chart, 'D');

      expect(transposed.key).toBe('D');
      expect(transposed.sections[0].chords[0].name).toBe('D');
      expect(transposed.sections[0].chords[0].root).toBe('D');
      expect(transposed.sections[0].chords[1].name).toBe('Bm');
      expect(transposed.sections[0].chords[1].root).toBe('B');
      expect(transposed.sections[0].chords[2].name).toBe('G/B');
      expect(transposed.sections[0].chords[2].root).toBe('G');
      expect(transposed.sections[0].chords[2].base).toBe('B');
      expect(transposed.sections[0].chords[3].name).toBe('A7');
      expect(transposed.sections[0].chords[3].root).toBe('A');
    });

    test('♭キーへの移調', () => {
      const chart = createTestChart();
      const transposed = transposeChart(chart, 'Bb');

      expect(transposed.key).toBe('Bb');
      expect(transposed.sections[0].chords[0].name).toBe('B♭');
      expect(transposed.sections[0].chords[1].name).toBe('Gm');
      expect(transposed.sections[0].chords[2].name).toBe('E♭/G');
      expect(transposed.sections[0].chords[3].name).toBe('F7');
    });

    test('同じキーへの移調（移調なし）', () => {
      const chart = createTestChart();
      const transposed = transposeChart(chart, 'C');

      expect(transposed.key).toBe('C');
      expect(transposed.sections[0].chords[0].name).toBe('C');
      expect(transposed.sections[0].chords[1].name).toBe('Am');
      expect(transposed.sections[0].chords[2].name).toBe('F/A');
      expect(transposed.sections[0].chords[3].name).toBe('G7');
    });

    test('改行マーカーの処理', () => {
      const chart = createTestChart();
      chart.sections[0].chords.push({ 
        id: 'chord-5',
        name: '', 
        root: '', 
        isLineBreak: true,
        memo: ''
      });

      const transposed = transposeChart(chart, 'D');
      const lineBreakChord = transposed.sections[0].chords[4];

      expect(lineBreakChord.isLineBreak).toBe(true);
      expect(lineBreakChord.name).toBe('');
      expect(lineBreakChord.root).toBe('');
    });

    test('N.C. (No Chord) を含むコード譜の移調', () => {
      const chart = createTestChart();
      chart.sections[0].chords = [
        { id: 'chord-1', name: 'C', root: 'C', duration: 2, memo: '' },
        { id: 'chord-2', name: 'N.C.', root: 'N.C.', duration: 2, memo: '' },
        { id: 'chord-3', name: 'G', root: 'G', duration: 2, memo: '' },
        { id: 'chord-4', name: 'NC', root: 'N.C.', duration: 2, memo: '' }
      ];

      const transposed = transposeChart(chart, 'D');
      
      expect(transposed.sections[0].chords[0].name).toBe('D');
      expect(transposed.sections[0].chords[0].root).toBe('D');
      expect(transposed.sections[0].chords[1].name).toBe('N.C.');
      expect(transposed.sections[0].chords[1].root).toBe('N.C.');
      expect(transposed.sections[0].chords[2].name).toBe('A');
      expect(transposed.sections[0].chords[2].root).toBe('A');
      expect(transposed.sections[0].chords[3].name).toBe('NC');
      expect(transposed.sections[0].chords[3].root).toBe('N.C.');
    });

    test('拍数の保持', () => {
      const chart = createTestChart();
      const transposed = transposeChart(chart, 'F');

      transposed.sections[0].chords.forEach((chord, index) => {
        if (!chord.isLineBreak) {
          expect(chord.duration).toBe(chart.sections[0].chords[index].duration);
        }
      });
    });

    test('updatedAtの更新', () => {
      const chart = createTestChart();
      const originalUpdatedAt = chart.updatedAt;
      
      // 少し待ってから移調実行
      setTimeout(() => {
        const transposed = transposeChart(chart, 'G');
        expect(transposed.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });
});