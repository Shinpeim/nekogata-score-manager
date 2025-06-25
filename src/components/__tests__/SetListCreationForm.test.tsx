import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SetListCreationForm from '../SetListCreationForm';
import { useSetListManagement } from '../../hooks/useSetListManagement';

// Mock the hook
vi.mock('../../hooks/useSetListManagement');

const mockUseSetListManagement = vi.mocked(useSetListManagement);

describe('SetListCreationForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();
  const mockCreateNewSetList = vi.fn();

  const chartIds = ['chart1', 'chart2', 'chart3'];

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateNewSetList.mockResolvedValue({
      id: 'new-setlist-id',
      name: 'Test SetList',
      chartIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    mockUseSetListManagement.mockReturnValue({
      setLists: {},
      currentSetListId: null,
      createNewSetList: mockCreateNewSetList,
      addSetList: vi.fn(),
      updateSetList: vi.fn(),
      deleteSetList: vi.fn(),
      deleteMultipleSetLists: vi.fn(),
      setCurrentSetList: vi.fn(),
      getCurrentSetList: vi.fn(),
      getSetListById: vi.fn(),
      getSetListsArray: vi.fn(),
      hasSetLists: vi.fn(),
      getSetListsCount: vi.fn(),
      loadInitialData: vi.fn(),
      loadFromStorage: vi.fn(),
      applySyncedSetLists: vi.fn(),
      isLoading: false,
      error: null,
      clearError: vi.fn()
    });
  });

  it('フォームが正しく表示される', () => {
    render(
      <SetListCreationForm
        chartIds={chartIds}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('セットリスト作成')).toBeInTheDocument();
    expect(screen.getByLabelText('セットリスト名')).toBeInTheDocument();
    expect(screen.getByText('3曲を含むセットリストを作成します')).toBeInTheDocument();
    expect(screen.getByTestId('setlist-name-input')).toBeInTheDocument();
  });

  it('入力フィールドに自動フォーカスが当たる', () => {
    render(
      <SetListCreationForm
        chartIds={chartIds}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByTestId('setlist-name-input');
    expect(input).toHaveFocus();
  });

  it('名前を入力して作成ボタンをクリックできる', async () => {
    render(
      <SetListCreationForm
        chartIds={chartIds}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByTestId('setlist-name-input');
    const createButton = screen.getByTestId('confirm-create-setlist');

    fireEvent.change(input, { target: { value: 'My New Setlist' } });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateNewSetList).toHaveBeenCalledWith({
        name: 'My New Setlist',
        chartIds: chartIds
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('フォーム送信で作成できる', async () => {
    render(
      <SetListCreationForm
        chartIds={chartIds}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByTestId('setlist-name-input');
    
    fireEvent.change(input, { target: { value: 'Form Submit Test' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(mockCreateNewSetList).toHaveBeenCalledWith({
        name: 'Form Submit Test',
        chartIds: chartIds
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('キャンセルボタンをクリックするとキャンセルハンドラーが呼ばれる', () => {
    render(
      <SetListCreationForm
        chartIds={chartIds}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByTestId('cancel-create-setlist');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('Escapeキーでキャンセルできる', () => {
    render(
      <SetListCreationForm
        chartIds={chartIds}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByTestId('setlist-name-input');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('名前が空の場合、作成ボタンが無効になる', () => {
    render(
      <SetListCreationForm
        chartIds={chartIds}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const createButton = screen.getByTestId('confirm-create-setlist');
    expect(createButton).toBeDisabled();
  });

  it('空白のみの名前の場合、作成ボタンが無効になる', () => {
    render(
      <SetListCreationForm
        chartIds={chartIds}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByTestId('setlist-name-input');
    const createButton = screen.getByTestId('confirm-create-setlist');

    fireEvent.change(input, { target: { value: '   ' } });
    expect(createButton).toBeDisabled();
  });

  it('作成中は入力とボタンが無効になる', async () => {
    let resolveCreate: (value: string) => void;
    const createPromise = new Promise<string>((resolve) => {
      resolveCreate = resolve;
    });
    mockCreateNewSetList.mockReturnValue(createPromise);

    render(
      <SetListCreationForm
        chartIds={chartIds}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByTestId('setlist-name-input');
    const createButton = screen.getByTestId('confirm-create-setlist');
    const cancelButton = screen.getByTestId('cancel-create-setlist');

    fireEvent.change(input, { target: { value: 'Test Setlist' } });
    fireEvent.click(createButton);

    expect(input).toBeDisabled();
    expect(createButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(screen.getByText('作成中...')).toBeInTheDocument();

    // Promise を解決
    resolveCreate!('new-setlist-id');
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('作成エラー時は適切にハンドリングされる', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateNewSetList.mockRejectedValue(new Error('Creation failed'));

    render(
      <SetListCreationForm
        chartIds={chartIds}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByTestId('setlist-name-input');
    const createButton = screen.getByTestId('confirm-create-setlist');

    fireEvent.change(input, { target: { value: 'Test Setlist' } });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to create setlist:', expect.any(Error));
    });

    // フォームが使用可能な状態に戻る
    expect(input).not.toBeDisabled();
    expect(createButton).not.toBeDisabled();
    expect(screen.getByText('作成')).toBeInTheDocument();
    
    consoleError.mockRestore();
  });

  it('最大文字数制限が設定されている', () => {
    render(
      <SetListCreationForm
        chartIds={chartIds}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByTestId('setlist-name-input') as HTMLInputElement;
    expect(input.maxLength).toBe(100);
  });
});