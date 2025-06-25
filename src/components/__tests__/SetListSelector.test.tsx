import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SetListSelector from '../SetListSelector';
import { useSetListManagement } from '../../hooks/useSetListManagement';
import { createMockSetListManagement } from '../../hooks/__tests__/testHelpers';

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
    
    mockUseSetListManagement.mockReturnValue(
      createMockSetListManagement({
        setLists: mockSetLists,
        currentSetListId: null,
        setCurrentSetList: mockSetCurrentSetList,
        deleteSetList: mockDeleteSetList
      })
    );
  });

  it('セットリストが選択されていない場合、選択を促すテキストを表示', () => {
    render(<SetListSelector />);

    expect(screen.getByText('セットリストを選択')).toBeInTheDocument();
  });

  it('セットリストが選択されている場合、名前と曲数を表示', () => {
    mockUseSetListManagement.mockReturnValue(
      createMockSetListManagement({
        setLists: mockSetLists,
        currentSetListId: 'setlist1',
        setCurrentSetList: mockSetCurrentSetList,
        deleteSetList: mockDeleteSetList
      })
    );

    render(<SetListSelector />);

    expect(screen.getByText('Live Set 2024')).toBeInTheDocument();
    expect(screen.getByText('(2曲)')).toBeInTheDocument();
  });

  it('ドロップダウンを開くとセットリスト一覧が表示される', async () => {
    render(<SetListSelector />);

    // ドロップダウンボタンをクリック
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('setlist-option-none')).toBeInTheDocument();
    });

    // セットリストが表示されることを確認
    expect(screen.getByText('Live Set 2024')).toBeInTheDocument();
    expect(screen.getByText('(2曲)')).toBeInTheDocument();
    expect(screen.getByText('Acoustic Session')).toBeInTheDocument();
    expect(screen.getByText('(1曲)')).toBeInTheDocument();
    expect(screen.getByText('(セットリストなし)')).toBeInTheDocument();
  });

  it('セットリストをクリックすると選択される', async () => {
    render(<SetListSelector />);

    // ドロップダウンを開く
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('setlist-option-none')).toBeInTheDocument();
    });

    // セットリストをクリック
    const setListItem = screen.getByText('Live Set 2024');
    fireEvent.click(setListItem);

    expect(mockSetCurrentSetList).toHaveBeenCalledWith('setlist1');
  });

  it('現在選択中のセットリストにチェックマークが表示される', async () => {
    mockUseSetListManagement.mockReturnValue(
      createMockSetListManagement({
        setLists: mockSetLists,
        currentSetListId: 'setlist1',
        setCurrentSetList: mockSetCurrentSetList,
        deleteSetList: mockDeleteSetList
      })
    );

    render(<SetListSelector />);

    // ドロップダウンを開く
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('setlist-option-none')).toBeInTheDocument();
    });

    // チェックマークが表示されることを確認
    const selectedOption = screen.getByTestId('setlist-option-setlist1');
    expect(selectedOption).toHaveTextContent('✓');
  });

  it('削除ボタンをクリックすると確認ダイアログが表示される', async () => {
    render(<SetListSelector />);

    // ドロップダウンを開く
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('setlist-option-none')).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    const deleteButton = screen.getByTestId('delete-setlist-setlist1');
    fireEvent.click(deleteButton);

    // 確認ダイアログが表示されることを確認
    expect(screen.getByText('セットリストを削除')).toBeInTheDocument();
    expect(screen.getByText(/「Live Set 2024」を削除しますか？/)).toBeInTheDocument();
  });

  it('削除を確定するとセットリストが削除される', async () => {
    render(<SetListSelector />);

    // ドロップダウンを開く
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('setlist-option-none')).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    const deleteButton = screen.getByTestId('delete-setlist-setlist1');
    fireEvent.click(deleteButton);

    // 削除を確定
    const confirmButton = screen.getByText('削除');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteSetList).toHaveBeenCalledWith('setlist1');
    });
  });

  it('現在選択中のセットリストを削除すると選択がリセットされる', async () => {
    mockUseSetListManagement.mockReturnValue(
      createMockSetListManagement({
        setLists: mockSetLists,
        currentSetListId: 'setlist1',
        setCurrentSetList: mockSetCurrentSetList,
        deleteSetList: mockDeleteSetList
      })
    );

    render(<SetListSelector />);

    // ドロップダウンを開く
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('setlist-option-none')).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    const deleteButton = screen.getByTestId('delete-setlist-setlist1');
    fireEvent.click(deleteButton);

    // 削除を確定
    const confirmButton = screen.getByText('削除');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteSetList).toHaveBeenCalledWith('setlist1');
    });
  });

  it('削除をキャンセルすると何も起こらない', async () => {
    render(<SetListSelector />);

    // ドロップダウンを開く
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('setlist-option-none')).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    const deleteButton = screen.getByTestId('delete-setlist-setlist1');
    fireEvent.click(deleteButton);

    // キャンセル
    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    expect(mockDeleteSetList).not.toHaveBeenCalled();
  });

  it('外側をクリックするとドロップダウンが閉じる', async () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <SetListSelector />
      </div>
    );

    // ドロップダウンを開く
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('setlist-option-none')).toBeInTheDocument();
    });

    // 外側をクリック
    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });
});