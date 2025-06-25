import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import localForage from 'localforage';
import {
  loadSetListsFromStorage,
  saveSetListsToStorage,
  clearSetListsFromStorage,
} from '../setListStorage';
import type { SetListLibrary, StoredSetListData } from '../../types/setList';
import { logger } from '../logger';

// localForageをモック化
vi.mock('localforage', () => ({
  default: {
    config: vi.fn(),
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// loggerをモック化
vi.mock('../logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedLocalForage = localForage as unknown as {
  getItem: Mock;
  setItem: Mock;
  removeItem: Mock;
};

describe('setListStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadSetListsFromStorage', () => {
    it('データが存在しない場合、デフォルトデータを返す', async () => {
      mockedLocalForage.getItem.mockResolvedValue(null);

      const result = await loadSetListsFromStorage();

      expect(result).toEqual({
        version: '1.0.0',
        setLists: {},
        currentSetListId: null,
      });
      expect(logger.debug).toHaveBeenCalledWith(
        'セットリストデータが見つかりません。デフォルトデータを返します。'
      );
    });

    it('正常なデータを読み込める', async () => {
      const testData: StoredSetListData = {
        version: '1.0.0',
        setLists: {
          'setlist1': {
            id: 'setlist1',
            name: 'Test SetList',
            chartIds: ['chart1', 'chart2'],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        },
        currentSetListId: 'setlist1',
      };

      mockedLocalForage.getItem.mockResolvedValue(testData);

      const result = await loadSetListsFromStorage();

      expect(result).toEqual(testData);
      expect(logger.debug).toHaveBeenCalledWith(
        'セットリストデータを読み込みました',
        {
          count: 1,
          currentSetListId: 'setlist1',
        }
      );
    });

    it('バージョンが異なる場合、警告ログを出力してデフォルトデータを返す', async () => {
      const testData: StoredSetListData = {
        version: '0.9.0', // 古いバージョン
        setLists: {
          'setlist1': {
            id: 'setlist1',
            name: 'Test SetList',
            chartIds: ['chart1'],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        },
        currentSetListId: 'setlist1',
      };

      mockedLocalForage.getItem.mockResolvedValue(testData);

      const result = await loadSetListsFromStorage();

      expect(result).toEqual({
        version: '1.0.0',
        setLists: {},
        currentSetListId: null,
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'セットリストデータのバージョンが異なります: 0.9.0 → 1.0.0'
      );
    });

    it('読み込みエラーが発生した場合、エラーログを出力してデフォルトデータを返す', async () => {
      const error = new Error('Storage error');
      mockedLocalForage.getItem.mockRejectedValue(error);

      const result = await loadSetListsFromStorage();

      expect(result).toEqual({
        version: '1.0.0',
        setLists: {},
        currentSetListId: null,
      });
      expect(logger.error).toHaveBeenCalledWith(
        'セットリストデータの読み込みに失敗しました',
        error
      );
    });
  });

  describe('saveSetListsToStorage', () => {
    it('セットリストデータを保存できる', async () => {
      const setLists: SetListLibrary = {
        'setlist1': {
          id: 'setlist1',
          name: 'Test SetList',
          chartIds: ['chart1', 'chart2'],
          createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        },
      };
      const currentSetListId = 'setlist1';

      mockedLocalForage.setItem.mockResolvedValue(undefined);

      await saveSetListsToStorage(setLists, currentSetListId);

      expect(mockedLocalForage.setItem).toHaveBeenCalledWith(
        'nekogata-setlists',
        {
          version: '1.0.0',
          setLists,
          currentSetListId,
        }
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'セットリストデータを保存しました',
        {
          count: 1,
          currentSetListId: 'setlist1',
        }
      );
    });

    it('currentSetListIdが指定されない場合、nullで保存される', async () => {
      const setLists: SetListLibrary = {};

      mockedLocalForage.setItem.mockResolvedValue(undefined);

      await saveSetListsToStorage(setLists);

      expect(mockedLocalForage.setItem).toHaveBeenCalledWith(
        'nekogata-setlists',
        {
          version: '1.0.0',
          setLists,
          currentSetListId: null,
        }
      );
    });

    it('保存エラーが発生した場合、エラーログを出力してエラーを再throw', async () => {
      const error = new Error('Storage error');
      const setLists: SetListLibrary = {};

      mockedLocalForage.setItem.mockRejectedValue(error);

      await expect(saveSetListsToStorage(setLists)).rejects.toThrow('Storage error');
      expect(logger.error).toHaveBeenCalledWith(
        'セットリストデータの保存に失敗しました',
        error
      );
    });
  });

  describe('clearSetListsFromStorage', () => {
    it('セットリストデータを削除できる', async () => {
      mockedLocalForage.removeItem.mockResolvedValue(undefined);

      await clearSetListsFromStorage();

      expect(mockedLocalForage.removeItem).toHaveBeenCalledWith('nekogata-setlists');
      expect(logger.debug).toHaveBeenCalledWith('セットリストデータを削除しました');
    });

    it('削除エラーが発生した場合、エラーログを出力してエラーを再throw', async () => {
      const error = new Error('Storage error');
      mockedLocalForage.removeItem.mockRejectedValue(error);

      await expect(clearSetListsFromStorage()).rejects.toThrow('Storage error');
      expect(logger.error).toHaveBeenCalledWith(
        'セットリストデータの削除に失敗しました',
        error
      );
    });
  });
});