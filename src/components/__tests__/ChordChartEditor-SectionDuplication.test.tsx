import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChordChartEditor from '../ChordChartEditor';
import type { ChordChart } from '../../types';

// Mock chart data
const mockChart: ChordChart = {
  id: 'test-chart',
  title: 'Test Song',
  artist: 'Test Artist',
  key: 'C',
  timeSignature: '4/4',
  tempo: 120,
  createdAt: new Date(),
  updatedAt: new Date(),
  sections: [
    {
      id: 'section-1',
      name: 'Verse',
      beatsPerBar: 4,
      barsCount: 4,
      chords: [
        { name: 'C', root: 'C', duration: 4, memo: '' },
        { name: 'Am', root: 'A', duration: 4, memo: '' },
        { name: 'F', root: 'F', duration: 4, memo: '' },
        { name: 'G', root: 'G', duration: 4, memo: '' }
      ]
    },
    {
      id: 'section-2',
      name: 'Chorus',
      beatsPerBar: 4,
      barsCount: 4,
      chords: [
        { name: 'F', root: 'F', duration: 2, memo: '' },
        { name: 'G', root: 'G', duration: 2, memo: '' },
        { name: 'Em', root: 'E', duration: 4, memo: '' },
        { name: 'Am', root: 'A', duration: 4, memo: '' }
      ]
    }
  ],
  notes: 'Test notes'
};

describe('ChordChartEditor - Section Duplication', () => {
  const mockOnCancel = vi.fn();

  it('duplicates a section with all its chords', () => {
    const saveMock = vi.fn();
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={saveMock}
        onCancel={mockOnCancel}
      />
    );

    // セクションが最初は2つあることを確認
    expect(screen.getByDisplayValue('Verse')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Chorus')).toBeInTheDocument();

    // 最初のセクション（Verse）の複製ボタンを見つけてクリック
    const duplicateButtons = screen.getAllByTitle('このセクションを複製');
    expect(duplicateButtons).toHaveLength(2); // 各セクションに1つずつ
    
    fireEvent.click(duplicateButtons[0]); // 最初のセクション（Verse）を複製

    // 新しいセクションが作成されたことを確認
    const verseSections = screen.getAllByDisplayValue(/Verse/);
    expect(verseSections).toHaveLength(2); // 元のVerseと複製されたVerse

    // 複製されたセクション名に「(コピー)」が付いていることを確認
    expect(screen.getByDisplayValue('Verse (コピー)')).toBeInTheDocument();

    // 保存ボタンをクリックして、データが正しく渡されることを確認
    fireEvent.click(screen.getByText('保存'));
    
    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sections: expect.arrayContaining([
          expect.objectContaining({
            name: 'Verse',
            chords: expect.arrayContaining([
              expect.objectContaining({ name: 'C' }),
              expect.objectContaining({ name: 'Am' }),
              expect.objectContaining({ name: 'F' }),
              expect.objectContaining({ name: 'G' })
            ])
          }),
          expect.objectContaining({
            name: 'Verse (コピー)',
            chords: expect.arrayContaining([
              expect.objectContaining({ name: 'C' }),
              expect.objectContaining({ name: 'Am' }),
              expect.objectContaining({ name: 'F' }),
              expect.objectContaining({ name: 'G' })
            ])
          }),
          expect.objectContaining({
            name: 'Chorus'
          })
        ])
      })
    );
  });

  it('duplicates a section with the correct order (after the original)', () => {
    const saveMock = vi.fn();
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={saveMock}
        onCancel={mockOnCancel}
      />
    );

    // Chorusセクション（2番目）を複製
    const duplicateButtons = screen.getAllByTitle('このセクションを複製');
    fireEvent.click(duplicateButtons[1]); // 2番目のセクション（Chorus）を複製

    // 保存して順序を確認
    fireEvent.click(screen.getByText('保存'));
    
    const savedChart = saveMock.mock.calls[0][0];
    const sectionNames = savedChart.sections.map((s: { name: string }) => s.name);
    
    // 順序が Verse, Chorus, Chorus (コピー) になっていることを確認
    expect(sectionNames).toEqual(['Verse', 'Chorus', 'Chorus (コピー)']);
  });

  it('preserves section properties in duplicated section', () => {
    const saveMock = vi.fn();
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={saveMock}
        onCancel={mockOnCancel}
      />
    );

    // 最初のセクションを複製
    const duplicateButtons = screen.getAllByTitle('このセクションを複製');
    fireEvent.click(duplicateButtons[0]);

    // 保存して複製されたセクションのプロパティを確認
    fireEvent.click(screen.getByText('保存'));
    
    const savedChart = saveMock.mock.calls[0][0];
    const originalSection = savedChart.sections[0];
    const duplicatedSection = savedChart.sections[1];
    
    // 基本プロパティが正しくコピーされていることを確認
    expect(duplicatedSection.beatsPerBar).toBe(originalSection.beatsPerBar);
    expect(duplicatedSection.barsCount).toBe(originalSection.barsCount);
    
    // コードが正しくコピーされていることを確認
    expect(duplicatedSection.chords).toHaveLength(originalSection.chords.length);
    expect(duplicatedSection.chords[0]).toEqual(expect.objectContaining({
      name: 'C',
      root: 'C',
      duration: 4
    }));
    
    // 新しいIDが割り当てられていることを確認
    expect(duplicatedSection.id).not.toBe(originalSection.id);
    expect(duplicatedSection.id).toMatch(/^section-\d+$/);
  });
});