import type { ChordChart } from '../../types/chord';
import type { ISyncAdapter, SyncMetadata, DeletedChartRecord } from '../../types/sync';
import { DropboxAuthProvider } from './dropboxAuth';

export class DropboxSyncAdapter implements ISyncAdapter {
  private auth: DropboxAuthProvider;
  private readonly APP_FOLDER_PATH: string;
  private readonly METADATA_FILE_PATH: string;
  private readonly CHARTS_FILE_PATH: string;
  private readonly DELETED_CHARTS_FILE_PATH: string;
  
  constructor() {
    this.auth = DropboxAuthProvider.getInstance();
    
    const folderName = this.generateFolderNameFromOrigin();
    this.APP_FOLDER_PATH = `/${folderName}`;
    this.METADATA_FILE_PATH = `/${folderName}/sync-metadata.json`;
    this.CHARTS_FILE_PATH = `/${folderName}/charts.json`;
    this.DELETED_CHARTS_FILE_PATH = `/${folderName}/deleted-charts.json`;
  }
  
  async initialize(): Promise<void> {
    await this.auth.initialize();
  }
  
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }
  
  async authenticate(): Promise<void> {
    await this.auth.authenticate();
    // 認証直後のトークン検証
    const isValid = await this.auth.validateToken();
    if (!isValid) {
      throw new Error('認証に失敗しました。再度お試しください。');
    }
    await this.ensureAppFolder();
  }
  
  async signOut(): Promise<void> {
    this.auth.signOut();
  }
  
  async pull(): Promise<{ charts: ChordChart[]; metadata: Record<string, SyncMetadata>; deletedCharts: DeletedChartRecord[] }> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    // ファイルが存在するかチェックしてからダウンロード
    const [charts, metadata, deletedCharts] = await Promise.all([
      this.downloadFile<ChordChart[]>(this.CHARTS_FILE_PATH).catch(() => []),
      this.downloadFile<Record<string, SyncMetadata>>(this.METADATA_FILE_PATH).catch(() => ({})),
      this.downloadFile<DeletedChartRecord[]>(this.DELETED_CHARTS_FILE_PATH).catch(() => [])
    ]);
    
    return { 
      charts: charts || [], 
      metadata: metadata || {},
      deletedCharts: deletedCharts || []
    };
  }
  
  async push(charts: ChordChart[], metadata: Record<string, SyncMetadata>, deletedCharts: DeletedChartRecord[]): Promise<void> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    await this.ensureAppFolder();
    
    // ファイルを更新または作成
    await Promise.all([
      this.uploadFile(this.CHARTS_FILE_PATH, charts),
      this.uploadFile(this.METADATA_FILE_PATH, metadata),
      this.uploadFile(this.DELETED_CHARTS_FILE_PATH, deletedCharts)
    ]);
  }
  
  async getRemoteMetadata(): Promise<Record<string, SyncMetadata>> {
    const { metadata } = await this.pull();
    return metadata;
  }
  
  async updateMetadata(chartId: string, metadata: SyncMetadata): Promise<void> {
    const currentMetadata = await this.getRemoteMetadata();
    currentMetadata[chartId] = metadata;
    
    await this.uploadFile(this.METADATA_FILE_PATH, currentMetadata);
  }
  
  async getStorageInfo(): Promise<{ used: number; total: number }> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch('https://api.dropboxapi.com/2/users/get_space_usage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) throw new Error('Failed to get storage info');
    
    const data = await response.json();
    return {
      used: data.used,
      total: data.allocation.allocated || 2000000000 // 2GB default for basic
    };
  }
  
  private async ensureAppFolder(): Promise<void> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    try {
      // フォルダが存在するかチェック
      await this.getFolderMetadata(this.APP_FOLDER_PATH);
    } catch {
      // フォルダが存在しない場合は作成
      await this.createAppFolder();
    }
  }
  
  private async getFolderMetadata(path: string): Promise<void> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch('https://api.dropboxapi.com/2/files/get_metadata', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: path
      })
    });
    
    if (!response.ok) {
      if (response.status === 409) {
        // ファイル/フォルダが見つからない
        throw new Error('Folder not found');
      }
      throw new Error('Failed to get folder metadata');
    }
  }
  
  private async createAppFolder(): Promise<void> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: this.APP_FOLDER_PATH,
        autorename: false
      })
    });
    
    if (!response.ok) {
      // フォルダが既に存在する場合は409エラーが返るが、それは正常
      if (response.status === 409) {
        return;
      }
      const errorText = await response.text();
      console.error('Failed to create app folder:', response.status, errorText);
      throw new Error(`Failed to create app folder (${response.status})`);
    }
  }
  
  private async downloadFile<T>(path: string): Promise<T | null> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: path
        })
      }
    });
    
    if (!response.ok) {
      if (response.status === 409) {
        // ファイルが見つからない場合
        return null;
      }
      throw new Error('Failed to download file');
    }
    
    try {
      const text = await response.text();
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  
  private async uploadFile(path: string, content: unknown): Promise<void> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: path,
          mode: 'overwrite',
          autorename: false
        })
      },
      body: JSON.stringify(content, null, 2)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dropbox file upload error:', response.status, errorText);
      throw new Error(`Failed to upload file: ${response.status} - ${errorText}`);
    }
  }

  private generateFolderNameFromOrigin(): string {
    const origin = window.location.origin;
    return this.sanitizeOriginForFolderName(origin);
  }

  private sanitizeOriginForFolderName(origin: string): string {
    return `NekogataScoreManager-${origin
      .replace(/^https?:\/\//, '')
      .replace(/[:.]/g, '-')
      .replace(/[^a-zA-Z0-9\-_]/g, '')
      .toLowerCase()}`;
  }
}