// セットリスト機能の型定義

/**
 * セットリスト - 楽譜のセットを管理するための型
 */
export interface SetList {
  /** ユニークID（'setlist-' + timestamp + random） */
  id: string;
  /** セットリスト名 */
  name: string;
  /** 楽譜IDの配列（順序を保持） */
  chartIds: string[];
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * セットリストのライブラリ - SetList.idをキーとした辞書
 */
export interface SetListLibrary {
  [key: string]: SetList;
}

/**
 * LocalForageに保存するセットリストデータの構造
 */
export interface StoredSetListData {
  /** データ構造のバージョン（マイグレーション用） */
  version: string;
  /** セットリストの辞書 */
  setLists: SetListLibrary;
  /** 現在選択中のセットリストID */
  currentSetListId: string | null;
}

/**
 * Dropbox同期用のセットリストデータ構造
 */
export interface SyncSetListData {
  /** データ構造のバージョン */
  version: string;
  /** セットリストの辞書 */
  setLists: SetListLibrary;
  /** 同期日時（ISO 8601形式） */
  syncedAt: string;
}