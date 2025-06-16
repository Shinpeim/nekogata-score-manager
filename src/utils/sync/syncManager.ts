import type { ChordChart } from '../../types/chord';
import type { ISyncAdapter, SyncMetadata, SyncConflict, SyncResult, SyncConfig } from '../../types/sync';
import { GoogleDriveSyncAdapter } from './googleDriveAdapter';
import { getDeviceId } from './deviceId';

export class SyncManager {
  private static instance: SyncManager;
  private adapter: ISyncAdapter;
  private config: SyncConfig;
  private syncInProgress = false;
  
  private constructor() {
    this.adapter = new GoogleDriveSyncAdapter();
    this.config = this.loadConfig();
  }
  
  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }
  
  async initialize(): Promise<void> {
    await (this.adapter as GoogleDriveSyncAdapter).initialize();
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
    onConflict?: (conflicts: SyncConflict[]) => Promise<'overwrite' | 'cancel'>
  ): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }
    
    this.syncInProgress = true;
    const result: SyncResult = {
      success: false,
      conflicts: [],
      syncedCharts: [],
      errors: []
    };
    
    try {
      // リモートデータを取得
      const { charts: remoteCharts, metadata: remoteMetadata } = await this.adapter.pull();
      
      // ローカルメタデータを生成
      const localMetadata = this.generateLocalMetadata(localCharts);
      
      // コンフリクトを検出
      const conflicts = this.detectConflicts(localCharts, remoteCharts, localMetadata, remoteMetadata);
      
      if (conflicts.length > 0) {
        result.conflicts = conflicts;
        
        if (this.config.showConflictWarning && onConflict) {
          const action = await onConflict(conflicts);
          if (action === 'cancel') {
            result.success = false;
            return result;
          }
        }
      }
      
      // マージ処理（後勝ち戦略）
      const mergedCharts = this.mergeCharts(localCharts, remoteCharts, localMetadata, remoteMetadata);
      const mergedMetadata = this.mergeMetadata(localMetadata, remoteMetadata);
      
      // プッシュ
      await this.adapter.push(mergedCharts, mergedMetadata);
      
      result.success = true;
      result.syncedCharts = mergedCharts.map(c => c.id);
      
      // 最終同期時刻を更新
      this.updateLastSyncTime();
      
      return result;
      
    } catch (error) {
      result.errors.push({
        chartId: '',
        error: error as Error,
        type: this.getErrorType(error)
      });
      return result;
    } finally {
      this.syncInProgress = false;
    }
  }
  
  private generateLocalMetadata(charts: ChordChart[]): Record<string, SyncMetadata> {
    const deviceId = getDeviceId();
    const metadata: Record<string, SyncMetadata> = {};
    
    for (const chart of charts) {
      metadata[chart.id] = {
        lastSyncedAt: this.getLastSyncTime(),
        lastModifiedAt: new Date().toISOString(),
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
      
      if (localModified > lastSync && remoteModified > lastSync) {
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
  
  private mergeCharts(
    localCharts: ChordChart[],
    remoteCharts: ChordChart[],
    localMetadata: Record<string, SyncMetadata>,
    remoteMetadata: Record<string, SyncMetadata>
  ): ChordChart[] {
    const merged = new Map<string, ChordChart>();
    
    // リモートチャートを先に追加
    for (const remoteChart of remoteCharts) {
      merged.set(remoteChart.id, remoteChart);
    }
    
    // ローカルチャートで上書き（後勝ち戦略）
    for (const localChart of localCharts) {
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
      return JSON.parse(stored);
    }
    
    return {
      autoSync: false,
      syncInterval: 5,
      conflictResolution: 'remote',
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