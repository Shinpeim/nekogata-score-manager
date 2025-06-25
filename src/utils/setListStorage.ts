import localForage from 'localforage';
import type { SetList, SetListLibrary, StoredSetListData } from '../types/setList';
import { logger } from './logger';

/** セットリストデータの保存キー */
const SETLIST_STORAGE_KEY = 'nekogata-setlists';

/** 現在のデータバージョン */
const CURRENT_VERSION = '1.0.0';

/**
 * デフォルトのセットリストデータ
 */
const getDefaultSetListData = (): StoredSetListData => ({
  version: CURRENT_VERSION,
  setLists: {},
  currentSetListId: null,
});

/**
 * セットリストデータをLocalForageから読み込む
 */
export const loadSetListsFromStorage = async (): Promise<StoredSetListData> => {
  try {
    const data = await localForage.getItem<StoredSetListData>(SETLIST_STORAGE_KEY);
    
    if (!data) {
      logger.debug('セットリストデータが見つかりません。デフォルトデータを返します。');
      return getDefaultSetListData();
    }

    // バージョンチェック（将来的にマイグレーション処理を追加）
    if (data.version !== CURRENT_VERSION) {
      logger.warn(`セットリストデータのバージョンが異なります: ${data.version} → ${CURRENT_VERSION}`);
      // 現在は単純にデフォルトデータを返すが、将来的にマイグレーション処理を追加
      return getDefaultSetListData();
    }

    logger.debug('セットリストデータを読み込みました', { 
      count: Object.keys(data.setLists).length,
      currentSetListId: data.currentSetListId 
    });
    
    return data;
  } catch (error) {
    logger.error('セットリストデータの読み込みに失敗しました', error);
    return getDefaultSetListData();
  }
};

/**
 * セットリストデータをLocalForageに保存する
 */
export const saveSetListsToStorage = async (
  setLists: SetListLibrary,
  currentSetListId: string | null = null
): Promise<void> => {
  try {
    const data: StoredSetListData = {
      version: CURRENT_VERSION,
      setLists,
      currentSetListId,
    };

    await localForage.setItem(SETLIST_STORAGE_KEY, data);
    
    logger.debug('セットリストデータを保存しました', { 
      count: Object.keys(setLists).length,
      currentSetListId 
    });
  } catch (error) {
    logger.error('セットリストデータの保存に失敗しました', error);
    throw error;
  }
};

/**
 * セットリストデータをLocalForageから削除する
 */
export const clearSetListsFromStorage = async (): Promise<void> => {
  try {
    await localForage.removeItem(SETLIST_STORAGE_KEY);
    logger.debug('セットリストデータを削除しました');
  } catch (error) {
    logger.error('セットリストデータの削除に失敗しました', error);
    throw error;
  }
};

/**
 * セットリストストレージサービスクラス
 * chartCrudServiceと同様のインターフェースを提供
 */
class SetListStorageService {
  /**
   * 全セットリストを読み込み
   */
  async loadSetLists(): Promise<SetListLibrary> {
    const data = await loadSetListsFromStorage();
    return data.setLists;
  }

  /**
   * 全セットリストを保存
   */
  async saveSetLists(setLists: SetListLibrary): Promise<void> {
    const data = await loadSetListsFromStorage();
    await saveSetListsToStorage(setLists, data.currentSetListId);
  }

  /**
   * 単一セットリストを保存
   */
  async saveSetList(setList: SetList): Promise<void> {
    const currentSetLists = await this.loadSetLists();
    currentSetLists[setList.id] = setList;
    await this.saveSetLists(currentSetLists);
  }

  /**
   * セットリストを削除
   */
  async deleteSetList(id: string): Promise<void> {
    const currentSetLists = await this.loadSetLists();
    delete currentSetLists[id];
    await this.saveSetLists(currentSetLists);
  }

  /**
   * 複数セットリストを削除
   */
  async deleteMultipleSetLists(ids: string[]): Promise<void> {
    const currentSetLists = await this.loadSetLists();
    ids.forEach(id => {
      delete currentSetLists[id];
    });
    await this.saveSetLists(currentSetLists);
  }

  /**
   * 現在のセットリストIDを保存
   */
  async saveCurrentSetListId(id: string | null): Promise<void> {
    const setLists = await this.loadSetLists();
    await saveSetListsToStorage(setLists, id);
  }

  /**
   * 現在のセットリストIDを読み込み
   */
  async loadCurrentSetListId(): Promise<string | null> {
    const data = await loadSetListsFromStorage();
    return data.currentSetListId;
  }

  /**
   * 削除されたセットリスト記録を追加（同期用）
   */
  async addDeletedSetList(id: string, deviceId: string): Promise<void> {
    // 将来的に同期機能で使用
    logger.debug('削除されたセットリスト記録を追加', { id, deviceId });
  }

  /**
   * 複数の削除されたセットリスト記録を追加（同期用）
   */
  async addMultipleDeletedSetLists(ids: string[], deviceId: string): Promise<void> {
    // 将来的に同期機能で使用
    logger.debug('複数の削除されたセットリスト記録を追加', { ids, deviceId });
  }
}

// シングルトンインスタンスをエクスポート
export const setListStorageService = new SetListStorageService();