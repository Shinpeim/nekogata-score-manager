import { describe, it, expect, vi, beforeEach } from 'vitest';
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

    const deleteButton = screen.getByTitle('このセクションを削除');
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

  describe('バリデーション機能', () => {
    it('空のコード名でバリデーションエラーを表示する', () => {
      render(
        <ChordChartEditor
          chart={mockChart}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // コード名を空にする
      const chordInput = screen.getAllByPlaceholderText('コード名')[0];
      fireEvent.change(chordInput, { target: { value: '' } });
      fireEvent.blur(chordInput);

      // 保存ボタンをクリック
      const saveButton = screen.getByTestId('editor-save-button');
      fireEvent.click(saveButton);

      // エラーメッセージが表示されることを確認
      expect(screen.getByText('入力エラーがあります')).toBeInTheDocument();
      expect(screen.getByText(/1番目のコード名「」が無効です/)).toBeInTheDocument();
      
      // onSaveが呼ばれないことを確認
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('空の拍数でバリデーションエラーを表示する', () => {
      render(
        <ChordChartEditor
          chart={mockChart}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // 拍数を空にする
      const durationInput = screen.getAllByPlaceholderText('拍数')[0];
      fireEvent.change(durationInput, { target: { value: '' } });

      // 保存ボタンをクリック
      const saveButton = screen.getByTestId('editor-save-button');
      fireEvent.click(saveButton);

      // エラーメッセージが表示されることを確認
      expect(screen.getByText('入力エラーがあります')).toBeInTheDocument();
      expect(screen.getByText(/1番目の拍数が入力されていません/)).toBeInTheDocument();
      
      // onSaveが呼ばれないことを確認
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('無効な拍数（0.5刻みでない）でバリデーションエラーを表示する', () => {
      render(
        <ChordChartEditor
          chart={mockChart}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // 無効な拍数を入力
      const durationInput = screen.getAllByPlaceholderText('拍数')[0];
      fireEvent.change(durationInput, { target: { value: '1.3' } });

      // 保存ボタンをクリック
      const saveButton = screen.getByTestId('editor-save-button');
      fireEvent.click(saveButton);

      // エラーメッセージが表示されることを確認
      expect(screen.getByText('入力エラーがあります')).toBeInTheDocument();
      expect(screen.getByText(/0.5刻みで入力してください/)).toBeInTheDocument();
      
      // onSaveが呼ばれないことを確認
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('複数のバリデーションエラーを同時に表示する', () => {
      render(
        <ChordChartEditor
          chart={mockChart}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // コード名を空にする
      const chordInput = screen.getAllByPlaceholderText('コード名')[0];
      fireEvent.change(chordInput, { target: { value: '' } });
      fireEvent.blur(chordInput);

      // 拍数も空にする
      const durationInput = screen.getAllByPlaceholderText('拍数')[0];
      fireEvent.change(durationInput, { target: { value: '' } });

      // 保存ボタンをクリック
      const saveButton = screen.getByTestId('editor-save-button');
      fireEvent.click(saveButton);

      // 複数のエラーメッセージが表示されることを確認
      expect(screen.getByText('入力エラーがあります')).toBeInTheDocument();
      expect(screen.getByText(/1番目のコード名「」が無効です/)).toBeInTheDocument();
      expect(screen.getByText(/1番目の拍数が入力されていません/)).toBeInTheDocument();
      
      // onSaveが呼ばれないことを確認
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('バリデーション成功後にエラーメッセージがクリアされる', () => {
      render(
        <ChordChartEditor
          chart={mockChart}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // 最初にエラーを発生させる
      const chordInput = screen.getAllByPlaceholderText('コード名')[0];
      fireEvent.change(chordInput, { target: { value: '' } });
      fireEvent.blur(chordInput);

      const saveButton = screen.getByTestId('editor-save-button');
      fireEvent.click(saveButton);

      // エラーメッセージが表示されることを確認
      expect(screen.getByText('入力エラーがあります')).toBeInTheDocument();

      // 有効な値に修正
      fireEvent.change(chordInput, { target: { value: 'D' } });
      fireEvent.blur(chordInput);

      // 再度保存
      fireEvent.click(saveButton);

      // エラーメッセージが消えることを確認
      expect(screen.queryByText('入力エラーがあります')).not.toBeInTheDocument();
      
      // onSaveが呼ばれることを確認
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('保存ボタンは常に有効である', () => {
      render(
        <ChordChartEditor
          chart={mockChart}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByTestId('editor-save-button');
      
      // 初期状態で有効
      expect(saveButton).not.toBeDisabled();

      // エラー状態でも有効
      const chordInput = screen.getAllByPlaceholderText('コード名')[0];
      fireEvent.change(chordInput, { target: { value: '' } });
      fireEvent.blur(chordInput);
      fireEvent.click(saveButton);
      
      expect(saveButton).not.toBeDisabled();
    });
  });
});