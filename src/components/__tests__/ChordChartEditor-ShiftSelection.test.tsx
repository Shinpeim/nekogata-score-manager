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
        { name: 'C', root: 'C', duration: 4 },
        { name: 'Am', root: 'A', duration: 4 },
        { name: 'F', root: 'F', duration: 4 },
        { name: 'G', root: 'G', duration: 4 },
        { name: 'Dm', root: 'D', duration: 4 }
      ]
    }
  ],
  notes: 'Test notes'
};

describe('ChordChartEditor - Shift Selection', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  it('allows range selection with shift key', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // コード要素を取得（#1, #2, などのテキストを含む要素）
    const chordElements = screen.getAllByText(/#\d+/);
    
    // 最初のコードの親要素（実際のクリック可能な要素）を取得
    const firstChordParent = chordElements[0].closest('div[class*="border"]');
    expect(firstChordParent).toBeTruthy();
    
    // 最初のコードをクリック
    fireEvent.click(firstChordParent!);
    
    // 選択されたことを確認（✓マークが表示される）
    let selectedMarks = screen.queryAllByText('✓');
    expect(selectedMarks).toHaveLength(1);

    // 4番目のコードの親要素を取得
    const fourthChordParent = chordElements[3].closest('div[class*="border"]');
    expect(fourthChordParent).toBeTruthy();
    
    // Shiftキーを押しながら4番目のコードをクリック
    fireEvent.click(fourthChordParent!, { shiftKey: true });

    // 1-4番目のコードが選択されていることを確認
    selectedMarks = screen.queryAllByText('✓');
    expect(selectedMarks).toHaveLength(4);
  });

  it('handles normal selection without shift key', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const chordElements = screen.getAllByText(/#\d+/);
    
    // 最初のコードを選択
    const firstChord = chordElements[0].closest('.border');
    fireEvent.click(firstChord!);
    
    // 3番目のコードを通常クリック（Shiftなし）
    const thirdChord = chordElements[2].closest('.border');
    fireEvent.click(thirdChord!);
    
    // 1番目と3番目のコードのみが選択されていることを確認
    const selectedChords = screen.getAllByText('✓');
    expect(selectedChords).toHaveLength(2);
  });

  it('clears last selected chord when all selections are cleared', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // いくつかのコードを選択
    const chordElements = screen.getAllByText(/#\d+/);
    fireEvent.click(chordElements[0].closest('.border')!);
    fireEvent.click(chordElements[2].closest('.border')!, { shiftKey: true });

    // 全解除ボタンをクリック
    const clearAllButton = screen.getByTitle('このセクションの選択をすべて解除');
    fireEvent.click(clearAllButton);

    // 選択がクリアされていることを確認
    const selectedChords = screen.queryAllByText('✓');
    expect(selectedChords).toHaveLength(0);
  });
});