import { describe, it, expect } from 'vitest';
import {
  getDataVersion,
  wrapWithVersion,
  extractChordLibrary,
  needsMigration,
  migrateData,
  getMigrationStats,
  previewMigration,
  CURRENT_DATA_VERSION
} from '../migration';
import type { ChordChart, ChordLibrary } from '../../types';

describe('Migration Utils', () => {
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
        beatsPerBar: 4, // ここが問題（3/4拍子なのに4拍）
        barsCount: 4
      }
    ],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    tags: ['test'],
    notes: undefined // メモ機能がない
  };

  const mockLibraryV1: ChordLibrary = {
    'test-1': mockChartV1
  };

  describe('getDataVersion', () => {
    it('バージョン情報付きデータからバージョンを取得', () => {
      const versionedData = {
        version: 2,
        data: mockLibraryV1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(getDataVersion(versionedData)).toBe(2);
    });

    it('バージョン情報なしの古いデータからはバージョン1を返す', () => {
      expect(getDataVersion(mockLibraryV1)).toBe(1);
    });

    it('空データからは最新バージョンを返す', () => {
      expect(getDataVersion(null)).toBe(CURRENT_DATA_VERSION);
      expect(getDataVersion(undefined)).toBe(CURRENT_DATA_VERSION);
    });
  });

  describe('wrapWithVersion and extractChordLibrary', () => {
    it('データをバージョン情報で包装し、抽出できる', () => {
      const wrapped = wrapWithVersion(mockLibraryV1);
      
      expect(wrapped.version).toBe(CURRENT_DATA_VERSION);
      expect(wrapped.data).toEqual(mockLibraryV1);
      expect(wrapped.createdAt).toBeInstanceOf(Date);
      expect(wrapped.updatedAt).toBeInstanceOf(Date);
      
      const extracted = extractChordLibrary(wrapped);
      expect(extracted).toEqual(mockLibraryV1);
    });
  });

  describe('needsMigration', () => {
    it('古いバージョンは移行が必要', () => {
      expect(needsMigration(1)).toBe(true);
    });

    it('最新バージョンは移行不要', () => {
      expect(needsMigration(CURRENT_DATA_VERSION)).toBe(false);
    });

    it('未来のバージョンは移行不要', () => {
      expect(needsMigration(CURRENT_DATA_VERSION + 1)).toBe(false);
    });
  });

  describe('migrateData', () => {
    it('バージョン1のデータを最新バージョンに移行', () => {
      const migrated = migrateData(mockLibraryV1);
      
      expect(migrated).toBeDefined();
      expect(migrated['test-1']).toBeDefined();
      
      const migratedChart = migrated['test-1'];
      
      // beatsPerBarが拍子に応じて修正されている
      expect(migratedChart.sections[0].beatsPerBar).toBe(3);
      
      // メモ機能が初期化されている
      expect(migratedChart.notes).toBe('');
    });

    it('バージョン情報付きの古いデータを移行', () => {
      const versionedOldData = {
        version: 1,
        data: mockLibraryV1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const migrated = migrateData(versionedOldData);
      
      expect(migrated['test-1'].sections[0].beatsPerBar).toBe(3);
      expect(migrated['test-1'].notes).toBe('');
    });

    it('最新バージョンのデータはそのまま返す', () => {
      const currentVersionData = wrapWithVersion(mockLibraryV1);
      const result = migrateData(currentVersionData);
      
      expect(result).toEqual(mockLibraryV1);
    });

    it('空データの場合は空オブジェクトを返す', () => {
      expect(migrateData(null)).toEqual({});
      expect(migrateData(undefined)).toEqual({});
    });
  });

  describe('getMigrationStats', () => {
    it('移行統計を正しく生成', () => {
      const migratedData = migrateData(mockLibraryV1);
      const stats = getMigrationStats(1, migratedData);
      
      expect(stats.originalVersion).toBe(1);
      expect(stats.currentVersion).toBe(CURRENT_DATA_VERSION);
      expect(stats.totalCharts).toBe(1);
      expect(stats.migrationPerformed).toBe(true);
      expect(stats.migrationSteps).toContain('v1 → v2: beatsPerBar修正版、メモ機能追加');
    });

    it('移行が不要な場合の統計', () => {
      const stats = getMigrationStats(CURRENT_DATA_VERSION, mockLibraryV1);
      
      expect(stats.migrationPerformed).toBe(false);
      expect(stats.migrationSteps).toEqual([]);
    });
  });

  describe('previewMigration', () => {
    it('移行プレビューを正しく生成', () => {
      const preview = previewMigration(mockLibraryV1);
      
      expect(preview.currentVersion).toBe(1);
      expect(preview.targetVersion).toBe(CURRENT_DATA_VERSION);
      expect(preview.needsMigration).toBe(true);
      expect(preview.chartCount).toBe(1);
      expect(preview.migrationSteps).toContain('beatsPerBar修正版、メモ機能追加');
    });

    it('最新バージョンの場合は移行不要と表示', () => {
      const currentData = wrapWithVersion(mockLibraryV1);
      const preview = previewMigration(currentData);
      
      expect(preview.needsMigration).toBe(false);
      expect(preview.migrationSteps).toEqual([]);
    });

    it('空データの場合', () => {
      const preview = previewMigration(null);
      
      expect(preview.chartCount).toBe(0);
      expect(preview.needsMigration).toBe(false);
    });
  });

  describe('実際の移行シナリオ', () => {
    it('複数のコード譜を含むライブラリの移行', () => {
      const largeLibrary: ChordLibrary = {
        'chart-1': {
          ...mockChartV1,
          id: 'chart-1',
          title: 'ソング1'
        },
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

      const migrated = migrateData(largeLibrary);
      
      // chart-1は3/4拍子なので3拍に修正される
      expect(migrated['chart-1'].sections[0].beatsPerBar).toBe(3);
      expect(migrated['chart-1'].notes).toBe('');
      
      // chart-2は4/4拍子で元々正しいのでそのまま
      expect(migrated['chart-2'].sections[0].beatsPerBar).toBe(4);
      expect(migrated['chart-2'].notes).toBe('');
    });

    it('エラーのあるデータの処理', () => {
      const corruptedData = {
        'invalid-chart': {
          // 不完全なデータ
          id: 'invalid-chart',
          title: 'テスト'
          // 他の必要なフィールドが欠けている
        }
      };

      // エラーが発生しても処理が継続される
      expect(() => migrateData(corruptedData)).not.toThrow();
    });
  });
});