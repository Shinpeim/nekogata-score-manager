import React, { useState, useRef, useEffect } from 'react';
import { CloudArrowUpIcon, CloudIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useSyncStore } from '../../stores/syncStore';
import { logger } from '../../utils/logger';

interface SyncStatusIndicatorProps {
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ className = '' }) => {
  const { isSyncing, lastSyncTime, syncError, isAuthenticated } = useSyncStore();
  const [showErrorDetail, setShowErrorDetail] = useState(false);
  const errorDetailRef = useRef<HTMLDivElement>(null);
  
  // デバッグログを追加
  logger.debug('SyncStatusIndicator Authentication status:', isAuthenticated);
  logger.debug('SyncStatusIndicator isSyncing:', isSyncing);
  logger.debug('SyncStatusIndicator lastSyncTime:', lastSyncTime);
  logger.debug('SyncStatusIndicator syncError:', syncError);
  
  // エラー詳細を外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (errorDetailRef.current && !errorDetailRef.current.contains(event.target as Node)) {
        setShowErrorDetail(false);
      }
    };

    if (showErrorDetail) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showErrorDetail]);
  
  if (!isAuthenticated) {
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
    <div className={`relative flex items-center gap-2 text-xs text-slate-600 ${className}`}>
      {syncStatus === 'syncing' ? (
        <>
          <CloudArrowUpIcon className="w-4 h-4 animate-pulse" />
          <span>同期中...</span>
        </>
      ) : syncStatus === 'error' ? (
        <>
          <button
            className="flex items-center gap-1 text-[#EE5840] hover:text-red-700 focus:outline-none"
            onClick={() => setShowErrorDetail(!showErrorDetail)}
            title="エラー詳細を表示"
          >
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span>同期エラー</span>
          </button>
          {showErrorDetail && (
            <div 
              ref={errorDetailRef}
              className="absolute top-full right-0 mt-1 p-2 bg-white border border-slate-200 rounded-md shadow-lg z-10 max-w-xs"
            >
              <p className="text-xs text-[#EE5840] whitespace-pre-wrap break-words">
                {syncError}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <CloudIcon className="w-4 h-4" />
          <span className="hidden sm:inline">最終同期: {formatLastSync(lastSyncTime)}</span>
          <span className="sm:hidden">{formatLastSync(lastSyncTime)}</span>
        </>
      )}
    </div>
  );
};