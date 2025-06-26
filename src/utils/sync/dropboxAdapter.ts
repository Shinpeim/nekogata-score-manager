import type { ChordChart } from '../../types/chord';
import type { SetList } from '../../types/setList';
import type { ISyncAdapter, SyncMetadata, DeletedChartRecord, DeletedSetListRecord } from '../../types/sync';
import { DropboxAuthProvider } from './dropboxAuth';

export class DropboxSyncAdapter implements ISyncAdapter {
  private auth: DropboxAuthProvider;
  private readonly APP_FOLDER_PATH: string;
  private readonly METADATA_FILE_PATH: string;
  private readonly CHARTS_FILE_PATH: string;
  private readonly DELETED_CHARTS_FILE_PATH: string;
  private readonly SETLISTS_FILE_PATH: string;
  private readonly SETLIST_METADATA_FILE_PATH: string;
  private readonly DELETED_SETLISTS_FILE_PATH: string;
  
  constructor() {
    this.auth = DropboxAuthProvider.getInstance();
    
    const folderName = this.generateFolderNameFromOrigin();
    this.APP_FOLDER_PATH = `/${folderName}`;
    this.METADATA_FILE_PATH = `/${folderName}/sync-metadata.json`;
    this.CHARTS_FILE_PATH = `/${folderName}/charts.json`;
    this.DELETED_CHARTS_FILE_PATH = `/${folderName}/deleted-charts.json`;
    this.SETLISTS_FILE_PATH = `/${folderName}/setlists.json`;
    this.SETLIST_METADATA_FILE_PATH = `/${folderName}/setlist-metadata.json`;
    this.DELETED_SETLISTS_FILE_PATH = `/${folderName}/deleted-setlists.json`;
  }
  
  async initialize(): Promise<void> {
    await this.auth.initialize();
  }
  
  isAuthenticated(): boolean {
    // アクセストークンが有効、またはリフレッシュトークンがある場合は認証済みとする
    return this.auth.isAuthenticated() || this.auth.hasValidRefreshToken();
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
  
  async pull(): Promise<{ 
    charts: ChordChart[]; 
    metadata: Record<string, SyncMetadata>; 
    deletedCharts: DeletedChartRecord[];
    setLists: SetList[];
    setListMetadata: Record<string, SyncMetadata>;
    deletedSetLists: DeletedSetListRecord[];
  }> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    // ファイルが存在するかチェックしてからダウンロード
    const [charts, metadata, deletedCharts, setLists, setListMetadata, deletedSetLists] = await Promise.all([
      this.downloadFile<ChordChart[]>(this.CHARTS_FILE_PATH).catch((error) => {
        // ファイルが見つからない場合は空配列を返す
        if (error.message === 'File not found') {
          return [];
        }
        // それ以外のエラーは伝播させる
        throw error;
      }),
      this.downloadFile<Record<string, SyncMetadata>>(this.METADATA_FILE_PATH).catch((error) => {
        if (error.message === 'File not found') {
          return {};
        }
        throw error;
      }),
      this.downloadFile<DeletedChartRecord[]>(this.DELETED_CHARTS_FILE_PATH).catch((error) => {
        if (error.message === 'File not found') {
          return [];
        }
        throw error;
      }),
      this.downloadFile<SetList[]>(this.SETLISTS_FILE_PATH).catch((error) => {
        if (error.message === 'File not found') {
          return [];
        }
        throw error;
      }),
      this.downloadFile<Record<string, SyncMetadata>>(this.SETLIST_METADATA_FILE_PATH).catch((error) => {
        if (error.message === 'File not found') {
          return {};
        }
        throw error;
      }),
      this.downloadFile<DeletedSetListRecord[]>(this.DELETED_SETLISTS_FILE_PATH).catch((error) => {
        if (error.message === 'File not found') {
          return [];
        }
        throw error;
      })
    ]);
    
    return { 
      charts: charts || [], 
      metadata: metadata || {},
      deletedCharts: deletedCharts || [],
      setLists: setLists || [],
      setListMetadata: setListMetadata || {},
      deletedSetLists: deletedSetLists || []
    };
  }
  
  async push(
    charts: ChordChart[], 
    metadata: Record<string, SyncMetadata>, 
    deletedCharts: DeletedChartRecord[],
    setLists: SetList[],
    setListMetadata: Record<string, SyncMetadata>,
    deletedSetLists: DeletedSetListRecord[]
  ): Promise<void> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    await this.ensureAppFolder();
    
    // ファイルを更新または作成
    await Promise.all([
      this.uploadFile(this.CHARTS_FILE_PATH, charts),
      this.uploadFile(this.METADATA_FILE_PATH, metadata),
      this.uploadFile(this.DELETED_CHARTS_FILE_PATH, deletedCharts),
      this.uploadFile(this.SETLISTS_FILE_PATH, setLists),
      this.uploadFile(this.SETLIST_METADATA_FILE_PATH, setListMetadata),
      this.uploadFile(this.DELETED_SETLISTS_FILE_PATH, deletedSetLists)
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
  
  async getStorageInfo(isRetry = false): Promise<{ used: number; total: number }> {
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
    
    if (!response.ok) {
      if (response.status === 401 && !isRetry) {
        // アクセストークンが期限切れの場合、リフレッシュしてリトライ
        console.log('Access token expired, attempting to refresh...');
        try {
          await this.auth.authenticate();
          return this.getStorageInfo(true);
        } catch (error) {
          console.error('Failed to refresh token:', error);
          throw new Error('Authentication failed');
        }
      }
      throw new Error('Failed to get storage info');
    }
    
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
    } catch (error) {
      // フォルダが存在しない場合は作成
      if (error instanceof Error && error.message === 'Folder not found') {
        await this.createAppFolder();
      } else {
        // その他のエラーは伝播させる
        throw error;
      }
    }
  }
  
  private async getFolderMetadata(path: string, isRetry = false): Promise<void> {
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
      
      if (response.status === 401 && !isRetry) {
        // アクセストークンが期限切れの場合、リフレッシュしてリトライ
        console.log('Access token expired, attempting to refresh...');
        try {
          await this.auth.authenticate();
          return this.getFolderMetadata(path, true);
        } catch (error) {
          console.error('Failed to refresh token:', error);
          throw new Error(`Authentication failed: ${response.status}`);
        }
      }
      
      throw new Error('Failed to get folder metadata');
    }
  }
  
  private async createAppFolder(isRetry = false): Promise<void> {
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
      
      if (response.status === 401 && !isRetry) {
        // アクセストークンが期限切れの場合、リフレッシュしてリトライ
        console.log('Access token expired, attempting to refresh...');
        try {
          await this.auth.authenticate();
          return this.createAppFolder(true);
        } catch (error) {
          console.error('Failed to refresh token:', error);
          const errorText = await response.text();
          throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
        }
      }
      
      const errorText = await response.text();
      console.error('Failed to create app folder:', response.status, errorText);
      throw new Error(`Failed to create app folder (${response.status})`);
    }
  }
  
  private async downloadFile<T>(path: string, isRetry = false): Promise<T | null> {
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
        throw new Error('File not found');
      }
      
      if (response.status === 401 && !isRetry) {
        // アクセストークンが期限切れの場合、リフレッシュしてリトライ
        console.log('Access token expired, attempting to refresh...');
        try {
          await this.auth.authenticate();
          return this.downloadFile<T>(path, true);
        } catch (error) {
          console.error('Failed to refresh token:', error);
          throw new Error(`Authentication failed: ${response.status}`);
        }
      }
      
      const errorText = await response.text();
      console.error('Dropbox download error:', response.status, errorText);
      throw new Error(`Failed to download file: ${response.status}`);
    }
    
    try {
      const text = await response.text();
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  
  private async uploadFile(path: string, content: unknown, isRetry = false): Promise<void> {
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
      if (response.status === 401 && !isRetry) {
        // アクセストークンが期限切れの場合、リフレッシュしてリトライ
        console.log('Access token expired, attempting to refresh...');
        try {
          await this.auth.authenticate();
          return this.uploadFile(path, content, true);
        } catch (error) {
          console.error('Failed to refresh token:', error);
          const errorText = await response.text();
          throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
        }
      }
      
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