import { useSetListStore } from '../stores/setListStore';
import { useSetListCrudStore } from '../stores/setListCrudStore';
import type { SetList } from '../types/setList';
import { logger } from '../utils/logger';

/**
 * セットリスト管理の統合フック
 * 
 * チャート管理と同様の構造で、分離されたストアを統合して提供する
 */
export const useSetListManagement = () => {
  const dataStore = useSetListStore();
  const crudStore = useSetListCrudStore();

  return {
    // データ関連（dataStore）
    setLists: dataStore.setLists,
    currentSetListId: dataStore.currentSetListId,
    setCurrentSetList: dataStore.setCurrentSetList,
    getCurrentSetList: dataStore.getCurrentSetList,
    getSetListById: dataStore.getSetListById,
    getSetListsArray: dataStore.getSetListsArray,
    hasSetLists: dataStore.hasSetLists,
    getSetListsCount: dataStore.getSetListsCount,
    
    // CRUD操作関連（crudStore）
    isLoading: crudStore.isLoading,
    error: crudStore.error,
    addSetList: crudStore.addSetList,
    updateSetList: crudStore.updateSetList,
    updateSetListOrder: crudStore.updateSetListOrder,
    deleteSetList: crudStore.deleteSetList,
    deleteMultipleSetLists: crudStore.deleteMultipleSetLists,
    createNewSetList: crudStore.createNewSetList,
    loadInitialData: crudStore.loadInitialData,
    loadFromStorage: crudStore.loadFromStorage,
    clearError: crudStore.clearError,
    
    // 同期関連（crudStore）
    applySyncedSetLists: async (mergedSetLists: SetList[]) => {
      logger.debug(`useSetListManagement.applySyncedSetLists called with ${mergedSetLists.length} setLists`);
      try {
        const result = await crudStore.applySyncedSetLists(mergedSetLists);
        logger.debug(`useSetListManagement.applySyncedSetLists completed successfully`);
        return result;
      } catch (error) {
        logger.error(`useSetListManagement.applySyncedSetLists failed:`, error);
        throw error;
      }
    },
  };
};