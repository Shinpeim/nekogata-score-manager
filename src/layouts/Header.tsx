import React, { useState } from 'react';
import { useWakeLock } from '../hooks/useWakeLock';
import { useHiddenFeatures } from '../hooks/useHiddenFeatures';
import { SyncSettingsDialog } from '../components/sync/SyncSettingsDialog';
import { SyncStatusIndicator } from '../components/sync/SyncStatusIndicator';
import { SyncDropdown } from '../components/sync/SyncDropdown';

interface HeaderProps {
  explorerOpen: boolean;
  setExplorerOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ explorerOpen, setExplorerOpen }) => {
  const { isActive: wakeLockActive, isSupported: wakeLockSupported, toggleWakeLock } = useWakeLock();
  const { syncSettings } = useHiddenFeatures();
  const [syncSettingsOpen, setSyncSettingsOpen] = useState(false);
  const [syncDropdownOpen, setSyncDropdownOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-slate-200" data-testid="header">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <button
            onClick={() => setExplorerOpen(!explorerOpen)}
            className="px-3 py-2 rounded-md bg-slate-100 border border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mr-3 shadow-sm transition-all duration-150 text-sm font-medium"
            aria-label={explorerOpen ? "Close Score Explorer" : "Open Score Explorer"}
            data-testid="explorer-toggle"
          >
            {explorerOpen ? (
              <span className="text-lg font-bold">&lt;</span>
            ) : (
              <span className="text-lg font-bold">&gt;</span>
            )}
          </button>
          <h1 className="text-xl font-semibold text-slate-900 hidden" data-testid="app-title">Nekogata Score Manager</h1>
          <div className="flex-1"></div>
          {syncSettings && (
            <SyncStatusIndicator className="mr-4" />
          )}
          {syncSettings && (
            <div className="mr-3">
              <SyncDropdown
                showDropdown={syncDropdownOpen}
                setShowDropdown={setSyncDropdownOpen}
                onOpenSettings={() => setSyncSettingsOpen(true)}
              />
            </div>
          )}
          {wakeLockSupported && (
            <div className="flex items-center gap-2" data-testid="wake-lock-button">
              <span className="text-sm text-slate-700 flex items-center gap-1">
                <span className="font-mono relative">
                  Zzz
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-4 h-0.5 bg-current transform rotate-45"></span>
                  </span>
                </span>
                <span className="hidden sm:inline font-medium">スリープ防止</span>
              </span>
              <div
                onClick={toggleWakeLock}
                className={`flex items-center rounded-full p-0.5 w-11 relative cursor-pointer transition-all duration-150 ${
                  wakeLockActive
                    ? 'bg-[#85B0B7] hover:bg-[#6B9CA5]'
                    : 'bg-slate-200 hover:bg-slate-300'
                }`}
                title={wakeLockActive ? 'スリープ防止を無効にする' : 'スリープ防止を有効にする'}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  wakeLockActive ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </div>
            </div>
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