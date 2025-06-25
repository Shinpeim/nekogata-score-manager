import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SetListSelector from '../SetListSelector';
import { useSetListManagement } from '../../hooks/useSetListManagement';

// Mock the hook
vi.mock('../../hooks/useSetListManagement');

const mockUseSetListManagement = vi.mocked(useSetListManagement);

describe('SetListSelector', () => {
  const mockSetCurrentSetList = vi.fn();
  const mockDeleteSetList = vi.fn();

  const mockSetLists = {
    'setlist1': {
      id: 'setlist1',
      name: 'Live Set 2024',
      chartIds: ['chart1', 'chart2'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    'setlist2': {
      id: 'setlist2',
      name: 'Acoustic Session',
      chartIds: ['chart3'],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteSetList.mockResolvedValue(undefined);
    
    mockUseSetListManagement.mockReturnValue({
      setLists: mockSetLists,
      currentSetListId: null,
      setCurrentSetList: mockSetCurrentSetList,
      deleteSetList: mockDeleteSetList,
      createNewSetList: vi.fn(),
      addSetList: vi.fn(),
      updateSetList: vi.fn(),
      deleteMultipleSetLists: vi.fn(),
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

  it('セットリストが選択されていない場合、選択を促すテキストを表示', () => {
    render(<SetListSelector />);

    expect(screen.getByText('セットリストを選択')).toBeInTheDocument();
  });

  it('セットリストが選択されている場合、名前と曲数を表示', () => {
    mockUseSetListManagement.mockReturnValue({
      setLists: mockSetLists,
      currentSetListId: 'setlist1',
      setCurrentSetList: mockSetCurrentSetList,
      deleteSetList: mockDeleteSetList,
      createNewSetList: vi.fn(),
      addSetList: vi.fn(),
      updateSetList: vi.fn(),
      deleteMultipleSetLists: vi.fn(),
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

    render(<SetListSelector />);

    expect(screen.getByText('Live Set 2024')).toBeInTheDocument();
    expect(screen.getByText('(2曲)')).toBeInTheDocument();
  });

  it('ドロップダウンボタンをクリックするとオプションが表示される', () => {
    render(<SetListSelector />);

    const button = screen.getByTestId('setlist-selector-button');
    fireEvent.click(button);

    expect(screen.getByText('(セットリストなし)')).toBeInTheDocument();
    expect(screen.getByText('Live Set 2024')).toBeInTheDocument();
    expect(screen.getByText('Acoustic Session')).toBeInTheDocument();
  });

  it('セットリストオプションをクリックすると選択される', () => {
    render(<SetListSelector />);

    const button = screen.getByTestId('setlist-selector-button');
    fireEvent.click(button);

    const option = screen.getByTestId('setlist-option-setlist1');
    fireEvent.click(option);

    expect(mockSetCurrentSetList).toHaveBeenCalledWith('setlist1');
  });

  it('(セットリストなし)をクリックすると選択がクリアされる', () => {
    mockUseSetListManagement.mockReturnValue({
      setLists: mockSetLists,
      currentSetListId: 'setlist1',
      setCurrentSetList: mockSetCurrentSetList,
      deleteSetList: mockDeleteSetList,
      createNewSetList: vi.fn(),
      addSetList: vi.fn(),
      updateSetList: vi.fn(),
      deleteMultipleSetLists: vi.fn(),
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

    render(<SetListSelector />);

    const button = screen.getByTestId('setlist-selector-button');
    fireEvent.click(button);

    const noneOption = screen.getByTestId('setlist-option-none');
    fireEvent.click(noneOption);

    expect(mockSetCurrentSetList).toHaveBeenCalledWith(null);
  });

  it('削除ボタンをクリックすると確認ダイアログが表示される', () => {
    render(<SetListSelector />);

    const button = screen.getByTestId('setlist-selector-button');
    fireEvent.click(button);

    const deleteButton = screen.getByTestId('delete-setlist-setlist1');
    fireEvent.click(deleteButton);

    expect(screen.getByText('セットリストを削除')).toBeInTheDocument();
    expect(screen.getByText(/「Live Set 2024」を削除しますか？/)).toBeInTheDocument();
  });

  it('削除確認ダイアログで削除を実行できる', async () => {
    render(<SetListSelector />);

    const button = screen.getByTestId('setlist-selector-button');
    fireEvent.click(button);

    const deleteButton = screen.getByTestId('delete-setlist-setlist1');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByTestId('confirm-delete-setlist');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteSetList).toHaveBeenCalledWith('setlist1');
    });
  });

  it('削除確認ダイアログでキャンセルできる', () => {
    render(<SetListSelector />);

    const button = screen.getByTestId('setlist-selector-button');
    fireEvent.click(button);

    const deleteButton = screen.getByTestId('delete-setlist-setlist1');
    fireEvent.click(deleteButton);

    const cancelButton = screen.getByTestId('cancel-delete-setlist');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('セットリストを削除')).not.toBeInTheDocument();
    expect(mockDeleteSetList).not.toHaveBeenCalled();
  });

  it('現在選択中のセットリストにチェックマークが表示される', () => {
    mockUseSetListManagement.mockReturnValue({
      setLists: mockSetLists,
      currentSetListId: 'setlist1',
      setCurrentSetList: mockSetCurrentSetList,
      deleteSetList: mockDeleteSetList,
      createNewSetList: vi.fn(),
      addSetList: vi.fn(),
      updateSetList: vi.fn(),
      deleteMultipleSetLists: vi.fn(),
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

    render(<SetListSelector />);

    const button = screen.getByTestId('setlist-selector-button');
    fireEvent.click(button);

    const option = screen.getByTestId('setlist-option-setlist1');
    expect(option).toHaveTextContent('✓');
  });

  it('セットリストが存在しない場合、適切なメッセージを表示', () => {
    mockUseSetListManagement.mockReturnValue({
      setLists: {},
      currentSetListId: null,
      setCurrentSetList: mockSetCurrentSetList,
      deleteSetList: mockDeleteSetList,
      createNewSetList: vi.fn(),
      addSetList: vi.fn(),
      updateSetList: vi.fn(),
      deleteMultipleSetLists: vi.fn(),
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

    render(<SetListSelector />);

    const button = screen.getByTestId('setlist-selector-button');
    fireEvent.click(button);

    expect(screen.getByText('セットリストがありません')).toBeInTheDocument();
  });
});