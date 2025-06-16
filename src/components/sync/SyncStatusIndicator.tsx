import React, { useState, useEffect } from 'react';
import { CloudArrowUpIcon, CloudIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { SyncManager } from '../../utils/sync/syncManager';

interface SyncStatusIndicatorProps {
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ className = '' }) => {
  const [syncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const syncManager = SyncManager.getInstance();
  
  useEffect(() => {
    const checkStatus = () => {
      setIsAuthenticated(syncManager.isAuthenticated());
      setLastSyncTime(new Date(localStorage.getItem('nekogata-last-sync') || new Date(0).toISOString()));
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 10000); // 10秒ごとに更新
    
    return () => clearInterval(interval);
  }, [syncManager]);
  
  if (!isAuthenticated) {
    return null;
  }
  
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