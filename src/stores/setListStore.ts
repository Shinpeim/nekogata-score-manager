import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SetList, SetListLibrary } from '../types/setList';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface SetListState {
  /** セットリストの辞書 */
  setLists: SetListLibrary;
  /** 現在選択中のセットリストID */
  currentSetListId: string | null;

  // アクション
  /** セットリストを作成 */
  createSetList: (name: string, chartIds: string[]) => Promise<string>;
  /** セットリストを削除 */
  deleteSetList: (id: string) => Promise<void>;
  /** セットリストの楽譜順序を更新 */
  updateSetListOrder: (id: string, newChartIds: string[]) => Promise<void>;
  /** 現在のセットリストを設定 */
  setCurrentSetList: (id: string | null) => void;
  /** セットリストを設定（ストレージからの読み込み用） */
  setSetLists: (setLists: SetListLibrary) => void;
  /** セットリストをクリア */
  clearSetLists: () => void;
}

/**
 * セットリストIDを生成
 */
const generateSetListId = (): string => {
  const timestamp = Date.now();
  const random = uuidv4().split('-')[0];
  return `setlist-${timestamp}-${random}`;
};

/**
 * セットリストストア
 */
export const useSetListStore = create<SetListState>()(
  devtools((set, get) => ({
    setLists: {},
    currentSetListId: null,

    createSetList: async (name: string, chartIds: string[]) => {
      const id = generateSetListId();
      const newSetList: SetList = {
        id,
        name,
        chartIds,
        createdAt: new Date(),
      };

      set((state) => ({
        setLists: {
          ...state.setLists,
          [id]: newSetList,
        },
        currentSetListId: id,
      }));

      logger.info(`セットリストを作成しました: ${name}`, { id, chartIds });
      return id;
    },

    deleteSetList: async (id: string) => {
      const { setLists, currentSetListId } = get();
      
      if (!setLists[id]) {
        logger.warn(`削除対象のセットリストが見つかりません: ${id}`);
        return;
      }

      const newSetLists = { ...setLists };
      delete newSetLists[id];

      set({
        setLists: newSetLists,
        currentSetListId: currentSetListId === id ? null : currentSetListId,
      });

      logger.info(`セットリストを削除しました: ${id}`);
    },

    updateSetListOrder: async (id: string, newChartIds: string[]) => {
      const { setLists } = get();
      
      if (!setLists[id]) {
        logger.warn(`更新対象のセットリストが見つかりません: ${id}`);
        return;
      }

      set((state) => ({
        setLists: {
          ...state.setLists,
          [id]: {
            ...state.setLists[id],
            chartIds: newChartIds,
          },
        },
      }));

      logger.info(`セットリストの順序を更新しました: ${id}`);
    },

    setCurrentSetList: (id: string | null) => {
      set({ currentSetListId: id });
      logger.debug(`現在のセットリストを設定: ${id}`);
    },

    setSetLists: (setLists: SetListLibrary) => {
      set({ setLists });
      logger.debug('セットリストを設定しました', { count: Object.keys(setLists).length });
    },

    clearSetLists: () => {
      set({ setLists: {}, currentSetListId: null });
      logger.debug('セットリストをクリアしました');
    },
  }), {
    name: 'setListStore',
  })
);