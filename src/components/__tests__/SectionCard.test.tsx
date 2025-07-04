import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SectionCard from '../SectionCard';
import type { ChordSection } from '../../types';

describe('SectionCard', () => {
  const mockSection: ChordSection = {
    id: 'section-1',
    name: 'Test Section',
    beatsPerBar: 4,
    barsCount: 4,
    chords: [
      { id: 'chord-1', name: 'C', root: 'C', duration: 4, memo: '' },
      { id: 'chord-2', name: 'F', root: 'F', duration: 4, memo: '' },
      { id: 'chord-3', name: 'G', root: 'G', duration: 4, memo: '' }
    ]
  };

  const defaultProps = {
    section: mockSection,
    onSectionChange: vi.fn(),
    onDeleteSection: vi.fn(),
    onDuplicateSection: vi.fn(),
    onReplaceChordProgression: vi.fn(),
    onChordDragEnd: vi.fn(),
    onAddChordToSection: vi.fn(),
    onUpdateChordInSection: vi.fn(),
    onFinalizeChordName: vi.fn(),
    onDeleteChordFromSection: vi.fn(),
    onInsertLineBreakAfterChord: vi.fn(),
  };

  it('セクション名が正しく表示される', () => {
    render(<SectionCard {...defaultProps} />);
    
    expect(screen.getByDisplayValue('Test Section')).toBeInTheDocument();
  });

  it('セクション名の変更が正しく動作する', async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    
    render(<SectionCard {...defaultProps} onSectionChange={onSectionChange} />);
    
    const nameInput = screen.getByDisplayValue('Test Section');
    await user.type(nameInput, 'X');
    
    expect(onSectionChange).toHaveBeenLastCalledWith('section-1', 'name', 'Test SectionX');
  });

  it('セクション操作ボタンが表示される', () => {
    render(<SectionCard {...defaultProps} />);
    
    expect(screen.getByTitle('このセクションを複製')).toBeInTheDocument();
    expect(screen.getByTitle('このセクションを削除')).toBeInTheDocument();
  });

  it('削除ボタンクリックで削除処理が呼ばれる', async () => {
    const user = userEvent.setup();
    const onDeleteSection = vi.fn();
    
    render(<SectionCard {...defaultProps} onDeleteSection={onDeleteSection} />);
    
    const deleteButton = screen.getByTitle('このセクションを削除');
    await user.click(deleteButton);
    
    expect(onDeleteSection).toHaveBeenCalledWith('section-1');
  });

  it('複製ボタンクリックで複製処理が呼ばれる', async () => {
    const user = userEvent.setup();
    const onDuplicateSection = vi.fn();
    
    render(<SectionCard {...defaultProps} onDuplicateSection={onDuplicateSection} />);
    
    const duplicateButton = screen.getByTitle('このセクションを複製');
    await user.click(duplicateButton);
    
    expect(onDuplicateSection).toHaveBeenCalledWith('section-1');
  });

  it('コード追加ボタンが表示される', () => {
    render(<SectionCard {...defaultProps} />);
    
    expect(screen.getByText('コード追加')).toBeInTheDocument();
  });

  it('コード追加ボタンクリックで追加処理が呼ばれる', async () => {
    const user = userEvent.setup();
    const onAddChordToSection = vi.fn();
    
    render(<SectionCard {...defaultProps} onAddChordToSection={onAddChordToSection} />);
    
    const addButton = screen.getByText('コード追加');
    await user.click(addButton);
    
    expect(onAddChordToSection).toHaveBeenCalledWith('section-1');
  });

  it('テキスト一括入力セクションが表示される', () => {
    render(<SectionCard {...defaultProps} />);
    
    expect(screen.getByText('テキストから一括入力')).toBeInTheDocument();
  });

  it('一括入力による置換が正しく動作する', async () => {
    const user = userEvent.setup();
    const onReplaceChordProgression = vi.fn();
    
    render(<SectionCard {...defaultProps} onReplaceChordProgression={onReplaceChordProgression} />);
    
    // detailsを開く
    const summary = screen.getByText('テキストから一括入力');
    await user.click(summary);
    
    const textInput = screen.getByPlaceholderText('C F G Am');
    const replaceButton = screen.getByText('置換');
    
    await user.type(textInput, 'C F G Am');
    await user.click(replaceButton);
    
    expect(onReplaceChordProgression).toHaveBeenCalledWith('section-1', 'C F G Am');
  });

});