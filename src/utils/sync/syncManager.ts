import type { ChordChart } from '../../types/chord';
import type { SetList } from '../../types/setList';
import type { ISyncAdapter, SyncMetadata, SyncConflict, SyncResult, SyncConfig, DeletedChartRecord, SetListSyncConflict, DeletedSetListRecord } from '../../types/sync';
import { DropboxSyncAdapter } from './dropboxAdapter';
import { getDeviceId } from './deviceId';
import { storageService } from '../storage';
import { logger } from '../logger';

export class SyncManager {
  private static instance: SyncManager;
  private adapter: ISyncAdapter;
  private config: SyncConfig;
  private syncInProgress = false;
  
  private constructor() {
    this.adapter = new DropboxSyncAdapter();
    this.config = this.loadConfig();
  }
  
  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }
  
  async initialize(): Promise<void> {
    if (this.adapter instanceof DropboxSyncAdapter) {
      await this.adapter.initialize();
    }
  }
  
  isAuthenticated(): boolean {
    return this.adapter.isAuthenticated();
  }
  
  async authenticate(): Promise<void> {
    await this.adapter.authenticate();
  }
  
  async signOut(): Promise<void> {
    await this.adapter.signOut();
  }
  
  async sync(
    localCharts: ChordChart[], 
    localSetLists: SetList[],
    onConflict?: (conflicts: SyncConflict[], setListConflicts: SetListSyncConflict[]) => Promise<'overwrite' | 'cancel'>
  ): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }
    
    this.syncInProgress = true;
    const result: SyncResult = {
      success: false,
      conflicts: [],
      setListConflicts: [],
      syncedCharts: [],
      syncedSetLists: [],
      errors: []
    };
    
    try {
      logger.debug(`Starting sync with ${localCharts.length} local charts and ${localSetLists.length} local setlists`);
      
      // リモートデータを取得
      const { 
        charts: remoteCharts, 
        metadata: remoteMetadata, 
        deletedCharts: remoteDeletedCharts,
        setLists: remoteSetLists,
        setListMetadata: remoteSetListMetadata,
        deletedSetLists: remoteDeletedSetLists
      } = await this.adapter.pull();
      logger.debug(`Pulled ${remoteCharts.length} remote charts, ${remoteDeletedCharts.length} deleted charts, ${remoteSetLists.length} remote setlists and ${remoteDeletedSetLists.length} deleted setlists`);
      
      // ローカルメタデータと削除記録を取得
      const localMetadata = this.generateLocalMetadata(localCharts);
      const localSetListMetadata = this.generateLocalSetListMetadata(localSetLists);
      const localDeletedCharts = await storageService.loadDeletedCharts();
      const localDeletedSetLists = await storageService.loadDeletedSetLists();
      
      // コンフリクトを検出
      const conflicts = this.detectConflicts(localCharts, remoteCharts, localMetadata, remoteMetadata);
      const setListConflicts = this.detectSetListConflicts(localSetLists, remoteSetLists, localSetListMetadata, remoteSetListMetadata);
      
      if (conflicts.length > 0 || setListConflicts.length > 0) {
        result.conflicts = conflicts;
        result.setListConflicts = setListConflicts;
        
        if (this.config.showConflictWarning && onConflict) {
          const action = await onConflict(conflicts, setListConflicts);
          if (action === 'cancel') {
            result.success = false;
            return result;
          }
        }
      }
      
      // マージ処理（後勝ち戦略、削除記録も考慮）
      const mergedCharts = this.mergeCharts(localCharts, remoteCharts, localMetadata, remoteMetadata, localDeletedCharts, remoteDeletedCharts);
      const mergedMetadata = this.mergeMetadata(localMetadata, remoteMetadata);
      const mergedDeletedCharts = this.mergeDeletedCharts(localDeletedCharts, remoteDeletedCharts);
      
      const mergedSetLists = this.mergeSetLists(localSetLists, remoteSetLists, localSetListMetadata, remoteSetListMetadata, localDeletedSetLists, remoteDeletedSetLists);
      const mergedSetListMetadata = this.mergeMetadata(localSetListMetadata, remoteSetListMetadata);
      const mergedDeletedSetLists = this.mergeDeletedSetLists(localDeletedSetLists, remoteDeletedSetLists);
      
      logger.debug(`Merged ${mergedCharts.length} charts, ${mergedDeletedCharts.length} deleted charts, ${mergedSetLists.length} setlists and ${mergedDeletedSetLists.length} deleted setlists for push`);
      
      // プッシュ
      await this.adapter.push(
        mergedCharts, 
        mergedMetadata, 
        mergedDeletedCharts,
        mergedSetLists,
        mergedSetListMetadata,
        mergedDeletedSetLists
      );
      logger.debug(`Successfully pushed to remote`);
      
      result.success = true;
      result.syncedCharts = mergedCharts.map(c => c.id);
      result.syncedSetLists = mergedSetLists.map(s => s.id);
      result.mergedCharts = mergedCharts;
      result.mergedSetLists = mergedSetLists;
      
      // 最終同期時刻を更新
      this.updateLastSyncTime();
      logger.debug(`Sync completed successfully`);
      
      return result;
      
    } catch (error) {
      logger.error(`syncManager.sync caught error:`, error);
      logger.error(`Error stack:`, error instanceof Error ? error.stack : 'No stack');
      result.errors.push({
        chartId: '',
        error: error as Error,
        type: this.getErrorType(error)
      });
      return result;
    } finally {
      logger.debug(`syncManager.sync finally block - setting syncInProgress to false`);
      this.syncInProgress = false;
    }
  }
  
  private generateLocalMetadata(charts: ChordChart[]): Record<string, SyncMetadata> {
    const deviceId = getDeviceId();
    const metadata: Record<string, SyncMetadata> = {};
    
    for (const chart of charts) {
      // 実際のチャートの更新時刻を使用（既存のupdatedAtがない場合はcreatedAtを使用）
      const actualModifiedTime = chart.updatedAt || chart.createdAt;
      
      // 日付がすでに文字列の場合とDateオブジェクトの場合の両方を処理
      const modifiedTimeString = actualModifiedTime instanceof Date 
        ? actualModifiedTime.toISOString()
        : String(actualModifiedTime);
      
      metadata[chart.id] = {
        lastSyncedAt: this.getLastSyncTime(),
        lastModifiedAt: modifiedTimeString,
        deviceId
      };
    }
    
    return metadata;
  }
  
  private generateLocalSetListMetadata(setLists: SetList[]): Record<string, SyncMetadata> {
    const deviceId = getDeviceId();
    const metadata: Record<string, SyncMetadata> = {};
    
    for (const setList of setLists) {
      const actualModifiedTime = setList.updatedAt || setList.createdAt;
      const modifiedTimeString = actualModifiedTime instanceof Date 
        ? actualModifiedTime.toISOString()
        : String(actualModifiedTime);
      
      metadata[setList.id] = {
        lastSyncedAt: this.getLastSyncTime(),
        lastModifiedAt: modifiedTimeString,
        deviceId
      };
    }
    
    return metadata;
  }
  
  private detectConflicts(
    localCharts: ChordChart[],
    remoteCharts: ChordChart[],
    localMetadata: Record<string, SyncMetadata>,
    remoteMetadata: Record<string, SyncMetadata>
  ): SyncConflict[] {
    const conflicts: SyncConflict[] = [];
    
    for (const localChart of localCharts) {
      const remoteChart = remoteCharts.find(c => c.id === localChart.id);
      if (!remoteChart) continue;
      
      const localMeta = localMetadata[localChart.id];
      const remoteMeta = remoteMetadata[localChart.id];
      
      if (!localMeta || !remoteMeta) continue;
      
      // 両方が最終同期以降に変更されている場合はコンフリクト
      const lastSync = new Date(localMeta.lastSyncedAt);
      const localModified = new Date(localMeta.lastModifiedAt);
      const remoteModified = new Date(remoteMeta.lastModifiedAt);
      
      // デバッグログ
      logger.debug(`Conflict check for chart ${localChart.id}:`, {
        lastSync: lastSync.toISOString(),
        localModified: localModified.toISOString(),
        remoteModified: remoteModified.toISOString(),
        localNewerThanSync: localModified > lastSync,
        remoteNewerThanSync: remoteModified > lastSync
      });
      
      if (localModified > lastSync && remoteModified > lastSync) {
        logger.debug(`Conflict detected for chart ${localChart.id}`);
        conflicts.push({
          localChart,
          remoteChart,
          localMetadata: localMeta,
          remoteMetadata: remoteMeta
        });
      }
    }
    
    return conflicts;
  }
  
  private detectSetListConflicts(
    localSetLists: SetList[],
    remoteSetLists: SetList[],
    localMetadata: Record<string, SyncMetadata>,
    remoteMetadata: Record<string, SyncMetadata>
  ): SetListSyncConflict[] {
    const conflicts: SetListSyncConflict[] = [];
    
    for (const localSetList of localSetLists) {
      const remoteSetList = remoteSetLists.find(s => s.id === localSetList.id);
      if (!remoteSetList) continue;
      
      const localMeta = localMetadata[localSetList.id];
      const remoteMeta = remoteMetadata[localSetList.id];
      
      if (!localMeta || !remoteMeta) continue;
      
      const lastSync = new Date(localMeta.lastSyncedAt);
      const localModified = new Date(localMeta.lastModifiedAt);
      const remoteModified = new Date(remoteMeta.lastModifiedAt);
      
      if (localModified > lastSync && remoteModified > lastSync) {
        logger.debug(`Conflict detected for setlist ${localSetList.id}`);
        conflicts.push({
          localSetList,
          remoteSetList,
          localMetadata: localMeta,
          remoteMetadata: remoteMeta
        });
      }
    }
    
    return conflicts;
  }
  
  private mergeCharts(
    localCharts: ChordChart[],
    remoteCharts: ChordChart[],
    localMetadata: Record<string, SyncMetadata>,
    remoteMetadata: Record<string, SyncMetadata>,
    localDeletedCharts: DeletedChartRecord[],
    remoteDeletedCharts: DeletedChartRecord[]
  ): ChordChart[] {
    const merged = new Map<string, ChordChart>();
    
    // 削除されたチャートのIDをセットに保存
    const allDeletedIds = new Set<string>();
    [...localDeletedCharts, ...remoteDeletedCharts].forEach(record => {
      allDeletedIds.add(record.id);
    });
    
    // リモートチャートを先に追加（削除されていないもののみ）
    for (const remoteChart of remoteCharts) {
      if (!allDeletedIds.has(remoteChart.id)) {
        merged.set(remoteChart.id, remoteChart);
      }
    }
    
    // ローカルチャートで上書き（後勝ち戦略、削除されていないもののみ）
    for (const localChart of localCharts) {
      if (allDeletedIds.has(localChart.id)) {
        continue; // 削除されたチャートはスキップ
      }
      
      const localMeta = localMetadata[localChart.id];
      const remoteMeta = remoteMetadata[localChart.id];
      
      if (!remoteMeta || !localMeta) {
        // リモートに存在しない場合は追加
        merged.set(localChart.id, localChart);
      } else {
        // タイムスタンプを比較して新しい方を採用
        const localModified = new Date(localMeta.lastModifiedAt);
        const remoteModified = new Date(remoteMeta.lastModifiedAt);
        
        if (localModified >= remoteModified) {
          merged.set(localChart.id, localChart);
        }
      }
    }
    
    return Array.from(merged.values());
  }
  
  private mergeSetLists(
    localSetLists: SetList[],
    remoteSetLists: SetList[],
    localMetadata: Record<string, SyncMetadata>,
    remoteMetadata: Record<string, SyncMetadata>,
    localDeletedSetLists: DeletedSetListRecord[],
    remoteDeletedSetLists: DeletedSetListRecord[]
  ): SetList[] {
    const merged = new Map<string, SetList>();
    
    // 削除されたセットリストのIDをセットに保存
    const allDeletedIds = new Set<string>();
    [...localDeletedSetLists, ...remoteDeletedSetLists].forEach(record => {
      allDeletedIds.add(record.id);
    });
    
    // リモートセットリストを先に追加（削除されていないもののみ）
    for (const remoteSetList of remoteSetLists) {
      if (!allDeletedIds.has(remoteSetList.id)) {
        merged.set(remoteSetList.id, remoteSetList);
      }
    }
    
    // ローカルセットリストで上書き（後勝ち戦略、削除されていないもののみ）
    for (const localSetList of localSetLists) {
      if (allDeletedIds.has(localSetList.id)) {
        continue;
      }
      
      const localMeta = localMetadata[localSetList.id];
      const remoteMeta = remoteMetadata[localSetList.id];
      
      if (!remoteMeta || !localMeta) {
        merged.set(localSetList.id, localSetList);
      } else {
        const localModified = new Date(localMeta.lastModifiedAt);
        const remoteModified = new Date(remoteMeta.lastModifiedAt);
        
        if (localModified >= remoteModified) {
          merged.set(localSetList.id, localSetList);
        }
      }
    }
    
    return Array.from(merged.values());
  }
  
  private mergeDeletedCharts(
    localDeletedCharts: DeletedChartRecord[],
    remoteDeletedCharts: DeletedChartRecord[]
  ): DeletedChartRecord[] {
    const merged = new Map<string, DeletedChartRecord>();
    
    // すべての削除記録を統合し、より新しい削除時刻を採用
    [...localDeletedCharts, ...remoteDeletedCharts].forEach(record => {
      const existing = merged.get(record.id);
      if (!existing || new Date(record.deletedAt) > new Date(existing.deletedAt)) {
        merged.set(record.id, record);
      }
    });
    
    return Array.from(merged.values());
  }
  
  private mergeDeletedSetLists(
    localDeletedSetLists: DeletedSetListRecord[],
    remoteDeletedSetLists: DeletedSetListRecord[]
  ): DeletedSetListRecord[] {
    const merged = new Map<string, DeletedSetListRecord>();
    
    [...localDeletedSetLists, ...remoteDeletedSetLists].forEach(record => {
      const existing = merged.get(record.id);
      if (!existing || new Date(record.deletedAt) > new Date(existing.deletedAt)) {
        merged.set(record.id, record);
      }
    });
    
    return Array.from(merged.values());
  }
  
  private mergeMetadata(
    localMetadata: Record<string, SyncMetadata>,
    remoteMetadata: Record<string, SyncMetadata>
  ): Record<string, SyncMetadata> {
    const merged = { ...remoteMetadata };
    const now = new Date().toISOString();
    
    for (const [chartId, localMeta] of Object.entries(localMetadata)) {
      const remoteMeta = remoteMetadata[chartId];
      
      if (!remoteMeta) {
        merged[chartId] = { ...localMeta, lastSyncedAt: now };
      } else {
        const localModified = new Date(localMeta.lastModifiedAt);
        const remoteModified = new Date(remoteMeta.lastModifiedAt);
        
        if (localModified >= remoteModified) {
          merged[chartId] = { ...localMeta, lastSyncedAt: now };
        } else {
          merged[chartId] = { ...remoteMeta, lastSyncedAt: now };
        }
      }
    }
    
    return merged;
  }
  
  private loadConfig(): SyncConfig {
    const stored = localStorage.getItem('nekogata-sync-config');
    if (stored) {
      const parsed = JSON.parse(stored);
      // 古い設定との互換性のために、不要なプロパティを除外
      return {
        autoSync: parsed.autoSync ?? false,
        showConflictWarning: parsed.showConflictWarning ?? true
      };
    }
    
    return {
      autoSync: false,
      showConflictWarning: true
    };
  }
  
  saveConfig(config: SyncConfig): void {
    this.config = config;
    localStorage.setItem('nekogata-sync-config', JSON.stringify(config));
  }
  
  getConfig(): SyncConfig {
    return this.config;
  }
  
  private getErrorType(error: unknown): 'auth' | 'network' | 'storage' | 'unknown' {
    if (error instanceof Error) {
      if (error.message?.includes('Not authenticated')) return 'auth';
      if (error.message?.includes('Failed to fetch')) return 'network';
      if (error.message?.includes('storage')) return 'storage';
    }
    return 'unknown';
  }
  
  private getLastSyncTime(): string {
    return localStorage.getItem('nekogata-last-sync') || new Date(0).toISOString();
  }
  
  private updateLastSyncTime(): void {
    localStorage.setItem('nekogata-last-sync', new Date().toISOString());
  }
  
  getLastSyncTimeAsDate(): Date {
    const time = this.getLastSyncTime();
    return new Date(time);
  }
}