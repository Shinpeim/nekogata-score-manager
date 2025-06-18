import type { ChordChart } from './chord';

export interface SyncMetadata {
  lastSyncedAt: string;
  lastModifiedAt: string;
  deviceId: string;
  remoteId?: string;
}

export interface SyncConflict {
  localChart: ChordChart;
  remoteChart: ChordChart;
  localMetadata: SyncMetadata;
  remoteMetadata: SyncMetadata;
}

export interface SyncResult {
  success: boolean;
  conflicts: SyncConflict[];
  syncedCharts: string[];
  mergedCharts?: ChordChart[];
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
  pull(): Promise<{ charts: ChordChart[]; metadata: Record<string, SyncMetadata> }>;
  push(charts: ChordChart[], metadata: Record<string, SyncMetadata>): Promise<void>;
  
  // メタデータ操作
  getRemoteMetadata(): Promise<Record<string, SyncMetadata>>;
  updateMetadata(chartId: string, metadata: SyncMetadata): Promise<void>;
  
  // ユーティリティ
  getStorageInfo(): Promise<{ used: number; total: number }>;
}

export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // minutes
  conflictResolution: 'local' | 'remote' | 'manual';
  showConflictWarning: boolean;
}