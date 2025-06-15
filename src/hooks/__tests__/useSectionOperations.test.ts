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
            { name: 'C', root: 'C', duration: 4 },
            { name: 'F', root: 'F', duration: 4 }
          ]
        },
        {
          id: 'section-2',
          name: 'Verse',
          beatsPerBar: 4,
          barsCount: 8,
          chords: [
            { name: 'Am', root: 'A', duration: 4 },
            { name: 'G', root: 'G', duration: 4 }
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

  const renderUseSectionOperations = () => {
    return renderHook(() => useSectionOperations({
      chart: mockChart,
      onUpdateChart: mockOnUpdateChart,
      selectedChords: new Set(),
      setSelectedChords: mockSetSelectedChords,
      setLastSelectedChord: mockSetLastSelectedChord,
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

  it('copyChordProgressionがクリップボードにコピーする', async () => {
    const mockCopy = vi.mocked(chordCopyPaste.copyChordProgressionToClipboard);
    mockCopy.mockResolvedValue(true);

    const { result } = renderUseSectionOperations();

    await act(async () => {
      await result.current.copyChordProgression('section-1');
    });

    expect(mockCopy).toHaveBeenCalledWith(mockChart.sections![0].chords);
    expect(result.current.copiedMessage).toContain('「Intro」のコード進行をコピーしました');
  });

  it('pasteChordProgressionがクリップボードからコードを追加する', async () => {
    const mockPaste = vi.mocked(chordCopyPaste.pasteChordProgressionFromClipboard);
    const pastedChords = [{ name: 'D', root: 'D', duration: 4 }];
    mockPaste.mockResolvedValue(pastedChords);

    const { result } = renderUseSectionOperations();

    await act(async () => {
      await result.current.pasteChordProgression('section-1');
    });

    expect(mockOnUpdateChart).toHaveBeenCalledWith({
      ...mockChart,
      sections: [
        {
          ...mockChart.sections![0],
          chords: [...mockChart.sections![0].chords, ...pastedChords]
        },
        mockChart.sections![1]
      ]
    });
  });

  it('replaceChordProgressionがテキストからコード進行を置換する', () => {
    const mockTextToChords = vi.mocked(chordCopyPaste.textToChords);
    const newChords = [
      { name: 'C', root: 'C', duration: 4 },
      { name: 'G', root: 'G', duration: 4 }
    ];
    mockTextToChords.mockReturnValue(newChords);

    const { result } = renderUseSectionOperations();

    act(() => {
      result.current.replaceChordProgression('section-1', 'C G');
    });

    expect(mockTextToChords).toHaveBeenCalledWith('C G');
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

  it('toggleSelectAllInSectionがセクション内のコードを全選択/全解除する', () => {
    const selectedChords = new Set<string>();
    const { result } = renderHook(() => useSectionOperations({
      chart: mockChart,
      onUpdateChart: mockOnUpdateChart,
      selectedChords,
      setSelectedChords: mockSetSelectedChords,
      setLastSelectedChord: mockSetLastSelectedChord,
    }));

    act(() => {
      result.current.toggleSelectAllInSection('section-1');
    });

    expect(mockSetSelectedChords).toHaveBeenCalledWith(
      new Set(['section-1-0', 'section-1-1'])
    );
  });
});