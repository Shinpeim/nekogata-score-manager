import { describe, it, expect } from 'vitest';
import {
  migrateData,
  getMigrationStats
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
          { id: 'chord-1', name: 'C', root: 'C', duration: 4, memo: '' },
          { id: 'chord-2', name: 'Am', root: 'A', duration: 4, memo: '' }
        ],
        beatsPerBar: 4, // ここが問題（3/4拍子なのに4拍） - v1マイグレーションで修正されない（version 1.0.0以降はスキップ）
        barsCount: 4
      }
    ],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    notes: undefined // メモ機能がない
  };

  const mockChartWithVersion: ChordChart = {
    ...mockChartV1,
    version: '1.0.0'
  };

  const mockChartV2: ChordChart = {
    ...mockChartV1,
    version: '2.0.0'
  };

  const mockLibraryV1: ChordLibrary = {
    'test-1': mockChartV1
  };

  const mockLibraryWithVersions: ChordLibrary = {
    'test-1': mockChartWithVersion,
    'test-2': { ...mockChartV1, id: 'test-2', version: '1.1.0' }
  };

  const mockLibraryV2: ChordLibrary = {
    'test-1': mockChartV2,
    'test-2': { ...mockChartV1, id: 'test-2', version: '2.0.0' }
  };

  describe('migrateData', () => {
    it('ChordLibraryの各Chartを個別に移行', () => {
      const result = migrateData(mockLibraryV1);
      
      expect(result['test-1']).toBeDefined();
      expect(result['test-1'].sections[0].beatsPerBar).toBe(3); // 3/4拍子に修正
      expect(result['test-1'].notes).toBe(''); // 空文字で初期化
      expect(result['test-1'].version).toBe('3.0.0'); // 最新version追加
    });

    it('旧バージョン情報付きデータを移行', () => {
      const versionedData = {
        version: 1,
        data: mockLibraryV1
      };
      
      const result = migrateData(versionedData);
      
      expect(result['test-1']).toBeDefined();
      expect(result['test-1'].sections[0].beatsPerBar).toBe(3);
      expect(result['test-1'].notes).toBe('');
      expect(result['test-1'].version).toBe('3.0.0');
    });

    it('v1データはv2にマイグレーションされる', () => {
      const result = migrateData(mockLibraryWithVersions);
      
      expect(result['test-1'].version).toBe('3.0.0');
      expect(result['test-2'].version).toBe('3.0.0');
    });

    it('v2データはマイグレーション不要', () => {
      const result = migrateData(mockLibraryV2);
      
      expect(result['test-1'].version).toBe('3.0.0');
      expect(result['test-2'].version).toBe('3.0.0');
    });

    it('空データの場合は空オブジェクトを返す', () => {
      expect(migrateData(null)).toEqual({});
      expect(migrateData(undefined)).toEqual({});
      expect(migrateData({})).toEqual({});
    });

    it('エクスポートデータ形式は空オブジェクトを返す', () => {
      const exportData = {
        version: '1.0.0',
        exportDate: '2023-01-01',
        charts: [mockChartV1]
      };
      
      const result = migrateData(exportData);
      expect(result).toEqual({});
    });
  });

  describe('getMigrationStats', () => {
    it('移行統計を正しく生成', () => {
      const result = getMigrationStats(mockLibraryWithVersions);
      
      expect(result.totalCharts).toBe(2);
      expect(result.chartsWithVersion).toBe(2);
      expect(result.chartsWithoutVersion).toBe(0);
    });

    it('version情報がない場合の統計', () => {
      const libraryWithoutVersions: ChordLibrary = {
        'test-1': { ...mockChartV1, version: undefined },
        'test-2': { ...mockChartV1, id: 'test-2' }
      };
      
      const result = getMigrationStats(libraryWithoutVersions);
      
      expect(result.totalCharts).toBe(2);
      expect(result.chartsWithVersion).toBe(0);
      expect(result.chartsWithoutVersion).toBe(2);
    });

    it('空ライブラリの統計', () => {
      const result = getMigrationStats({});
      
      expect(result.totalCharts).toBe(0);
      expect(result.chartsWithVersion).toBe(0);
      expect(result.chartsWithoutVersion).toBe(0);
    });
  });

  describe('実際の移行シナリオ', () => {
    it('複数のコード譜を含むライブラリの移行', () => {
      const complexLibrary: ChordLibrary = {
        'chart1': {
          ...mockChartV1,
          id: 'chart1',
          timeSignature: '4/4'
        },
        'chart2': {
          ...mockChartV1,
          id: 'chart2',
          timeSignature: '6/8',
          sections: [{
            id: 'section-1',
            name: 'Verse',
            chords: [],
            beatsPerBar: 4, // 6/8拍子なのに4拍 - versionなしなのでv1マイグレーションで修正される
            barsCount: 8
          }]
        }
      };

      const result = migrateData(complexLibrary);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result.chart1.sections[0].beatsPerBar).toBe(4); // 4/4拍子は4拍のまま
      expect(result.chart2.sections[0].beatsPerBar).toBe(6); // 6/8拍子は6拍に修正
      expect(result.chart1.version).toBe('3.0.0');
      expect(result.chart2.version).toBe('3.0.0');
    });

    it('エラーのあるデータの処理', () => {
      const invalidData = "invalid string data";
      
      const result = migrateData(invalidData);
      expect(result).toEqual({});
    });
  });
});