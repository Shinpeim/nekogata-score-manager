import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SetList } from '../types/setList';
import { setListCrudService } from '../services/setListCrudService';
import { useSetListStore } from './setListStore';
import { setListStorageService } from '../utils/setListStorage';
import { logger } from '../utils/logger';

interface SetListCrudState {
  // 状態
  isLoading: boolean;
  error: string | null;
  
  // CRUD操作
  addSetList: (setList: SetList) => Promise<void>;
  updateSetList: (id: string, setListUpdate: Partial<SetList>) => Promise<void>;
  updateSetListOrder: (id: string, newChartIds: string[]) => Promise<void>;
  deleteSetList: (id: string) => Promise<void>;
  deleteMultipleSetLists: (ids: string[]) => Promise<void>;
  createNewSetList: (setListData: Partial<SetList>) => Promise<SetList>;
  
  // ストレージ操作
  loadInitialData: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  applySyncedSetLists: (mergedSetLists: SetList[]) => Promise<void>;
  hasDataChanges: (mergedSetLists: SetList[]) => Promise<boolean>;
  
  // 同期通知
  subscribeSyncNotification: (callback: (setLists: SetList[]) => void) => () => void;
  notifySync: () => void;
  
  // ユーティリティ
  clearError: () => void;
}

// 同期通知用のサブスクライバー管理
const syncSubscribers = new Set<(setLists: SetList[]) => void>();

export const useSetListCrudStore = create<SetListCrudState>()(
  devtools(
    (set, get) => ({
      // 初期状態
      isLoading: false,
      error: null,
      
      // CRUD操作
      addSetList: async (setList: SetList) => {
        try {
          set({ isLoading: true, error: null });
          
          // CRUDサービスでストレージに保存
          await setListCrudService.createSetList(setList);
          
          // データストアを更新
          useSetListStore.getState().addSetList(setList);
          
          set({ isLoading: false });
          
          // 同期通知
          get().notifySync();
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'セットリストの追加に失敗しました' 
          });
          throw error;
        }
      },
      
      updateSetList: async (id: string, setListUpdate: Partial<SetList>) => {
        try {
          set({ isLoading: true, error: null });
          
          const dataStore = useSetListStore.getState();
          const existingSetList = dataStore.setLists[id];
          
          if (!existingSetList) {
            throw new Error('更新対象のセットリストが見つかりません');
          }
          
          // CRUDサービスで更新
          const updatedSetList = await setListCrudService.updateSetList(existingSetList, setListUpdate);
          
          // データストアを更新
          dataStore.updateSetList(id, updatedSetList);
          
          set({ isLoading: false });
          
          // 同期通知
          get().notifySync();
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'セットリストの更新に失敗しました' 
          });
          throw error;
        }
      },
      
      updateSetListOrder: async (id: string, newChartIds: string[]) => {
        try {
          // D&D操作では状態更新を最小限に抑制（エラーのクリアのみ）
          set({ error: null });
          
          const dataStore = useSetListStore.getState();
          const existingSetList = dataStore.setLists[id];
          
          if (!existingSetList) {
            throw new Error('順序更新対象のセットリストが見つかりません');
          }
          
          // 即座にUI状態を更新（楽観的更新）
          const optimisticSetList = {
            ...existingSetList,
            chartIds: newChartIds,
            updatedAt: new Date()
          };
          dataStore.updateSetList(id, optimisticSetList);
          
          // バックグラウンドで永続化処理
          setListCrudService.updateSetList(existingSetList, {
            chartIds: newChartIds,
            updatedAt: optimisticSetList.updatedAt
          }).then(() => {
            // 同期通知
            get().notifySync();
          }).catch((error) => {
            // 永続化に失敗した場合、元の状態に戻す
            dataStore.updateSetList(id, existingSetList);
            set({ 
              error: error instanceof Error ? error.message : 'セットリストの順序更新に失敗しました' 
            });
          });
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'セットリストの順序更新に失敗しました' 
          });
          throw error;
        }
      },
      
      deleteSetList: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // CRUDサービスで削除
          await setListCrudService.deleteSetList(id);
          
          // データストアから削除
          useSetListStore.getState().deleteSetList(id);
          
          set({ isLoading: false });
          
          // 同期通知
          get().notifySync();
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'セットリストの削除に失敗しました' 
          });
          throw error;
        }
      },
      
      deleteMultipleSetLists: async (ids: string[]) => {
        try {
          set({ isLoading: true, error: null });
          
          // CRUDサービスで削除
          await setListCrudService.deleteMultipleSetLists(ids);
          
          // データストアから削除
          const dataStore = useSetListStore.getState();
          ids.forEach(id => {
            dataStore.deleteSetList(id);
          });
          
          set({ isLoading: false });
          
          // 同期通知
          get().notifySync();
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '複数セットリストの削除に失敗しました' 
          });
          throw error;
        }
      },
      
      createNewSetList: async (setListData: Partial<SetList>) => {
        try {
          set({ isLoading: true, error: null });
          
          // CRUDサービスで新規作成
          const newSetList = await setListCrudService.createSetList(setListData);
          const dataStore = useSetListStore.getState();
          
          // データストアを更新
          dataStore.addSetList(newSetList);
          dataStore.setCurrentSetList(newSetList.id);
          
          set({ isLoading: false });
          
          // 同期通知
          get().notifySync();
          
          return newSetList;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '新しいセットリストの作成に失敗しました' 
          });
          throw error;
        }
      },
      
      // ストレージ操作
      loadInitialData: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const dataStore = useSetListStore.getState();
          
          // CRUDサービスで初期データ読み込み
          const initialSetLists = await setListCrudService.loadInitialData();
          
          // 最後に開いたセットリストIDを取得
          const lastOpenedSetListId = await setListStorageService.loadCurrentSetListId();
          
          // 最後に開いたセットリストが存在する場合はそれを優先、そうでなければ最初のセットリスト
          const targetSetListId = lastOpenedSetListId && initialSetLists[lastOpenedSetListId] 
            ? lastOpenedSetListId 
            : (Object.keys(initialSetLists)[0] || null);
          
          dataStore.setSetLists(initialSetLists);
          dataStore.setCurrentSetList(targetSetListId);
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'セットリストデータの読み込みに失敗しました' 
          });
          throw error;
        }
      },
      
      loadFromStorage: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const dataStore = useSetListStore.getState();
          
          // CRUDサービスで再読み込み
          const storedSetLists = await setListCrudService.reloadFromStorage();
          
          // 最後に開いたセットリストIDを取得
          const lastOpenedSetListId = await setListStorageService.loadCurrentSetListId();
          
          // 最後に開いたセットリストが存在する場合はそれを優先、そうでなければ最初のセットリスト
          const targetSetListId = lastOpenedSetListId && storedSetLists[lastOpenedSetListId] 
            ? lastOpenedSetListId 
            : (Object.keys(storedSetLists)[0] || null);
          
          dataStore.setSetLists(storedSetLists);
          dataStore.setCurrentSetList(targetSetListId);
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'ストレージからのセットリスト読み込みに失敗しました' 
          });
          throw error;
        }
      },
      
      applySyncedSetLists: async (mergedSetLists: SetList[]) => {
        logger.debug(`setListCrudStore.applySyncedSetLists called with ${mergedSetLists.length} setLists`);
        try {
          set({ isLoading: true, error: null });
          logger.debug(`setListCrudStore set isLoading=true`);
          
          logger.debug(`Applying ${mergedSetLists.length} synced setLists to local storage`);
          
          const dataStore = useSetListStore.getState();
          logger.debug(`Got dataStore, current setLists count: ${Object.keys(dataStore.setLists).length}`);
          
          // CRUDサービスで同期データ適用
          logger.debug(`Calling setListCrudService.applySyncedSetLists...`);
          const setListsLibrary = await setListCrudService.applySyncedSetLists(mergedSetLists);
          logger.debug(`setListCrudService.applySyncedSetLists returned ${Object.keys(setListsLibrary).length} setLists`);
          
          logger.info(`Successfully applied synced setLists, total setLists: ${Object.keys(setListsLibrary).length}`);
          
          // 現在選択中のセットリストが削除されていないかチェック
          const { currentSetListId } = dataStore;
          
          // 最後に開いたセットリストIDを取得
          const lastOpenedSetListId = await setListStorageService.loadCurrentSetListId();
          
          // 優先順位: 現在のセットリスト → 最後に開いたセットリスト → 最初のセットリスト
          let newCurrentSetListId = null;
          if (currentSetListId && setListsLibrary[currentSetListId]) {
            newCurrentSetListId = currentSetListId;
          } else if (lastOpenedSetListId && setListsLibrary[lastOpenedSetListId]) {
            newCurrentSetListId = lastOpenedSetListId;
          } else {
            newCurrentSetListId = Object.keys(setListsLibrary)[0] || null;
          }
          
          logger.debug(`SetList ID selection: current=${currentSetListId}, lastOpened=${lastOpenedSetListId}, new=${newCurrentSetListId}`);
          
          // データストアを更新
          logger.debug(`Updating dataStore with new setLists...`);
          dataStore.setSetLists(setListsLibrary);
          logger.debug(`Updated dataStore setLists`);
          
          dataStore.setCurrentSetList(newCurrentSetListId);
          logger.debug(`Updated dataStore current setList to: ${newCurrentSetListId}`);
          
          logger.info(`Local state updated, current setList: ${newCurrentSetListId}`);
          
          set({ isLoading: false });
          logger.debug(`setListCrudStore set isLoading=false, applySyncedSetLists completed`);
        } catch (error) {
          logger.error(`setListCrudStore.applySyncedSetLists failed:`, error);
          logger.error(`Error stack:`, error instanceof Error ? error.stack : 'No stack');
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '同期セットリストデータの適用に失敗しました' 
          });
          throw error;
        }
      },
      
      hasDataChanges: async (mergedSetLists: SetList[]) => {
        try {
          const dataStore = useSetListStore.getState();
          const currentSetLists = dataStore.setLists;
          
          // セットリストの数が異なる場合は変更あり
          const currentIds = Object.keys(currentSetLists).sort();
          const mergedIds = mergedSetLists.map(s => s.id).sort();
          
          if (currentIds.length !== mergedIds.length || !currentIds.every((id, index) => id === mergedIds[index])) {
            return true;
          }
          
          // 各セットリストの内容を比較
          for (const mergedSetList of mergedSetLists) {
            const currentSetList = currentSetLists[mergedSetList.id];
            if (!currentSetList) {
              return true;
            }
            
            // 基本プロパティの比較（updatedAtは除外）
            if (
              currentSetList.name !== mergedSetList.name ||
              currentSetList.chartIds.length !== mergedSetList.chartIds.length ||
              !currentSetList.chartIds.every((id, index) => id === mergedSetList.chartIds[index])
            ) {
              return true;
            }
          }
          
          // 変更なし
          return false;
        } catch (error) {
          logger.error('hasDataChanges error:', error);
          // エラーの場合は安全側に倒して変更ありとする
          return true;
        }
      },
      
      // 同期通知
      subscribeSyncNotification: (callback: (setLists: SetList[]) => void) => {
        syncSubscribers.add(callback);
        return () => {
          syncSubscribers.delete(callback);
        };
      },
      
      notifySync: () => {
        const setLists = Object.values(useSetListStore.getState().setLists);
        logger.debug(`Notifying sync with ${setLists.length} setlists`);
        syncSubscribers.forEach(callback => {
          callback(setLists);
        });
      },
      
      // ユーティリティ
      clearError: () => {
        set({ error: null }, false, 'clearError');
      }
    }),
    {
      name: 'setlist-crud-store'
    }
  )
);