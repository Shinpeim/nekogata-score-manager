import localForage from 'localforage';
import type { SetListLibrary, StoredSetListData } from '../types/setList';
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