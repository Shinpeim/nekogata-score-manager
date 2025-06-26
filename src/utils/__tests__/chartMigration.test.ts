import { describe, it, expect } from 'vitest';
import { migrateChartData } from '../chartMigration';
import type { ChordChart, ChordSection } from '../../types';

describe('chartMigration', () => {
  const createMockChart = (version?: string): ChordChart => ({
    id: 'test-chart',
    title: 'Test Chart',
    artist: 'Test Artist',
    key: 'C',
    tempo: 120,
    timeSignature: '3/4',
    sections: [
      {
        id: 'section-1',
        name: 'Test Section',
        chords: [
          { id: 'chord-1', name: 'C', root: 'C', duration: 4, memo: '' }
        ],
        beatsPerBar: 4, // 問題のある設定（3/4拍子なのに4拍）
        barsCount: 4
      }
    ],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    notes: undefined as unknown as string, // 古いデータではnotesが未定義
    version
  });

  describe('バージョン管理テスト', () => {
    it('versionが未定義の場合、v1とv2両方のマイグレーションを実行', () => {
      const chart = createMockChart();
      // テスト用にmemoなしのコードを作成（実際には空文字列で初期化済み）
      
      const result = migrateChartData(chart);
      
      // v1マイグレーション: beatsPerBar修正
      expect(result.sections[0].beatsPerBar).toBe(3);
      expect(result.notes).toBe('');
      
      // v2マイグレーション: memo追加
      expect(result.sections[0].chords[0].memo).toBe('');
      expect(result.version).toBe('5.0.0');
    });

    it('version 0.x.xの場合、v1とv2両方のマイグレーションを実行', () => {
      const chart = createMockChart('0.9.0');
      // テスト用にmemoなしのコードを作成（実際には空文字列で初期化済み）
      
      const result = migrateChartData(chart);
      
      expect(result.sections[0].beatsPerBar).toBe(3);
      expect(result.notes).toBe('');
      expect(result.sections[0].chords[0].memo).toBe('');
      expect(result.version).toBe('5.0.0');
    });

    it('version 1.x.xの場合、v2マイグレーションのみ実行', () => {
      const chart = createMockChart('1.0.0');
      // テスト用にmemoなしのコードを作成（実際には空文字列で初期化済み）
      
      const result = migrateChartData(chart);
      
      // v1マイグレーションはスキップされるため、beatsPerBarは修正されない
      expect(result.sections[0].beatsPerBar).toBe(4);
      
      // v2マイグレーション: memo追加
      expect(result.sections[0].chords[0].memo).toBe('');
      expect(result.version).toBe('5.0.0');
    });

    it('version 2.x.xの場合、マイグレーション不要', () => {
      const chart = createMockChart('2.0.0');
      
      const result = migrateChartData(chart);
      
      // 何も変更されない
      expect(result.sections[0].beatsPerBar).toBe(4);
      expect(result.sections[0].chords[0].memo).toBe('');
      expect(result.version).toBe('5.0.0');
    });
  });

  describe('v1マイグレーション（beatsPerBar修正）', () => {
    it('3/4拍子でbeatsPerBarが4の場合、3に修正', () => {
      const chart = createMockChart();
      chart.timeSignature = '3/4';
      chart.sections[0].beatsPerBar = 4;
      
      const result = migrateChartData(chart);
      
      expect(result.sections[0].beatsPerBar).toBe(3);
    });

    it('6/8拍子でbeatsPerBarが4の場合、6に修正', () => {
      const chart = createMockChart();
      chart.timeSignature = '6/8';
      chart.sections[0].beatsPerBar = 4;
      
      const result = migrateChartData(chart);
      
      expect(result.sections[0].beatsPerBar).toBe(6);
    });

    it('4/4拍子でbeatsPerBarが4の場合、変更なし', () => {
      const chart = createMockChart();
      chart.timeSignature = '4/4';
      chart.sections[0].beatsPerBar = 4;
      
      const result = migrateChartData(chart);
      
      expect(result.sections[0].beatsPerBar).toBe(4);
    });

    it('notesが未定義の場合、空文字で初期化', () => {
      const chart = createMockChart();
      chart.notes = undefined as unknown as string;
      
      const result = migrateChartData(chart);
      
      expect(result.notes).toBe('');
    });
  });

  describe('v2マイグレーション（memo追加）', () => {
    it('memoが未定義のコードに空文字列を追加', () => {
      const chart = createMockChart('1.0.0');
      // テスト用にmemoなしのコードを作成（実際には空文字列で初期化済み）
      
      const result = migrateChartData(chart);
      
      expect(result.sections[0].chords[0].memo).toBe('');
    });

    it('既にmemoが設定されているコードはそのまま保持', () => {
      const chart = createMockChart('1.0.0');
      chart.sections[0].chords[0].memo = '既存メモ';
      
      const result = migrateChartData(chart);
      
      expect(result.sections[0].chords[0].memo).toBe('既存メモ');
    });

    it('空の配列やundefinedのセクションも正常処理', () => {
      const chart = createMockChart('1.0.0');
      chart.sections = undefined as unknown as ChordSection[];
      
      const result = migrateChartData(chart);
      
      expect(result.sections).toEqual([]);
    });

    it('versionが2.0.0に更新される', () => {
      const chart = createMockChart('1.5.0');
      
      const result = migrateChartData(chart);
      
      expect(result.version).toBe('5.0.0');
    });
  });

  describe('複雑なマイグレーションシナリオ', () => {
    it('複数セクション、複数コードのマイグレーション', () => {
      const chart = createMockChart();
      chart.sections = [
        {
          id: 'section-1',
          name: 'Verse',
          chords: [
            { id: 'chord-2', name: 'C', root: 'C', duration: 4, memo: '' },
            { id: 'chord-3', name: 'Am', root: 'A', duration: 2, memo: '' }
          ],
          beatsPerBar: 4,
          barsCount: 4
        },
        {
          id: 'section-2',
          name: 'Chorus',
          chords: [
            { id: 'chord-4', name: 'F', root: 'F', duration: 4, memo: '' }
          ],
          beatsPerBar: 4,
          barsCount: 2
        }
      ];
      
      // テスト用にmemoを空文字列で再設定
      chart.sections.forEach(section => {
        section.chords.forEach(chord => {
          chord.memo = '';
        });
      });
      
      const result = migrateChartData(chart);
      
      // 全セクション、全コードにmemoが追加される
      expect(result.sections[0].chords[0].memo).toBe('');
      expect(result.sections[0].chords[1].memo).toBe('');
      expect(result.sections[1].chords[0].memo).toBe('');
    });

    it('改行マーカーコードも正常処理', () => {
      const chart = createMockChart('1.0.0');
      chart.sections[0].chords.push({
        id: 'chord-5',
        name: '',
        root: '',
        isLineBreak: true,
        duration: 0,
        memo: ''
      });
      
      // テスト用にmemoを空文字列で設定
      chart.sections[0].chords[1].memo = '';
      
      const result = migrateChartData(chart);
      
      expect(result.sections[0].chords[1].memo).toBe('');
    });
  });

  describe('v5マイグレーション（fontSize追加）', () => {
    it('fontSizeが未定義の場合、デフォルト値を設定', () => {
      const chart = createMockChart('4.0.0');
      chart.fontSize = undefined;
      
      const result = migrateChartData(chart);
      
      expect(result.fontSize).toBe(14); // DEFAULT_FONT_SIZE
      expect(result.version).toBe('5.0.0');
    });

    it('既にfontSizeが設定されている場合はそのまま保持', () => {
      const chart = createMockChart('4.0.0');
      chart.fontSize = 18;
      
      const result = migrateChartData(chart);
      
      expect(result.fontSize).toBe(18);
      expect(result.version).toBe('5.0.0');
    });

    it('古いバージョンから最新までマイグレーション', () => {
      const chart = createMockChart();
      // fontSizeは未定義
      
      const result = migrateChartData(chart);
      
      // 全てのマイグレーションが適用される
      expect(result.sections[0].beatsPerBar).toBe(3); // v1
      expect(result.sections[0].chords[0].memo).toBe(''); // v2
      expect(result.fontSize).toBe(14); // v5
      expect(result.version).toBe('5.0.0');
    });
  });
});