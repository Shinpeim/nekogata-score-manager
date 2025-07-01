import React, { useRef, useEffect, useState } from 'react';
import { useChartSync } from '../../hooks/useChartSync';

interface SyncDropdownProps {
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  onOpenSettings: () => void;
}

const SyncDropdown: React.FC<SyncDropdownProps> = ({
  showDropdown,
  setShowDropdown,
  onOpenSettings,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const { isAuthenticated, syncCharts, isSyncing } = useChartSync();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown, setShowDropdown]);

  const handleSyncClick = async () => {
    if (!isAuthenticated || syncInProgress || isSyncing) return;

    setSyncInProgress(true);
    setShowDropdown(false);

    try {
      await syncCharts();
      // 成功時の通知は将来的にトースト等で実装
    } catch (error) {
      console.error('Sync failed:', error);
      // エラー時の処理は既存のSyncErrorで表示される
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleSettingsClick = () => {
    setShowDropdown(false);
    onOpenSettings();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="px-3 py-2 rounded-md bg-slate-100 border border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-150 text-sm font-medium"
        title="同期オプション"
        data-testid="sync-dropdown-button"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">同期</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      
      {showDropdown && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg min-w-48 z-50">
          <button
            onClick={handleSyncClick}
            disabled={!isAuthenticated || syncInProgress || isSyncing}
            className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
              isAuthenticated && !syncInProgress && !isSyncing
                ? 'text-slate-700 hover:bg-slate-100'
                : 'text-slate-400 cursor-not-allowed'
            }`}
            data-testid="sync-execute-button"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncInProgress || isSyncing ? '同期中...' : '今すぐ同期'}
            </div>
          </button>
          
          <div className="border-t border-slate-200"></div>
          
          <button
            onClick={handleSettingsClick}
            className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            data-testid="sync-settings-button"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {isAuthenticated ? '詳細設定' : 'アカウント連携'}
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export { SyncDropdown };