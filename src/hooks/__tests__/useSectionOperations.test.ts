import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSectionOperations } from '../useSectionOperations';
import type { ChordChart } from '../../types';
import * as chordCopyPaste from '../../utils/chordCopyPaste';

// chordCopyPasteモジュールをモック
vi.mock('../../utils/chordCopyPaste', () => ({
  copyChordProgressionToClipboard: vi.fn(),
  pasteChordProgressionFromClipboard: vi.fn(),
  textToChords: vi.fn(),
}));

describe('useSectionOperations', () => {
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
            { id: 'chord-2', name: 'F', root: 'F', duration: 4, memo: '' }
          ]
        },
        {
          id: 'section-2',
          name: 'Verse',
          beatsPerBar: 4,
          barsCount: 8,
          chords: [
            { id: 'chord-3', name: 'Am', root: 'A', duration: 4, memo: '' },
            { id: 'chord-4', name: 'G', root: 'G', duration: 4, memo: '' }
          ]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockOnUpdateChart = vi.fn();

    vi.clearAllMocks();
  });

  const renderUseSectionOperations = () => {
    return renderHook(() => useSectionOperations({
      chart: mockChart,
      onUpdateChart: mockOnUpdateChart,
    }));
  };

  it('handleSectionChangeがセクションのフィールドを正しく更新する', () => {
    const { result } = renderUseSectionOperations();

    act(() => {
      result.current.handleSectionChange('section-1', 'name', 'New Intro');
    });

    expect(mockOnUpdateChart).toHaveBeenCalledWith({
      ...mockChart,
      sections: [
        { ...mockChart.sections![0], name: 'New Intro' },
        mockChart.sections![1]
      ]
    });
  });

  it('addSectionが新しいセクションを追加する', () => {
    const { result } = renderUseSectionOperations();

    act(() => {
      result.current.addSection();
    });

    expect(mockOnUpdateChart).toHaveBeenCalledWith(
      expect.objectContaining({
        sections: expect.arrayContaining([
          ...mockChart.sections!,
          expect.objectContaining({
            name: '新しいセクション',
            beatsPerBar: 4,
            barsCount: 4,
            chords: []
          })
        ])
      })
    );
  });

  it('deleteSectionが指定されたセクションを削除する', () => {
    const { result } = renderUseSectionOperations();

    act(() => {
      result.current.deleteSection('section-1');
    });

    expect(mockOnUpdateChart).toHaveBeenCalledWith({
      ...mockChart,
      sections: [mockChart.sections![1]]
    });
  });

  it('duplicateSectionがセクションを複製する', () => {
    const { result } = renderUseSectionOperations();

    act(() => {
      result.current.duplicateSection('section-1');
    });

    expect(mockOnUpdateChart).toHaveBeenCalledWith(
      expect.objectContaining({
        sections: expect.arrayContaining([
          mockChart.sections![0],
          expect.objectContaining({
            name: 'Intro (コピー)',
            beatsPerBar: 4,
            barsCount: 4,
            chords: mockChart.sections![0].chords
          }),
          mockChart.sections![1]
        ])
      })
    );
  });

  it('replaceChordProgressionがテキストからコード進行を置換する', () => {
    const mockTextToChords = vi.mocked(chordCopyPaste.textToChords);
    const newChords = [
      { id: 'chord-6', name: 'C', root: 'C', duration: 4, memo: '' },
      { id: 'chord-7', name: 'G', root: 'G', duration: 4, memo: '' }
    ];
    mockTextToChords.mockReturnValue(newChords);

    const { result } = renderUseSectionOperations();

    act(() => {
      result.current.replaceChordProgression('section-1', 'C G');
    });

    expect(mockTextToChords).toHaveBeenCalledWith('C G', 4); // セクションのbeatsPerBar（4）が渡される
    expect(mockOnUpdateChart).toHaveBeenCalledWith({
      ...mockChart,
      sections: [
        {
          ...mockChart.sections![0],
          chords: newChords
        },
        mockChart.sections![1]
      ]
    });
  });

});