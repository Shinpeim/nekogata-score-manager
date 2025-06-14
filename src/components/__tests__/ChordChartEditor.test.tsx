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
      chords: [
        { name: 'C', duration: 4 },
        { name: 'Am', duration: 4 },
        { name: 'F', duration: 4 },
        { name: 'G', duration: 4 }
      ]
    }
  ],
  notes: 'Test notes'
};

describe('ChordChartEditor', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders basic information fields', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Test Song')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Artist')).toBeInTheDocument();
    expect(screen.getByDisplayValue('120')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4/4')).toBeInTheDocument();
    
    // Key field is a select, so check by label
    expect(screen.getByLabelText('キー')).toHaveValue('C');
  });

  it('renders section with chords', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Verse')).toBeInTheDocument();
    
    // Check chord inputs specifically
    const chordInputs = screen.getAllByPlaceholderText('コード名');
    expect(chordInputs[0]).toHaveValue('C');
    expect(chordInputs[1]).toHaveValue('Am');
    expect(chordInputs[2]).toHaveValue('F');
    expect(chordInputs[3]).toHaveValue('G');
  });

  it('allows editing basic information', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const titleInput = screen.getByDisplayValue('Test Song');
    fireEvent.change(titleInput, { target: { value: 'Updated Song' } });
    expect(titleInput).toHaveValue('Updated Song');
  });

  it('allows adding new section', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const addSectionButton = screen.getByText('セクション追加');
    fireEvent.click(addSectionButton);

    expect(screen.getByDisplayValue('新しいセクション')).toBeInTheDocument();
  });

  it('allows adding chord to section', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const addChordButton = screen.getByText('コード追加');
    fireEvent.click(addChordButton);

    // Should have 5 chords now (4 original + 1 new)
    const chordInputs = screen.getAllByPlaceholderText('コード名');
    expect(chordInputs).toHaveLength(5);
  });

  it('calls onSave when save button is clicked', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-chart',
        title: 'Test Song',
        artist: 'Test Artist'
      })
    );
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('allows deleting a section', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const deleteButton = screen.getByText('削除');
    fireEvent.click(deleteButton);

    expect(screen.queryByDisplayValue('Verse')).not.toBeInTheDocument();
  });

  it('allows deleting a chord from section', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const deleteChordButtons = screen.getAllByText('✕');
    const initialChordCount = screen.getAllByPlaceholderText('コード名').length;
    
    fireEvent.click(deleteChordButtons[0]);

    const updatedChordCount = screen.getAllByPlaceholderText('コード名').length;
    expect(updatedChordCount).toBe(initialChordCount - 1);
  });

  it('allows editing notes', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const notesTextarea = screen.getByPlaceholderText('コード譜に関するメモを入力してください');
    fireEvent.change(notesTextarea, { target: { value: 'Updated notes' } });
    
    expect(notesTextarea).toHaveValue('Updated notes');
  });
});