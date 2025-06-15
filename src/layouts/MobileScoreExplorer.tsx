import React, { useState } from 'react';
import type { ChordChart } from '../types';
import ActionDropdown from './ActionDropdown';

interface MobileScoreExplorerProps {
  charts: ChordChart[];
  currentChartId: string | null;
  selectedChartIds: string[];
  onChartSelect: (chartId: string) => void;
  onSelectAll: () => void;
  onSetCurrentChart: (chartId: string) => void;
  onCreateNew: () => void;
  onImport: () => void;
  onExportSelected: () => void;
  onDeleteSelected: () => void;
  onClose: () => void;
}

const MobileScoreExplorer: React.FC<MobileScoreExplorerProps> = ({
  charts,
  currentChartId,
  selectedChartIds,
  onChartSelect,
  onSelectAll,
  onSetCurrentChart,
  onCreateNew,
  onImport,
  onExportSelected,
  onDeleteSelected,
  onClose,
}) => {
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const handleChartClick = (chartId: string) => {
    onSetCurrentChart(chartId);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex z-40 md:hidden">
      <div className="fixed inset-0 bg-slate-600 bg-opacity-75" onClick={onClose}></div>
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
        <div className="absolute top-0 right-0 -mr-12 pt-2">
          <button
            onClick={onClose}
            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <span className="sr-only">Score Explorerを閉じる</span>
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-slate-900">Score Explorer</h2>
            </div>
            {charts.length > 0 && (
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedChartIds.length === charts.length}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = selectedChartIds.length > 0 && selectedChartIds.length < charts.length;
                    }
                  }}
                  onChange={onSelectAll}
                  className="text-[#85B0B7] focus:ring-[#85B0B7]"
                  title={selectedChartIds.length === charts.length ? '全て解除' : '全て選択'}
                />
                <span className="text-xs text-slate-600">一括選択</span>
                <ActionDropdown
                  selectedChartIds={selectedChartIds}
                  showActionsDropdown={showActionsDropdown}
                  setShowActionsDropdown={setShowActionsDropdown}
                  onExportSelected={onExportSelected}
                  onDeleteSelected={onDeleteSelected}
                />
                <span className="text-xs text-slate-500">
                  {selectedChartIds.length > 0 ? `${selectedChartIds.length}件選択中` : '未選択'}
                </span>
              </div>
            )}
            <div className="space-y-2">
              {charts.map((chart) => (
                <div 
                  key={chart.id} 
                  className="flex items-start gap-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedChartIds.includes(chart.id)}
                    onChange={() => onChartSelect(chart.id)}
                    className="mt-3 text-[#85B0B7] focus:ring-[#85B0B7]"
                  />
                  <div 
                    className={`flex-1 p-3 rounded-md transition-colors cursor-pointer ${
                      currentChartId === chart.id 
                        ? 'bg-slate-100 border-[#85B0B7] border' 
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                    onClick={() => handleChartClick(chart.id)}
                  >
                    <h3 className="text-sm font-medium text-slate-900">{chart.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{chart.artist}</p>
                    {chart.tags && chart.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {chart.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="px-1.5 py-0.5 bg-[#BDD0CA] text-slate-800 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Mobile Actions */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
              <button 
                onClick={onCreateNew}
                className="w-full bg-[#85B0B7] hover:bg-[#6B9CA5] text-white px-3 py-2 rounded text-sm font-medium"
              >
                新規作成
              </button>
              <button 
                onClick={onImport}
                className="w-full bg-[#BDD0CA] hover:bg-[#A4C2B5] text-slate-800 px-3 py-2 rounded text-sm font-medium"
              >
                インポート
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileScoreExplorer;