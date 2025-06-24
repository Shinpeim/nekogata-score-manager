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
  let mockSetSelectedChords: ReturnType<typeof vi.fn>;
  let mockSetLastSelectedChord: ReturnType<typeof vi.fn>;

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
            { name: 'C', root: 'C', duration: 4, memo: '' },
            { name: 'F', root: 'F', duration: 4, memo: '' },
            { name: 'G', root: 'G', duration: 4, memo: '' }
          ]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockOnUpdateChart = vi.fn();
    mockSetSelectedChords = vi.fn();
    mockSetLastSelectedChord = vi.fn();

    vi.clearAllMocks();
  });

  const renderUseChordOperations = (selectedChords = new Set<string>(), lastSelectedChord: string | null = null) => {
    return renderHook(() => useChordOperations({
      chart: mockChart,
      onUpdateChart: mockOnUpdateChart,
      selectedChords,
      setSelectedChords: mockSetSelectedChords,
      lastSelectedChord,
      setLastSelectedChord: mockSetLastSelectedChord,
    }));
  };

  it('addChordToSectionが新しいコードを追加する', () => {
    const { result } = renderUseChordOperations();

    act(() => {
      result.current.addChordToSection('section-1');
    });

    expect(mockOnUpdateChart).toHaveBeenCalledWith({
      ...mockChart,
      sections: [
        {
          ...mockChart.sections![0],
          chords: [
            ...mockChart.sections![0].chords,
            { name: '', root: '', duration: undefined, memo: '' }
          ]
        }
      ]
    });
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
            { name: 'Am', root: 'C', duration: 4, memo: '' },
            { name: 'F', root: 'F', duration: 4, memo: '' },
            { name: 'G', root: 'G', duration: 4, memo: '' }
          ]
        }
      ]
    });
  });

  it('finalizeChordNameがコード名をパースして更新する', () => {
    const mockParseChordInput = vi.mocked(chordParsing.parseChordInput);
    
    // parseChordInputが期待するオブジェクトを返すようにモック
    mockParseChordInput.mockReturnValue({
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
            { name: 'Am', root: 'A', duration: 4, base: 'C', memo: '' },
            { name: 'F', root: 'F', duration: 4, memo: '' },
            { name: 'G', root: 'G', duration: 4, memo: '' }
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
            { name: 'C', root: 'C', duration: 4, memo: '' },
            { name: 'G', root: 'G', duration: 4, memo: '' }
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
            { name: 'C', root: 'C', duration: 4, memo: '' },
            { type: 'lineBreak' },
            { name: 'F', root: 'F', duration: 4, memo: '' },
            { name: 'G', root: 'G', duration: 4, memo: '' }
          ]
        }
      ]
    });
  });

  it('toggleChordSelectionが単一コードの選択状態を切り替える', () => {
    const selectedChords = new Set<string>();
    const { result } = renderUseChordOperations(selectedChords);

    act(() => {
      result.current.toggleChordSelection('section-1', 0);
    });

    expect(mockSetSelectedChords).toHaveBeenCalledWith(new Set(['section-1-0']));
    expect(mockSetLastSelectedChord).toHaveBeenCalledWith('section-1-0');
  });

  it('toggleChordSelectionでShiftキーを押しながらクリックすると範囲選択する', () => {
    const selectedChords = new Set<string>();
    const { result } = renderUseChordOperations(selectedChords, 'section-1-0');

    const mockEvent = { shiftKey: true } as React.MouseEvent;

    act(() => {
      result.current.toggleChordSelection('section-1', 2, mockEvent);
    });

    expect(mockSetSelectedChords).toHaveBeenCalledWith(
      new Set(['section-1-0', 'section-1-1', 'section-1-2'])
    );
    expect(mockSetLastSelectedChord).toHaveBeenCalledWith('section-1-2');
  });

  it('既に選択されているコードをクリックすると選択解除する', () => {
    const selectedChords = new Set(['section-1-0']);
    const { result } = renderUseChordOperations(selectedChords);

    act(() => {
      result.current.toggleChordSelection('section-1', 0);
    });

    expect(mockSetSelectedChords).toHaveBeenCalledWith(new Set());
    expect(mockSetLastSelectedChord).toHaveBeenCalledWith('section-1-0');
  });
});