import type { ChordChart } from '../types';

/**
 * 同期通知サービス
 * 同期コールバックの管理とデータ変更通知を担当
 */
export class SyncNotificationService {
  private syncCallbacks = new Set<(charts: ChordChart[]) => void>();

  /**
   * 同期通知コールバックを登録
   * @param callback 通知コールバック関数
   * @returns アンサブスクライブ関数
   */
  subscribe(callback: (charts: ChordChart[]) => void): () => void {
    this.syncCallbacks.add(callback);
    
    // アンサブスクライブ関数を返す
    return () => {
      this.syncCallbacks.delete(callback);
    };
  }

  /**
   * 登録されたコールバックに変更を通知
   * @param charts 変更されたチャート配列
   */
  notify(charts: ChordChart[]): void {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(charts);
      } catch (error) {
        console.error('同期コールバック実行エラー:', error);
      }
    });
  }

  /**
   * 登録されているコールバック数を取得（デバッグ用）
   */
  getCallbackCount(): number {
    return this.syncCallbacks.size;
  }

  /**
   * すべてのコールバックを削除（テスト用）
   */
  clear(): void {
    this.syncCallbacks.clear();
  }
}

// シングルトンインスタンスをエクスポート
export const syncNotificationService = new SyncNotificationService();