import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChordOperations } from '../useChordOperations';
import type { ChordChart } from '../../types';
import * as chordParsing from '../../utils/chordParsing';

// chordParsingモジュールをモック
vi.mock('../../utils/chordParsing', () => ({
  extractChordRoot: vi.fn(),
  parseOnChord: vi.fn(),
  parseChordInput: vi.fn(),
}));

vi.mock('../../utils/lineBreakHelpers', () => ({
  createLineBreakMarker: vi.fn(() => ({ type: 'lineBreak' })),
  isLineBreakMarker: vi.fn(() => false),
}));

describe('useChordOperations', () => {
  let mockChart: ChordChart;
  let mockOnUpdateChart: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockChart = {
      id: 'test-chart',
      title: 'Test Chart',
      artist: 'Test Artist',
      key: 'C',
      tempo: 120,
      timeSignature: '4/4',
      sections: [
        {
          id: 'section-1',
          name: 'Intro',
          beatsPerBar: 4,
          barsCount: 4,
          chords: [
            { id: 'chord-1', name: 'C', root: 'C', duration: 4, memo: '' },
            { id: 'chord-2', name: 'F', root: 'F', duration: 4, memo: '' },
            { id: 'chord-3', name: 'G', root: 'G', duration: 4, memo: '' }
          ]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockOnUpdateChart = vi.fn();

    vi.clearAllMocks();
  });

  const renderUseChordOperations = () => {
    return renderHook(() => useChordOperations({
      chart: mockChart,
      onUpdateChart: mockOnUpdateChart,
    }));
  };

  it('addChordToSectionが新しいコードを追加する', () => {
    const { result } = renderUseChordOperations();

    act(() => {
      result.current.addChordToSection('section-1');
    });

    // 呼び出されたコールをチェック
    expect(mockOnUpdateChart).toHaveBeenCalled();
    const calledWith = mockOnUpdateChart.mock.calls[0][0];
    
    // 新しいコードが追加されていることを確認
    expect(calledWith.sections[0].chords).toHaveLength(4);
    const newChord = calledWith.sections[0].chords[3];
    
    // 新しいコードの基本プロパティを確認（idは動的生成されるため除外）
    expect(newChord.name).toBe('');
    expect(newChord.root).toBe('');
    expect(newChord.duration).toBe(4); // セクションのbeatsPerBar（4）がデフォルトとして設定される
    expect(newChord.memo).toBe('');
    expect(newChord.id).toBeDefined(); // idが存在することを確認
  });

  it('updateChordInSectionがコードのフィールドを更新する', () => {
    const { result } = renderUseChordOperations();

    act(() => {
      result.current.updateChordInSection('section-1', 0, 'name', 'Am');
    });

    expect(mockOnUpdateChart).toHaveBeenCalledWith({
      ...mockChart,
      sections: [
        {
          ...mockChart.sections![0],
          chords: [
            { id: 'chord-1', name: 'Am', root: 'C', duration: 4, memo: '' },
            { id: 'chord-2', name: 'F', root: 'F', duration: 4, memo: '' },
            { id: 'chord-3', name: 'G', root: 'G', duration: 4, memo: '' }
          ]
        }
      ]
    });
  });

  it('finalizeChordNameがコード名をパースして更新する', () => {
    const mockParseChordInput = vi.mocked(chordParsing.parseChordInput);
    
    // parseChordInputが期待するオブジェクトを返すようにモック
    mockParseChordInput.mockReturnValue({
      id: 'chord-new',
      name: 'Am',
      root: 'A',
      base: 'C',
      duration: 4,
      memo: ''
    });

    const { result } = renderUseChordOperations();

    act(() => {
      result.current.finalizeChordName('section-1', 0, 'Am/C');
    });

    expect(mockParseChordInput).toHaveBeenCalledWith('Am/C', 4); // デフォルト拍数4で呼び出される
    expect(mockOnUpdateChart).toHaveBeenCalledWith({
      ...mockChart,
      sections: [
        {
          ...mockChart.sections![0],
          chords: [
            { id: 'chord-1', name: 'Am', root: 'A', duration: 4, base: 'C', memo: '' },
            { id: 'chord-2', name: 'F', root: 'F', duration: 4, memo: '' },
            { id: 'chord-3', name: 'G', root: 'G', duration: 4, memo: '' }
          ]
        }
      ]
    });
  });

  it('deleteChordFromSectionがコードを削除する', () => {
    const { result } = renderUseChordOperations();

    act(() => {
      result.current.deleteChordFromSection('section-1', 1);
    });

    expect(mockOnUpdateChart).toHaveBeenCalledWith({
      ...mockChart,
      sections: [
        {
          ...mockChart.sections![0],
          chords: [
            { id: 'chord-1', name: 'C', root: 'C', duration: 4, memo: '' },
            { id: 'chord-3', name: 'G', root: 'G', duration: 4, memo: '' }
          ]
        }
      ]
    });
  });

  it('insertLineBreakAfterChordが改行マーカーを挿入する', () => {
    const { result } = renderUseChordOperations();

    act(() => {
      result.current.insertLineBreakAfterChord('section-1', 0);
    });

    expect(mockOnUpdateChart).toHaveBeenCalledWith({
      ...mockChart,
      sections: [
        {
          ...mockChart.sections![0],
          chords: [
            { id: 'chord-1', name: 'C', root: 'C', duration: 4, memo: '' },
            { type: 'lineBreak' },
            { id: 'chord-2', name: 'F', root: 'F', duration: 4, memo: '' },
            { id: 'chord-3', name: 'G', root: 'G', duration: 4, memo: '' }
          ]
        }
      ]
    });
  });

});