import React from 'react';
import { CloudArrowUpIcon, CloudIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useSyncStore } from '../../stores/syncStore';
import { logger } from '../../utils/logger';

interface SyncStatusIndicatorProps {
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ className = '' }) => {
  const { isSyncing, lastSyncTime, syncError, isAuthenticated } = useSyncStore();
  
  // デバッグログを追加
  const authStatus = isAuthenticated();
  logger.debug('SyncStatusIndicator Authentication status:', authStatus);
  logger.debug('SyncStatusIndicator isSyncing:', isSyncing);
  logger.debug('SyncStatusIndicator lastSyncTime:', lastSyncTime);
  logger.debug('SyncStatusIndicator syncError:', syncError);
  
  if (!authStatus) {
    return null;
  }
  
  const syncStatus = syncError ? 'error' : isSyncing ? 'syncing' : 'idle';
  
  const formatLastSync = (date: Date | null): string => {
    if (!date || date.getTime() === 0) return '未同期';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    return `${days}日前`;
  };
  
  return (
    <div className={`flex items-center gap-2 text-xs text-slate-600 ${className}`}>
      {syncStatus === 'syncing' ? (
        <>
          <CloudArrowUpIcon className="w-4 h-4 animate-pulse" />
          <span>同期中...</span>
        </>
      ) : syncStatus === 'error' ? (
        <>
          <ExclamationTriangleIcon className="w-4 h-4 text-[#EE5840]" />
          <span className="text-[#EE5840]">同期エラー</span>
        </>
      ) : (
        <>
          <CloudIcon className="w-4 h-4" />
          <span>最終同期: {formatLastSync(lastSyncTime)}</span>
        </>
      )}
    </div>
  );
};