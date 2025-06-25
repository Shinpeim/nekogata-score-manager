import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSetListManagement } from '../useSetListManagement';
import { useSetListStore } from '../../stores/setListStore';
import { useSetListCrudStore } from '../../stores/setListCrudStore';
import type { SetList } from '../../types/setList';

// モック設定
vi.mock('../../stores/setListStore');
vi.mock('../../stores/setListCrudStore');

const mockSetListStore = vi.mocked(useSetListStore);
const mockSetListCrudStore = vi.mocked(useSetListCrudStore);

describe('useSetListManagement', () => {
  const mockSetList: SetList = {
    id: 'test-setlist-id',
    name: 'テストセットリスト',
    chartIds: ['chart1', 'chart2'],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // データストアのモック
    mockSetListStore.mockReturnValue({
      setLists: { 'test-setlist-id': mockSetList },
      currentSetListId: 'test-setlist-id',
      setCurrentSetList: vi.fn(),
      getCurrentSetList: vi.fn(() => mockSetList),
      getSetListById: vi.fn((id: string) => id === 'test-setlist-id' ? mockSetList : undefined),
      getSetListsArray: vi.fn(() => [mockSetList]),
      hasSetLists: vi.fn(() => true),
      getSetListsCount: vi.fn(() => 1),
      addSetList: vi.fn(),
      updateSetList: vi.fn(),
      deleteSetList: vi.fn(),
      setSetLists: vi.fn()
    });

    // CRUDストアのモック
    mockSetListCrudStore.mockReturnValue({
      isLoading: false,
      error: null,
      addSetList: vi.fn(),
      updateSetList: vi.fn(),
      deleteSetList: vi.fn(),
      deleteMultipleSetLists: vi.fn(),
      createNewSetList: vi.fn(),
      loadInitialData: vi.fn(),
      loadFromStorage: vi.fn(),
      applySyncedSetLists: vi.fn(),
      clearError: vi.fn()
    });
  });

  it('データストアの値を正しく公開する', () => {
    const { result } = renderHook(() => useSetListManagement());

    expect(result.current.setLists).toEqual({ 'test-setlist-id': mockSetList });
    expect(result.current.currentSetListId).toBe('test-setlist-id');
    expect(result.current.hasSetLists()).toBe(true);
    expect(result.current.getSetListsCount()).toBe(1);
  });

  it('CRUDストアの状態を正しく公開する', () => {
    const { result } = renderHook(() => useSetListManagement());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('データストアのメソッドを正しく公開する', () => {
    const { result } = renderHook(() => useSetListManagement());

    act(() => {
      result.current.setCurrentSetList('new-setlist-id');
    });

    expect(mockSetListStore.mock.results[0].value.setCurrentSetList).toHaveBeenCalledWith('new-setlist-id');
  });

  it('CRUDストアのメソッドを正しく公開する', async () => {
    const { result } = renderHook(() => useSetListManagement());

    await act(async () => {
      await result.current.loadInitialData();
    });

    expect(mockSetListCrudStore.mock.results[0].value.loadInitialData).toHaveBeenCalled();
  });

  it('applySyncedSetListsメソッドが正しく動作する', async () => {
    const mockApplySyncedSetLists = vi.fn().mockResolvedValueOnce(undefined);
    
    // CRUDストアのモックを更新
    mockSetListCrudStore.mockReturnValue({
      isLoading: false,
      error: null,
      addSetList: vi.fn(),
      updateSetList: vi.fn(),
      deleteSetList: vi.fn(),
      deleteMultipleSetLists: vi.fn(),
      createNewSetList: vi.fn(),
      loadInitialData: vi.fn(),
      loadFromStorage: vi.fn(),
      applySyncedSetLists: mockApplySyncedSetLists,
      clearError: vi.fn()
    });

    const { result } = renderHook(() => useSetListManagement());

    const syncedSetLists = [mockSetList];

    await act(async () => {
      await result.current.applySyncedSetLists(syncedSetLists);
    });

    expect(mockApplySyncedSetLists).toHaveBeenCalledWith(syncedSetLists);
  });

  it('applySyncedSetListsでエラーが発生した場合は再スローする', async () => {
    const error = new Error('同期に失敗しました');
    const mockApplySyncedSetLists = vi.fn().mockRejectedValueOnce(error);
    
    mockSetListCrudStore.mockReturnValue({
      isLoading: false,
      error: null,
      addSetList: vi.fn(),
      updateSetList: vi.fn(),
      deleteSetList: vi.fn(),
      deleteMultipleSetLists: vi.fn(),
      createNewSetList: vi.fn(),
      loadInitialData: vi.fn(),
      loadFromStorage: vi.fn(),
      applySyncedSetLists: mockApplySyncedSetLists,
      clearError: vi.fn()
    });

    const { result } = renderHook(() => useSetListManagement());

    await expect(async () => {
      await act(async () => {
        await result.current.applySyncedSetLists([mockSetList]);
      });
    }).rejects.toThrow('同期に失敗しました');
  });

  it('エラークリア機能が正しく動作する', () => {
    const mockClearError = vi.fn();
    
    mockSetListCrudStore.mockReturnValue({
      isLoading: false,
      error: null,
      addSetList: vi.fn(),
      updateSetList: vi.fn(),
      deleteSetList: vi.fn(),
      deleteMultipleSetLists: vi.fn(),
      createNewSetList: vi.fn(),
      loadInitialData: vi.fn(),
      loadFromStorage: vi.fn(),
      applySyncedSetLists: vi.fn(),
      clearError: mockClearError
    });

    const { result } = renderHook(() => useSetListManagement());

    act(() => {
      result.current.clearError();
    });

    expect(mockClearError).toHaveBeenCalled();
  });

  it('セットリスト作成機能が正しく動作する', async () => {
    const mockCreateNewSetList = vi.fn().mockResolvedValueOnce(mockSetList);
    
    mockSetListCrudStore.mockReturnValue({
      isLoading: false,
      error: null,
      addSetList: vi.fn(),
      updateSetList: vi.fn(),
      deleteSetList: vi.fn(),
      deleteMultipleSetLists: vi.fn(),
      createNewSetList: mockCreateNewSetList,
      loadInitialData: vi.fn(),
      loadFromStorage: vi.fn(),
      applySyncedSetLists: vi.fn(),
      clearError: vi.fn()
    });

    const { result } = renderHook(() => useSetListManagement());

    const setListData = { name: '新しいセットリスト' };

    await act(async () => {
      const createdSetList = await result.current.createNewSetList(setListData);
      expect(createdSetList).toEqual(mockSetList);
    });

    expect(mockCreateNewSetList).toHaveBeenCalledWith(setListData);
  });
});