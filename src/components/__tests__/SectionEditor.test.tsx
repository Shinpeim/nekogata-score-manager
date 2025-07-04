import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SectionEditor from '../SectionEditor';
import type { ChordChart } from '../../types';

describe('SectionEditor - セクション入れ替え機能', () => {
  const mockChart: ChordChart = {
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
      },
      {
        id: 'section-3',
        name: 'Chorus',
        beatsPerBar: 4,
        barsCount: 8,
        chords: [
          { id: 'chord-5', name: 'C', root: 'C', duration: 2, memo: '' },
          { id: 'chord-6', name: 'G', root: 'G', duration: 2, memo: '' }
        ]
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockOnUpdateChart = vi.fn();

  it('セクションのドラッグハンドルが表示される', () => {
    render(
      <SectionEditor
        chart={mockChart}
        onUpdateChart={mockOnUpdateChart}
      />
    );

    // 各セクションにドラッグハンドルがあることを確認
    const dragHandles = screen.getAllByTitle('ドラッグして並び替え');
    expect(dragHandles).toHaveLength(3);
  });

  it('セクション名が正しく表示される', () => {
    render(
      <SectionEditor
        chart={mockChart}
        onUpdateChart={mockOnUpdateChart}
      />
    );

    expect(screen.getByDisplayValue('Intro')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Verse')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Chorus')).toBeInTheDocument();
  });

  it('セクションの追加が正しく動作する', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionEditor
        chart={mockChart}
        onUpdateChart={mockOnUpdateChart}
      />
    );

    const addButton = screen.getByText('セクション追加');
    await user.click(addButton);

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

  it('セクションの削除が正しく動作する', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionEditor
        chart={mockChart}
        onUpdateChart={mockOnUpdateChart}
      />
    );

    const deleteButtons = screen.getAllByTitle('このセクションを削除');
    await user.click(deleteButtons[0]); // Introセクションを削除

    expect(mockOnUpdateChart).toHaveBeenCalledWith(
      expect.objectContaining({
        sections: [
          mockChart.sections![1],
          mockChart.sections![2]
        ]
      })
    );
  });

  it('セクションの複製が正しく動作する', async () => {
    const user = userEvent.setup();
    
    render(
      <SectionEditor
        chart={mockChart}
        onUpdateChart={mockOnUpdateChart}
      />
    );

    const duplicateButtons = screen.getAllByTitle('このセクションを複製');
    await user.click(duplicateButtons[0]); // Introセクションを複製

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
          mockChart.sections![1],
          mockChart.sections![2]
        ])
      })
    );
  });
});