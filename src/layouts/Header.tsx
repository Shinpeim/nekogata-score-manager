import React, { useState } from 'react';
import { useWakeLock } from '../hooks/useWakeLock';
import { useHiddenFeatures } from '../hooks/useHiddenFeatures';
import { SyncSettingsDialog } from '../components/sync/SyncSettingsDialog';
import { SyncStatusIndicator } from '../components/sync/SyncStatusIndicator';
import { useChartSync } from '../hooks/useChartSync';

interface HeaderProps {
  explorerOpen: boolean;
  setExplorerOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ explorerOpen, setExplorerOpen }) => {
  const { isActive: wakeLockActive, isSupported: wakeLockSupported, toggleWakeLock } = useWakeLock();
  const { syncSettings } = useHiddenFeatures();
  const [syncSettingsOpen, setSyncSettingsOpen] = useState(false);
  const { syncError } = useChartSync();

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <button
            onClick={() => setExplorerOpen(!explorerOpen)}
            className="px-3 py-2 rounded-md bg-slate-100 border border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mr-3 shadow-sm transition-all duration-150 text-sm font-medium"
            aria-label={explorerOpen ? "Close Score Explorer" : "Open Score Explorer"}
          >
            {explorerOpen ? (
              <span className="flex items-center gap-1">
                <span className="text-lg font-bold">&lt;</span>
                <span className="text-xs">close score explorer</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="text-lg font-bold">&gt;</span>
                <span className="text-xs">open score explorer</span>
              </span>
            )}
          </button>
          <h1 className="text-xl font-semibold text-slate-900">Nekogata Score Manager</h1>
          <div className="flex-1"></div>
          {syncSettings && (
            <>
              <SyncStatusIndicator className="mr-4" />
              {syncError && (
                <div className="text-xs text-[#EE5840] mr-4">
                  同期エラー: {syncError}
                </div>
              )}
            </>
          )}
          {syncSettings && (
            <button
              onClick={() => setSyncSettingsOpen(true)}
              className="px-3 py-2 rounded-md bg-slate-100 border border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mr-3 shadow-sm transition-all duration-150 text-sm font-medium"
              title="Google Drive同期設定"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">同期設定</span>
              </span>
            </button>
          )}
          {wakeLockSupported && (
            <button
              onClick={toggleWakeLock}
              className={`px-3 py-2 rounded-md border text-sm font-medium transition-all duration-150 shadow-sm ${
                wakeLockActive
                  ? 'bg-[#85B0B7] hover:bg-[#6B9CA5] text-white border-[#85B0B7]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
              }`}
              title={wakeLockActive ? 'スリープ防止を無効にする' : 'スリープ防止を有効にする'}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {wakeLockActive ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  )}
                </svg>
                <span className="hidden sm:inline">
                  {wakeLockActive ? 'スリープ防止中' : 'スリープ防止'}
                </span>
              </span>
            </button>
          )}
        </div>
      </div>
      
      <SyncSettingsDialog
        isOpen={syncSettingsOpen}
        onClose={() => setSyncSettingsOpen(false)}
      />
    </header>
  );
};

export default Header;