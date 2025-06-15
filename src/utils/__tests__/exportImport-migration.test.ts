import { describe, it, expect } from 'vitest';
import { parseImportData } from '../exportImport';
import type { ChordChart, ChordLibrary } from '../../types';

describe('ExportImport Migration Integration', () => {
  const mockChartV1: ChordChart = {
    id: 'test-1',
    title: 'テストソング',
    artist: 'テストアーティスト',
    key: 'C',
    tempo: 120,
    timeSignature: '3/4',
    sections: [
      {
        id: 'section-1',
        name: 'Aメロ',
        chords: [
          { name: 'C', root: 'C', duration: 4 },
          { name: 'Am', root: 'A', duration: 4 }
        ],
        beatsPerBar: 4, // 3/4拍子なのに4拍（要修正）
        barsCount: 4
      }
    ],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    tags: ['test'],
    notes: undefined // メモ機能がない（要追加）
  };

  describe('ストレージデータ形式のインポート', () => {
    it('バージョン1のChordLibraryデータをマイグレーション', () => {
      const oldLibrary: ChordLibrary = {
        'test-1': mockChartV1
      };
      
      const jsonString = JSON.stringify(oldLibrary);
      const result = parseImportData(jsonString);
      
      expect(result.success).toBe(true);
      expect(result.charts).toHaveLength(1);
      
      const migratedChart = result.charts[0];
      
      // beatsPerBarが修正されている
      expect(migratedChart.sections[0].beatsPerBar).toBe(3);
      
      // メモ機能が追加されている
      expect(migratedChart.notes).toBe('');
      
      // マイグレーション情報が含まれている
      expect(result.migrationInfo).toBeDefined();
      expect(result.migrationInfo?.migrationPerformed).toBe(true);
      expect(result.migrationInfo?.originalVersion).toBe(1);
      expect(result.migrationInfo?.currentVersion).toBe(2);
      
      // 警告メッセージが含まれている
      expect(result.warnings).toContain('データをバージョン1から2に移行しました');
    });

    it('バージョン情報付きの古いChordLibraryデータをマイグレーション', () => {
      const versionedOldData = {
        version: 1,
        data: { 'test-1': mockChartV1 },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const jsonString = JSON.stringify(versionedOldData);
      const result = parseImportData(jsonString);
      
      expect(result.success).toBe(true);
      expect(result.migrationInfo?.migrationPerformed).toBe(true);
      expect(result.charts[0].sections[0].beatsPerBar).toBe(3);
      expect(result.charts[0].notes).toBe('');
    });

    it('最新バージョンのChordLibraryデータはマイグレーション不要', () => {
      const validCurrentChart = {
        ...mockChartV1,
        notes: '',
        sections: [{
          ...mockChartV1.sections[0],
          beatsPerBar: 3,
          chords: mockChartV1.sections[0].chords
        }]
      };
      
      const currentVersionData = {
        version: 2,
        data: { 'test-1': validCurrentChart },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const jsonString = JSON.stringify(currentVersionData);
      const result = parseImportData(jsonString);
      
      expect(result.success).toBe(true);
      expect(result.migrationInfo?.migrationPerformed).toBe(false);
    });
  });

  describe('エクスポートデータ形式のインポート', () => {
    it('バージョン1のエクスポートデータをマイグレーション', () => {
      const oldExportData = {
        version: '1.0.0',
        exportDate: '2023-01-01T00:00:00.000Z',
        charts: [mockChartV1]
      };
      
      const jsonString = JSON.stringify(oldExportData);
      const result = parseImportData(jsonString);
      
      expect(result.success).toBe(true);
      expect(result.charts).toHaveLength(1);
      
      const migratedChart = result.charts[0];
      expect(migratedChart.sections[0].beatsPerBar).toBe(3);
      expect(migratedChart.notes).toBe('');
      
      expect(result.migrationInfo?.migrationPerformed).toBe(true);
      expect(result.warnings).toContain('エクスポートデータをバージョン1から2に移行しました');
    });

    it('現在バージョンのエクスポートデータもマイグレーションが実行される', () => {
      // エクスポートデータ内のコード譜は常にバージョン1として扱われる
      const currentExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        charts: [{ ...mockChartV1, notes: '', sections: [{ ...mockChartV1.sections[0], beatsPerBar: 3 }] }]
      };
      
      const jsonString = JSON.stringify(currentExportData);
      const result = parseImportData(jsonString);
      
      expect(result.success).toBe(true);
      // エクスポートデータは形式上常にマイグレーション処理が実行される
      expect(result.migrationInfo?.migrationPerformed).toBe(true);
    });
  });

  describe('レガシーデータ形式のインポート', () => {
    it('ChordChart配列形式の古いデータをマイグレーション', () => {
      const oldArrayData = [mockChartV1];
      
      const jsonString = JSON.stringify(oldArrayData);
      const result = parseImportData(jsonString);
      
      expect(result.success).toBe(true);
      expect(result.charts).toHaveLength(1);
      expect(result.charts[0].sections[0].beatsPerBar).toBe(3);
      expect(result.charts[0].notes).toBe('');
      expect(result.warnings).toContain('データをバージョン1から2に移行しました');
    });

    it('単一ChordChart形式の古いデータをマイグレーション', () => {
      const jsonString = JSON.stringify(mockChartV1);
      const result = parseImportData(jsonString);
      
      expect(result.success).toBe(true);
      expect(result.charts).toHaveLength(1);
      expect(result.charts[0].sections[0].beatsPerBar).toBe(3);
      expect(result.charts[0].notes).toBe('');
      expect(result.warnings).toContain('単一のコード譜ファイルです。');
    });
  });

  describe('複数コード譜の一括マイグレーション', () => {
    it('複数の古いコード譜データを一括マイグレーション', () => {
      const multipleOldCharts: ChordLibrary = {
        'chart-1': mockChartV1,
        'chart-2': {
          ...mockChartV1,
          id: 'chart-2',
          title: 'ソング2',
          timeSignature: '4/4',
          sections: [
            {
              id: 'section-2',
              name: 'Bメロ',
              chords: [{ name: 'D', root: 'D', duration: 2 }],
              beatsPerBar: 4, // 4/4拍子で正しい
              barsCount: 2
            }
          ]
        }
      };
      
      const jsonString = JSON.stringify(multipleOldCharts);
      const result = parseImportData(jsonString);
      
      expect(result.success).toBe(true);
      expect(result.charts).toHaveLength(2);
      
      // 移行されたチャートを確認
      expect(result.charts.every(chart => typeof chart.notes === 'string')).toBe(true);
      
      // 3/4拍子のチャートは3拍に修正される
      const chart34 = result.charts.find(c => c.timeSignature === '3/4');
      expect(chart34?.sections[0].beatsPerBar).toBe(3);
      
      // 4/4拍子のチャートは4拍のまま
      const chart44 = result.charts.find(c => c.timeSignature === '4/4');
      expect(chart44?.sections[0].beatsPerBar).toBe(4);
      
      expect(result.migrationInfo?.migrationPerformed).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    it('無効なJSONの場合はエラーを返す', () => {
      const result = parseImportData('invalid json');
      
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('JSONの解析に失敗しました');
    });

    it('不正なデータ形式の場合はエラーを返す', () => {
      const invalidData = { invalidField: 'value' };
      const jsonString = JSON.stringify(invalidData);
      const result = parseImportData(jsonString);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('無効なデータフォーマットです');
    });

    // 注意: 破損データの処理も含めて、複雑なケースは別途改善が必要です
  });
});