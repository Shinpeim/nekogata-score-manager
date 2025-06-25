import React, { useRef, useEffect } from 'react';

interface ActionDropdownProps {
  selectedChartIds: string[];
  showActionsDropdown: boolean;
  setShowActionsDropdown: (show: boolean) => void;
  onExportSelected: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onCreateSetList?: () => void;
  isMobile?: boolean;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({
  selectedChartIds,
  showActionsDropdown,
  setShowActionsDropdown,
  onExportSelected,
  onDeleteSelected,
  onDuplicateSelected,
  onCreateSetList,
  isMobile = false,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setShowActionsDropdown(false);
      }
    };

    if (showActionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showActionsDropdown, setShowActionsDropdown]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          if (selectedChartIds.length > 0) {
            setShowActionsDropdown(!showActionsDropdown);
          }
        }}
        disabled={selectedChartIds.length === 0}
        className={`px-2 py-1 rounded text-xs font-medium flex items-center ${
          selectedChartIds.length > 0
            ? 'bg-[#85B0B7] hover:bg-[#6B9CA5] text-white cursor-pointer'
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
        }`}
        title="アクション"
        data-testid={`action-dropdown-button-${isMobile ? 'mobile' : 'desktop'}`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showActionsDropdown && selectedChartIds.length > 0 && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 min-w-32">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowActionsDropdown(false);
              setTimeout(() => onDuplicateSelected(), 0);
            }}
            className="block w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
          >
            複製
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowActionsDropdown(false);
              setTimeout(() => onExportSelected(), 0);
            }}
            className="block w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
          >
            エクスポート
          </button>
          {onCreateSetList && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowActionsDropdown(false);
                setTimeout(() => onCreateSetList(), 0);
              }}
              className="block w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
              data-testid="create-setlist-action"
            >
              セットリスト作成
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowActionsDropdown(false);
              setTimeout(() => onDeleteSelected(), 0);
            }}
            className="block w-full text-left px-3 py-2 text-xs text-[#EE5840] hover:bg-slate-100"
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionDropdown;