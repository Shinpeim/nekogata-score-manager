import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setListCrudService } from '../setListCrudService';
import { setListStorageService } from '../../utils/setListStorage';
import type { SetList } from '../../types/setList';

// モック設定
vi.mock('../../utils/setListStorage');
vi.mock('../../utils/sync/deviceId', () => ({
  getDeviceId: vi.fn(() => 'test-device-id')
}));

const mockSetListStorageService = vi.mocked(setListStorageService);

describe('setListCrudService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSetList', () => {
    it('新しいセットリストを作成できる', async () => {
      const inputData = {
        name: 'テストセットリスト',
        chartIds: ['chart1', 'chart2']
      };

      mockSetListStorageService.saveSetList.mockResolvedValueOnce();

      const result = await setListCrudService.createSetList(inputData);

      expect(result).toMatchObject({
        name: 'テストセットリスト',
        chartIds: ['chart1', 'chart2']
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(mockSetListStorageService.saveSetList).toHaveBeenCalledWith(result);
    });

    it('部分データから完全なセットリストを作成できる', async () => {
      const inputData = {
        name: 'ミニマルセットリスト'
      };

      mockSetListStorageService.saveSetList.mockResolvedValueOnce();

      const result = await setListCrudService.createSetList(inputData);

      expect(result.name).toBe('ミニマルセットリスト');
      expect(result.chartIds).toEqual([]);
      expect(result.id).toBeDefined();
    });

    it('名前が未指定の場合デフォルト名を使用する', async () => {
      mockSetListStorageService.saveSetList.mockResolvedValueOnce();

      const result = await setListCrudService.createSetList({});

      expect(result.name).toBe('新しいセットリスト');
    });
  });

  describe('updateSetList', () => {
    it('既存のセットリストを更新できる', async () => {
      const existingSetList: SetList = {
        id: 'existing-id',
        name: '元の名前',
        chartIds: ['chart1'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      };

      const updates = {
        name: '更新された名前',
        chartIds: ['chart1', 'chart2', 'chart3']
      };

      mockSetListStorageService.saveSetList.mockResolvedValueOnce();

      const result = await setListCrudService.updateSetList(existingSetList, updates);

      expect(result.id).toBe('existing-id');
      expect(result.name).toBe('更新された名前');
      expect(result.chartIds).toEqual(['chart1', 'chart2', 'chart3']);
      expect(result.createdAt).toEqual(new Date('2023-01-01'));
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.updatedAt.getTime()).toBeGreaterThan(new Date('2023-01-01').getTime());
      expect(mockSetListStorageService.saveSetList).toHaveBeenCalledWith(result);
    });
  });

  describe('deleteSetList', () => {
    it('セットリストを削除できる', async () => {
      const setListId = 'test-setlist-id';

      mockSetListStorageService.deleteSetList.mockResolvedValueOnce();
      mockSetListStorageService.addDeletedSetList.mockResolvedValueOnce();

      await setListCrudService.deleteSetList(setListId);

      expect(mockSetListStorageService.deleteSetList).toHaveBeenCalledWith(setListId);
      expect(mockSetListStorageService.addDeletedSetList).toHaveBeenCalledWith(setListId, 'test-device-id');
    });
  });

  describe('deleteMultipleSetLists', () => {
    it('複数のセットリストを削除できる', async () => {
      const setListIds = ['setlist1', 'setlist2', 'setlist3'];

      mockSetListStorageService.deleteMultipleSetLists.mockResolvedValueOnce();
      mockSetListStorageService.addMultipleDeletedSetLists.mockResolvedValueOnce();

      await setListCrudService.deleteMultipleSetLists(setListIds);

      expect(mockSetListStorageService.deleteMultipleSetLists).toHaveBeenCalledWith(setListIds);
      expect(mockSetListStorageService.addMultipleDeletedSetLists).toHaveBeenCalledWith(setListIds, 'test-device-id');
    });
  });

  describe('loadInitialData', () => {
    it('既存データがある場合はそれを返す', async () => {
      const mockSetLists = {
        'setlist1': { id: 'setlist1', name: 'セットリスト1', chartIds: [], createdAt: new Date(), updatedAt: new Date() },
        'setlist2': { id: 'setlist2', name: 'セットリスト2', chartIds: [], createdAt: new Date(), updatedAt: new Date() }
      };

      mockSetListStorageService.loadSetLists.mockResolvedValueOnce(mockSetLists);

      const result = await setListCrudService.loadInitialData();

      expect(result).toEqual(mockSetLists);
      expect(mockSetListStorageService.saveSetLists).not.toHaveBeenCalled();
    });

    it('データが空の場合は空のデータを保存して返す', async () => {
      mockSetListStorageService.loadSetLists.mockResolvedValueOnce({});
      mockSetListStorageService.saveSetLists.mockResolvedValueOnce();

      const result = await setListCrudService.loadInitialData();

      expect(result).toEqual({});
      expect(mockSetListStorageService.saveSetLists).toHaveBeenCalledWith({});
    });
  });

  describe('reloadFromStorage', () => {
    it('ストレージからデータを再読み込みできる', async () => {
      const mockSetLists = {
        'setlist1': { id: 'setlist1', name: 'セットリスト1', chartIds: [], createdAt: new Date(), updatedAt: new Date() }
      };

      mockSetListStorageService.loadSetLists.mockResolvedValueOnce(mockSetLists);

      const result = await setListCrudService.reloadFromStorage();

      expect(result).toEqual(mockSetLists);
    });

    it('データがnullの場合は空オブジェクトを返す', async () => {
      mockSetListStorageService.loadSetLists.mockResolvedValueOnce(null as unknown as Record<string, never>);

      const result = await setListCrudService.reloadFromStorage();

      expect(result).toEqual({});
    });
  });

  describe('applySyncedSetLists', () => {
    it('同期されたセットリストを保存できる', async () => {
      const syncedSetLists: SetList[] = [
        { id: 'setlist1', name: 'セットリスト1', chartIds: ['chart1'], createdAt: new Date(), updatedAt: new Date() },
        { id: 'setlist2', name: 'セットリスト2', chartIds: ['chart2'], createdAt: new Date(), updatedAt: new Date() }
      ];

      mockSetListStorageService.saveSetLists.mockResolvedValueOnce();

      const result = await setListCrudService.applySyncedSetLists(syncedSetLists);

      const expectedLibrary = {
        'setlist1': syncedSetLists[0],
        'setlist2': syncedSetLists[1]
      };

      expect(result).toEqual(expectedLibrary);
      expect(mockSetListStorageService.saveSetLists).toHaveBeenCalledWith(expectedLibrary);
    });
  });
});