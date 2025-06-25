import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSetListStore } from '../setListStore';
import { logger } from '../../utils/logger';

// loggerをモック化
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useSetListStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useSetListStore.getState().clearSetLists();
    vi.clearAllMocks();
  });

  describe('createSetList', () => {
    it('セットリストを作成できる', async () => {
      const store = useSetListStore.getState();
      const chartIds = ['chart1', 'chart2', 'chart3'];
      
      const setListId = await store.createSetList('Test SetList', chartIds);
      
      expect(setListId).toMatch(/^setlist-\d+-[a-f0-9]+$/);
      
      const { setLists, currentSetListId } = useSetListStore.getState();
      
      expect(setLists[setListId]).toBeDefined();
      expect(setLists[setListId].name).toBe('Test SetList');
      expect(setLists[setListId].chartIds).toEqual(chartIds);
      expect(setLists[setListId].createdAt).toBeInstanceOf(Date);
      expect(currentSetListId).toBe(setListId);
      
      expect(logger.info).toHaveBeenCalledWith(
        'セットリストを作成しました: Test SetList',
        { id: setListId, chartIds }
      );
    });

    it('空のchartIdsでもセットリストを作成できる', async () => {
      const store = useSetListStore.getState();
      
      const setListId = await store.createSetList('Empty SetList', []);
      
      const { setLists } = useSetListStore.getState();
      
      expect(setLists[setListId].chartIds).toEqual([]);
    });
  });

  describe('deleteSetList', () => {
    it('セットリストを削除できる', async () => {
      const store = useSetListStore.getState();
      
      // セットリストを作成
      const setListId = await store.createSetList('Test SetList', ['chart1']);
      
      // 削除前の確認
      expect(useSetListStore.getState().setLists[setListId]).toBeDefined();
      expect(useSetListStore.getState().currentSetListId).toBe(setListId);
      
      // 削除実行
      await store.deleteSetList(setListId);
      
      // 削除後の確認
      const { setLists, currentSetListId } = useSetListStore.getState();
      expect(setLists[setListId]).toBeUndefined();
      expect(currentSetListId).toBeNull();
      
      expect(logger.info).toHaveBeenCalledWith(`セットリストを削除しました: ${setListId}`);
    });

    it('現在選択中でないセットリストを削除した場合、currentSetListIdは変更されない', async () => {
      const store = useSetListStore.getState();
      
      // 2つのセットリストを作成
      const setListId1 = await store.createSetList('SetList 1', ['chart1']);
      const setListId2 = await store.createSetList('SetList 2', ['chart2']);
      
      // 1つ目を現在選択中に設定
      store.setCurrentSetList(setListId1);
      
      // 2つ目を削除
      await store.deleteSetList(setListId2);
      
      // 1つ目はまだ選択中のまま
      expect(useSetListStore.getState().currentSetListId).toBe(setListId1);
    });

    it('存在しないセットリストの削除を試みた場合、警告ログが出力される', async () => {
      const store = useSetListStore.getState();
      
      await store.deleteSetList('non-existent-id');
      
      expect(logger.warn).toHaveBeenCalledWith(
        '削除対象のセットリストが見つかりません: non-existent-id'
      );
    });
  });

  describe('updateSetListOrder', () => {
    it('セットリストの楽譜順序を更新できる', async () => {
      const store = useSetListStore.getState();
      
      // セットリストを作成
      const originalOrder = ['chart1', 'chart2', 'chart3'];
      const setListId = await store.createSetList('Test SetList', originalOrder);
      
      // 順序を変更
      const newOrder = ['chart3', 'chart1', 'chart2'];
      await store.updateSetListOrder(setListId, newOrder);
      
      // 変更後の確認
      const { setLists } = useSetListStore.getState();
      expect(setLists[setListId].chartIds).toEqual(newOrder);
      
      expect(logger.info).toHaveBeenCalledWith(`セットリストの順序を更新しました: ${setListId}`);
    });

    it('存在しないセットリストの順序更新を試みた場合、警告ログが出力される', async () => {
      const store = useSetListStore.getState();
      
      await store.updateSetListOrder('non-existent-id', ['chart1']);
      
      expect(logger.warn).toHaveBeenCalledWith(
        '更新対象のセットリストが見つかりません: non-existent-id'
      );
    });
  });

  describe('setCurrentSetList', () => {
    it('現在のセットリストを設定できる', () => {
      const store = useSetListStore.getState();
      
      store.setCurrentSetList('test-id');
      
      expect(useSetListStore.getState().currentSetListId).toBe('test-id');
      expect(logger.debug).toHaveBeenCalledWith('現在のセットリストを設定: test-id');
    });

    it('現在のセットリストをnullに設定できる', () => {
      const store = useSetListStore.getState();
      
      // 最初に何かを設定
      store.setCurrentSetList('test-id');
      
      // nullに設定
      store.setCurrentSetList(null);
      
      expect(useSetListStore.getState().currentSetListId).toBeNull();
      expect(logger.debug).toHaveBeenCalledWith('現在のセットリストを設定: null');
    });
  });

  describe('setSetLists', () => {
    it('セットリストを一括設定できる', () => {
      const store = useSetListStore.getState();
      
      const setLists = {
        'setlist1': {
          id: 'setlist1',
          name: 'SetList 1',
          chartIds: ['chart1', 'chart2'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        'setlist2': {
          id: 'setlist2',
          name: 'SetList 2',
          chartIds: ['chart3'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      
      store.setSetLists(setLists);
      
      expect(useSetListStore.getState().setLists).toEqual(setLists);
      expect(logger.debug).toHaveBeenCalledWith(
        'セットリストを設定しました',
        { count: 2 }
      );
    });
  });

  describe('clearSetLists', () => {
    it('セットリストをクリアできる', async () => {
      const store = useSetListStore.getState();
      
      // セットリストを作成
      await store.createSetList('Test SetList', ['chart1']);
      
      // クリア前の確認
      expect(Object.keys(useSetListStore.getState().setLists)).toHaveLength(1);
      expect(useSetListStore.getState().currentSetListId).not.toBeNull();
      
      // クリア実行
      store.clearSetLists();
      
      // クリア後の確認
      const { setLists, currentSetListId } = useSetListStore.getState();
      expect(setLists).toEqual({});
      expect(currentSetListId).toBeNull();
      
      expect(logger.debug).toHaveBeenCalledWith('セットリストをクリアしました');
    });
  });
});