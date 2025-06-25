import type { ChordChart } from './chord';
import type { SetList } from './setList';

export interface SyncMetadata {
  lastSyncedAt: string;
  lastModifiedAt: string;
  deviceId: string;
  remoteId?: string;
}

export interface DeletedChartRecord {
  id: string;
  deletedAt: string;
  deviceId: string;
}

export interface DeletedSetListRecord {
  id: string;
  deletedAt: string;
  deviceId: string;
}

export interface SyncConflict {
  localChart: ChordChart;
  remoteChart: ChordChart;
  localMetadata: SyncMetadata;
  remoteMetadata: SyncMetadata;
}

export interface SetListSyncConflict {
  localSetList: SetList;
  remoteSetList: SetList;
  localMetadata: SyncMetadata;
  remoteMetadata: SyncMetadata;
}

export interface SyncResult {
  success: boolean;
  conflicts: SyncConflict[];
  setListConflicts: SetListSyncConflict[];
  syncedCharts: string[];
  syncedSetLists: string[];
  mergedCharts?: ChordChart[];
  mergedSetLists?: SetList[];
  errors: SyncError[];
}

interface SyncError {
  chartId: string;
  error: Error;
  type: 'auth' | 'network' | 'storage' | 'unknown';
}

export interface ISyncAdapter {
  // 認証関連
  isAuthenticated(): boolean;
  authenticate(): Promise<void>;
  signOut(): Promise<void>;
  
  // 同期操作
  pull(): Promise<{ 
    charts: ChordChart[]; 
    metadata: Record<string, SyncMetadata>; 
    deletedCharts: DeletedChartRecord[];
    setLists: SetList[];
    setListMetadata: Record<string, SyncMetadata>;
    deletedSetLists: DeletedSetListRecord[];
  }>;
  push(
    charts: ChordChart[], 
    metadata: Record<string, SyncMetadata>, 
    deletedCharts: DeletedChartRecord[],
    setLists: SetList[],
    setListMetadata: Record<string, SyncMetadata>,
    deletedSetLists: DeletedSetListRecord[]
  ): Promise<void>;
  
  // メタデータ操作
  getRemoteMetadata(): Promise<Record<string, SyncMetadata>>;
  updateMetadata(chartId: string, metadata: SyncMetadata): Promise<void>;
  
  // ユーティリティ
  getStorageInfo(): Promise<{ used: number; total: number }>;
}

export interface SyncConfig {
  autoSync: boolean;
  showConflictWarning: boolean;
}