import type { SetList } from '../types/setList';
import { v4 as uuidv4 } from 'uuid';
import { setListStorageService } from '../utils/setListStorage';
import { getDeviceId } from '../utils/sync/deviceId';

/**
 * セットリストCRUD操作サービス
 * 純粋な操作ロジックのみを提供し、状態管理には関与しない
 */
class SetListCrudService {
  /**
   * 新しいセットリストを作成
   */
  async createSetList(setListData: Partial<SetList>): Promise<SetList> {
    const newSetList: SetList = {
      id: uuidv4(),
      name: setListData.name || '新しいセットリスト',
      chartIds: setListData.chartIds || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...setListData
    };
    
    await setListStorageService.saveSetList(newSetList);
    return newSetList;
  }

  /**
   * セットリストを更新
   */
  async updateSetList(existingSetList: SetList, updates: Partial<SetList>): Promise<SetList> {
    const updatedSetList = {
      ...existingSetList,
      ...updates,
      updatedAt: new Date()
    };
    
    await setListStorageService.saveSetList(updatedSetList);
    return updatedSetList;
  }

  /**
   * セットリストを削除
   */
  async deleteSetList(id: string): Promise<void> {
    await setListStorageService.deleteSetList(id);
    
    // 削除記録を追加（同期用）
    const deviceId = getDeviceId();
    await setListStorageService.addDeletedSetList(id, deviceId);
  }

  /**
   * 複数のセットリストを削除
   */
  async deleteMultipleSetLists(ids: string[]): Promise<void> {
    await setListStorageService.deleteMultipleSetLists(ids);
    
    // 削除記録を追加（同期用）
    const deviceId = getDeviceId();
    await setListStorageService.addMultipleDeletedSetLists(ids, deviceId);
  }

  /**
   * 初期データを読み込み
   */
  async loadInitialData(): Promise<Record<string, SetList>> {
    const storedSetLists = await setListStorageService.loadSetLists();
    
    if (storedSetLists && Object.keys(storedSetLists).length > 0) {
      return storedSetLists;
    } else {
      // 空のデータをストレージに保存
      const initialSetLists = {};
      await setListStorageService.saveSetLists(initialSetLists);
      return initialSetLists;
    }
  }

  /**
   * ストレージからデータを再読み込み
   */
  async reloadFromStorage(): Promise<Record<string, SetList>> {
    const storedSetLists = await setListStorageService.loadSetLists();
    return storedSetLists || {};
  }

  /**
   * 同期されたセットリストをストレージに保存
   */
  async applySyncedSetLists(setLists: SetList[]): Promise<Record<string, SetList>> {
    const setListsLibrary: Record<string, SetList> = {};
    setLists.forEach(setList => {
      setListsLibrary[setList.id] = setList;
    });
    
    await setListStorageService.saveSetLists(setListsLibrary);
    return setListsLibrary;
  }
}

// シングルトンインスタンスをエクスポート
export const setListCrudService = new SetListCrudService();