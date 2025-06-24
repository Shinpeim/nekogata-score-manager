import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import SortableChordItem from '../SortableChordItem';
import type { Chord } from '../../types';

// Mock useSortable hook
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

// Mock validation functions
vi.mock('../../utils/chordValidation', () => ({
  isValidFullChordName: vi.fn(() => true),
  isValidDuration: vi.fn(() => true),
}));

// Mock line break helpers
vi.mock('../../utils/lineBreakHelpers', () => ({
  isLineBreakMarker: vi.fn(() => false),
}));

describe('SortableChordItem', () => {
  const mockChord: Chord = {
    name: 'C',
    root: 'C',
    duration: 4,
    memo: 'テストメモ'
  };

  const defaultProps = {
    chord: mockChord,
    chordIndex: 0,
    sectionId: 'section-1',
    itemId: 'section-1-0',
    onUpdateChord: vi.fn(),
    onFinalizeChordName: vi.fn(),
    onDeleteChord: vi.fn(),
    onInsertLineBreak: vi.fn(),
    isSelected: false,
    onToggleSelection: vi.fn(),
  };

  const renderWithDndContext = (props = defaultProps) => {
    return render(
      <DndContext>
        <SortableChordItem {...props} />
      </DndContext>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Memo functionality', () => {
    it('should render memo input field', () => {
      renderWithDndContext();
      
      const memoInput = screen.getByPlaceholderText('メモ（歌詞・演奏記号等）');
      expect(memoInput).toBeInTheDocument();
    });

    it('should display current memo value', () => {
      renderWithDndContext();
      
      const memoInput = screen.getByDisplayValue('テストメモ');
      expect(memoInput).toBeInTheDocument();
    });

    it('should handle memo input changes', () => {
      renderWithDndContext();
      
      const memoInput = screen.getByPlaceholderText('メモ（歌詞・演奏記号等）');
      fireEvent.change(memoInput, { target: { value: '新しいメモ' } });
      
      expect(memoInput).toHaveValue('新しいメモ');
    });

    it('should call onUpdateChord when memo input loses focus', () => {
      const mockOnUpdateChord = vi.fn();
      renderWithDndContext({ ...defaultProps, onUpdateChord: mockOnUpdateChord });
      
      const memoInput = screen.getByPlaceholderText('メモ（歌詞・演奏記号等）');
      fireEvent.change(memoInput, { target: { value: '新しいメモ' } });
      fireEvent.blur(memoInput);
      
      expect(mockOnUpdateChord).toHaveBeenCalledWith('section-1', 0, 'memo', '新しいメモ');
    });

    it('should call onUpdateChord with empty string when memo is empty', () => {
      const mockOnUpdateChord = vi.fn();
      renderWithDndContext({ ...defaultProps, onUpdateChord: mockOnUpdateChord });
      
      const memoInput = screen.getByPlaceholderText('メモ（歌詞・演奏記号等）');
      fireEvent.change(memoInput, { target: { value: '   ' } }); // whitespace only
      fireEvent.blur(memoInput);
      
      expect(mockOnUpdateChord).toHaveBeenCalledWith('section-1', 0, 'memo', '');
    });

    it('should handle Enter key press in memo input', () => {
      renderWithDndContext();
      
      const memoInput = screen.getByPlaceholderText('メモ（歌詞・演奏記号等）');
      fireEvent.focus(memoInput);
      fireEvent.keyDown(memoInput, { key: 'Enter' });
      
      // Enterキーでblurが呼ばれることを確認（直接的なテストは困難なため、エラーが発生しないことを確認）
      expect(memoInput).toBeInTheDocument();
    });

    it('should display empty memo field for chord without memo', () => {
      const chordWithoutMemo = { ...mockChord, memo: '' };
      renderWithDndContext({ ...defaultProps, chord: chordWithoutMemo });
      
      const memoInput = screen.getByPlaceholderText('メモ（歌詞・演奏記号等）');
      expect(memoInput).toHaveValue('');
    });
  });

  describe('Chord name functionality', () => {
    it('should render chord name input field', () => {
      renderWithDndContext();
      
      const chordInput = screen.getByPlaceholderText('コード名');
      expect(chordInput).toBeInTheDocument();
    });

    it('should display current chord name', () => {
      renderWithDndContext();
      
      const chordInput = screen.getByDisplayValue('C');
      expect(chordInput).toBeInTheDocument();
    });
  });

  describe('Duration functionality', () => {
    it('should render duration input field', () => {
      renderWithDndContext();
      
      const durationInput = screen.getByPlaceholderText('拍数');
      expect(durationInput).toBeInTheDocument();
    });

    it('should display current duration', () => {
      renderWithDndContext();
      
      const durationInput = screen.getByDisplayValue('4');
      expect(durationInput).toBeInTheDocument();
    });
  });

  describe('Component layout', () => {
    it('should render chord name input above memo input', () => {
      renderWithDndContext();
      
      const memoInput = screen.getByPlaceholderText('メモ（歌詞・演奏記号等）');
      const chordInput = screen.getByPlaceholderText('コード名');
      
      // コード名入力フィールドがメモ入力フィールドより前に存在することを確認
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.indexOf(chordInput)).toBeLessThan(inputs.indexOf(memoInput));
    });

    it('should apply correct styling to memo input', () => {
      renderWithDndContext();
      
      const memoInput = screen.getByPlaceholderText('メモ（歌詞・演奏記号等）');
      expect(memoInput).toHaveClass('text-xs', 'bg-slate-50');
    });
  });
});