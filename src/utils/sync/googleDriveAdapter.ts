import type { ChordChart } from '../../types/chord';
import type { ISyncAdapter, SyncMetadata } from '../../types/sync';
import { GoogleAuthProvider } from './googleAuth';

export class GoogleDriveSyncAdapter implements ISyncAdapter {
  private auth: GoogleAuthProvider;
  private readonly APP_FOLDER_NAME = 'NekogataScoreManager';
  private readonly METADATA_FILE_NAME = 'sync-metadata.json';
  private readonly CHARTS_FILE_NAME = 'charts.json';
  
  constructor() {
    this.auth = GoogleAuthProvider.getInstance();
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
  
  async pull(): Promise<{ charts: ChordChart[]; metadata: Record<string, SyncMetadata> }> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    const folderId = await this.getAppFolderId();
    if (!folderId) {
      return { charts: [], metadata: {} };
    }
    
    // チャートファイルを取得
    const chartsFileId = await this.getFileId(this.CHARTS_FILE_NAME, folderId);
    const metadataFileId = await this.getFileId(this.METADATA_FILE_NAME, folderId);
    
    const [charts, metadata] = await Promise.all([
      chartsFileId ? this.downloadFile<ChordChart[]>(chartsFileId) : [],
      metadataFileId ? this.downloadFile<Record<string, SyncMetadata>>(metadataFileId) : {}
    ]);
    
    return { charts: charts || [], metadata: metadata || {} };
  }
  
  async push(charts: ChordChart[], metadata: Record<string, SyncMetadata>): Promise<void> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    const folderId = await this.ensureAppFolder();
    
    // 既存のファイルIDを取得
    const chartsFileId = await this.getFileId(this.CHARTS_FILE_NAME, folderId);
    const metadataFileId = await this.getFileId(this.METADATA_FILE_NAME, folderId);
    
    // ファイルを更新または作成
    await Promise.all([
      this.uploadFile(this.CHARTS_FILE_NAME, charts, folderId, chartsFileId),
      this.uploadFile(this.METADATA_FILE_NAME, metadata, folderId, metadataFileId)
    ]);
  }
  
  async getRemoteMetadata(): Promise<Record<string, SyncMetadata>> {
    const { metadata } = await this.pull();
    return metadata;
  }
  
  async updateMetadata(chartId: string, metadata: SyncMetadata): Promise<void> {
    const currentMetadata = await this.getRemoteMetadata();
    currentMetadata[chartId] = metadata;
    
    const folderId = await this.getAppFolderId();
    if (!folderId) throw new Error('App folder not found');
    
    const metadataFileId = await this.getFileId(this.METADATA_FILE_NAME, folderId);
    await this.uploadFile(this.METADATA_FILE_NAME, currentMetadata, folderId, metadataFileId);
  }
  
  async getStorageInfo(): Promise<{ used: number; total: number }> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to get storage info');
    
    const data = await response.json();
    return {
      used: parseInt(data.storageQuota.usage || '0'),
      total: parseInt(data.storageQuota.limit || '15000000000') // 15GB default
    };
  }
  
  private async ensureAppFolder(): Promise<string> {
    let folderId = await this.getAppFolderId();
    
    if (!folderId) {
      folderId = await this.createAppFolder();
    }
    
    return folderId;
  }
  
  private async getAppFolderId(): Promise<string | null> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    const query = `name='${this.APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // 401エラーの場合はトークンが無効
      if (response.status === 401) {
        throw new Error('認証が無効です。再度サインインしてください。');
      }
      // 403エラーの場合はスコープ不足
      if (response.status === 403) {
        throw new Error('Google Driveへのアクセス権限がありません。');
      }
      // その他のエラー
      const errorText = await response.text();
      console.error('Google Drive API error:', response.status, errorText);
      throw new Error(`Failed to search for app folder (${response.status})`);
    }
    
    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  }
  
  private async createAppFolder(): Promise<string> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    const metadata = {
      name: this.APP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create app folder:', response.status, errorText);
      throw new Error(`Failed to create app folder (${response.status})`);
    }
    
    const data = await response.json();
    return data.id;
  }
  
  private async getFileId(fileName: string, folderId: string): Promise<string | null> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    const query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to search for file');
    
    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  }
  
  private async downloadFile<T>(fileId: string): Promise<T | null> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to download file');
    
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  
  private async uploadFile(fileName: string, content: unknown, folderId: string, fileId?: string | null): Promise<void> {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelim = "\r\n--" + boundary + "--";
    
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      ...(fileId ? {} : { parents: [folderId] })
    };
    
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(content, null, 2) +
      closeDelim;
    
    const url = fileId 
      ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    
    const response = await fetch(url, {
      method: fileId ? 'PATCH' : 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body: multipartRequestBody
    });
    
    if (!response.ok) throw new Error('Failed to upload file');
  }
}