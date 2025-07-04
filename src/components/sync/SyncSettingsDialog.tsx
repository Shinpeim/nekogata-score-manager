import React, { useState, useEffect, useCallback } from 'react';
import { SyncManager } from '../../utils/sync/syncManager';
import { useChartSync } from '../../hooks/useChartSync';
import type { SyncConfig } from '../../types/sync';
import { logger } from '../../utils/logger';

interface SyncSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncSettingsDialog: React.FC<SyncSettingsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const { 
    isSyncing, 
    lastSyncTime, 
    syncError, 
    isAuthenticated, 
    authenticate, 
    signOut, 
    syncCharts,
    clearSyncError,
    updateSyncConfig
  } = useChartSync();

  const syncManager = SyncManager.getInstance();

  const loadSettings = useCallback(async () => {
    try {
      setIsInitializing(true);
      
      // 同期マネージャーの初期化を確実に行う
      await syncManager.initialize();
      
      const currentConfig = syncManager.getConfig();
      setConfig(currentConfig);
      
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
      setAuthError(error instanceof Error ? error.message : '初期化に失敗しました');
    } finally {
      setIsInitializing(false);
    }
  }, [syncManager]);

  useEffect(() => {
    if (isOpen) {
      // ダイアログ開いた時に必要な初期化処理があれば実行
      // useChartSyncが自動的に初期化を処理する
      loadSettings();
    }
  }, [isOpen, loadSettings]);

  const handleSignIn = async () => {
    try {
      setAuthError(null);
      logger.debug('handleSignIn: Starting authentication...');
      await authenticate();
      logger.info('handleSignIn: Authentication successful');
      
    } catch (error) {
      console.error('handleSignIn: Authentication failed:', error);
      setAuthError(error instanceof Error ? error.message : '認証に失敗しました');
    }
  };

  const handleSignOut = async () => {
    try {
      setAuthError(null);
      await signOut();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'サインアウトに失敗しました');
    }
  };

  const handleConfigChange = async (updates: Partial<SyncConfig>) => {
    if (!config) return;
    
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    updateSyncConfig(newConfig);
  };

  const handleManualSync = async () => {
    if (!isAuthenticated) return;
    
    try {
      clearSyncError();
      await syncCharts();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const formatSyncTime = (date: Date | null) => {
    if (!date) return '未同期';
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Dropbox同期設定</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* 認証セクション */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <h3 className="text-sm font-medium text-slate-900 mb-3">アカウント連携</h3>
          
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#85B0B7] rounded-full"></div>
                <span className="text-sm text-slate-700">連携中</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm px-3 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
              >
                サインアウト
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                <span className="text-sm text-slate-700">未連携</span>
              </div>
              <button
                onClick={handleSignIn}
                disabled={isInitializing}
                className="text-sm px-3 py-2 bg-[#85B0B7] text-white rounded hover:bg-[#6B9CA5] disabled:bg-slate-300 disabled:text-slate-500"
              >
                {isInitializing ? '初期化中...' : 'Dropboxアカウントで連携'}
              </button>
            </div>
          )}
          
          {authError && (
            <div className="mt-2 text-xs text-[#EE5840]">{authError}</div>
          )}
        </div>

        {/* 同期設定セクション */}
        <div className="mb-6 space-y-4">
          <h3 className="text-sm font-medium text-slate-900">同期設定</h3>
          
          {/* 変更時同期 */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <label className="text-sm text-slate-700">変更時同期</label>
              <span className="text-xs text-slate-500">楽譜を編集したときに自動同期</span>
            </div>
            <button
              onClick={() => handleConfigChange({ autoSync: !config.autoSync })}
              className={`w-12 h-6 rounded-full transition-colors ${
                config.autoSync ? 'bg-[#85B0B7]' : 'bg-slate-300'
              }`}
              disabled={!isAuthenticated}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  config.autoSync ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* コンフリクト解決の説明 */}
          <div className="p-3 bg-slate-50 rounded-md">
            <p className="text-xs text-slate-600">
              <strong>データの競合について:</strong><br/>
              複数のデバイスで同じ楽譜を編集した場合、より新しいタイムスタンプの変更が優先されます。
            </p>
          </div>
        </div>

        {/* 同期状態セクション */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <h3 className="text-sm font-medium text-slate-900 mb-3">同期状態</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700">最終同期</span>
              <span className="text-xs text-slate-600">{formatSyncTime(lastSyncTime)}</span>
            </div>
            
            <button
              onClick={handleManualSync}
              disabled={!isAuthenticated || isSyncing}
              className="w-full text-sm px-3 py-2 bg-[#BDD0CA] text-slate-800 rounded hover:bg-[#A4C2B5] disabled:bg-slate-300 disabled:text-slate-500"
            >
              {isSyncing ? '同期中...' : '今すぐ同期'}
            </button>
            
            {syncError && (
              <div className="text-xs text-[#EE5840]">{syncError}</div>
            )}
          </div>
        </div>

        {/* 注意事項 */}
        <div className="text-xs text-slate-500 space-y-1">
          <p>• Dropboxの「NekogataScoreManager」フォルダに保存されます</p>
          <p>• 同期機能は現在テスト段階です</p>
          <p>• 重要なデータは定期的にエクスポートしてください</p>
        </div>
      </div>
    </div>
  );
};