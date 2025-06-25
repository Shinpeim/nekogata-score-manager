import React, { useState, useEffect } from 'react';
import type { ChordChart } from '../types';
import ActionDropdown from './ActionDropdown';
import SetListTab from '../components/SetListTab';
import SetListCreationForm from '../components/SetListCreationForm';

type TabType = 'charts' | 'setlists';

interface ScoreExplorerProps {
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
  onDuplicateSelected: () => void;
  onEditChart: (chartId: string) => void;
  onCreateSetList?: (chartIds: string[]) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const ScoreExplorer: React.FC<ScoreExplorerProps> = ({
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
  onDuplicateSelected,
  onEditChart,
  onCreateSetList,
  isMobile = false,
  onClose,
}) => {
  // タブ状態をlocalStorageで永続化
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem('scoreExplorer-activeTab');
      return (saved as TabType) || 'charts';
    } catch {
      return 'charts';
    }
  });
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showCreateSetListForm, setShowCreateSetListForm] = useState(false);
  
  // タブ変更時にlocalStorageに保存
  useEffect(() => {
    try {
      localStorage.setItem('scoreExplorer-activeTab', activeTab);
    } catch {
      // localStorage が利用できない場合は何もしない
    }
  }, [activeTab]);
  
  const handleChartClick = (chartId: string) => {
    onSetCurrentChart(chartId);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleCreateSetList = () => {
    setShowCreateSetListForm(true);
  };

  const handleCreateSetListSuccess = () => {
    setShowCreateSetListForm(false);
    setActiveTab('setlists');
    if (onCreateSetList) {
      onCreateSetList(selectedChartIds);
    }
  };

  const handleCreateSetListCancel = () => {
    setShowCreateSetListForm(false);
  };

  const renderChartsTab = () => (
    <>
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
            data-testid={`select-all-checkbox-${isMobile ? 'mobile' : 'desktop'}`}
          />
          <span className="text-xs text-slate-600">一括選択</span>
          <ActionDropdown
            selectedChartIds={selectedChartIds}
            showActionsDropdown={showActionsDropdown}
            setShowActionsDropdown={setShowActionsDropdown}
            onExportSelected={onExportSelected}
            onDeleteSelected={onDeleteSelected}
            onDuplicateSelected={onDuplicateSelected}
            onCreateSetList={handleCreateSetList}
          />
          <span className="text-xs text-slate-500">
            {selectedChartIds.length > 0 ? `${selectedChartIds.length}件選択中` : '未選択'}
          </span>
        </div>
      )}
      <div className="space-y-2">
        {charts.map((chart, index) => (
          <div 
            key={chart.id} 
            className="flex items-center gap-2"
          >
            <input
              type="checkbox"
              checked={selectedChartIds.includes(chart.id)}
              onChange={() => onChartSelect(chart.id)}
              className="text-[#85B0B7] focus:ring-[#85B0B7]"
              data-testid={`chart-checkbox-${index}-${isMobile ? 'mobile' : 'desktop'}`}
            />
            <div 
              className={`flex-1 p-3 rounded-md transition-colors cursor-pointer ${
                currentChartId === chart.id 
                  ? 'bg-slate-100 border-[#85B0B7] border' 
                  : 'bg-slate-50 hover:bg-slate-100'
              }`}
              onClick={() => handleChartClick(chart.id)}
              data-testid={`chart-item-${index}-${isMobile ? 'mobile' : 'desktop'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-slate-900">{chart.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{chart.artist}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditChart(chart.id);
                    if (isMobile && onClose) {
                      onClose();
                    }
                  }}
                  className="ml-2 p-1.5 text-slate-500 hover:text-[#85B0B7] hover:bg-slate-100 rounded transition-colors"
                  data-testid={`edit-chart-${index}-${isMobile ? 'mobile' : 'desktop'}`}
                  title="編集"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
        <button 
          onClick={onCreateNew}
          className="w-full bg-[#85B0B7] hover:bg-[#6B9CA5] text-white px-3 py-2 rounded text-sm font-medium"
          data-testid={`explorer-create-new-button-${isMobile ? 'mobile' : 'desktop'}`}
        >
          新規作成
        </button>
        <button 
          onClick={onImport}
          className="w-full bg-[#BDD0CA] hover:bg-[#A4C2B5] text-slate-800 px-3 py-2 rounded text-sm font-medium"
          data-testid={`explorer-import-button-${isMobile ? 'mobile' : 'desktop'}`}
        >
          インポート
        </button>
      </div>
    </>
  );

  const content = (
    <div className={isMobile ? "px-4" : "p-4"}>
      {/* タブヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex bg-slate-100 rounded-md p-1">
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              activeTab === 'charts'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            data-testid={`charts-tab-${isMobile ? 'mobile' : 'desktop'}`}
          >
            楽譜
          </button>
          <button
            onClick={() => setActiveTab('setlists')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              activeTab === 'setlists'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            data-testid={`setlists-tab-${isMobile ? 'mobile' : 'desktop'}`}
          >
            セットリスト
          </button>
        </div>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'charts' ? renderChartsTab() : (
        <SetListTab
          onChartSelect={handleChartClick}
          isMobile={isMobile}
          onClose={onClose}
        />
      )}
    </div>
  );

  if (isMobile) {
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
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {content}
      {showCreateSetListForm && (
        <SetListCreationForm
          chartIds={selectedChartIds}
          onSuccess={handleCreateSetListSuccess}
          onCancel={handleCreateSetListCancel}
        />
      )}
    </>
  );
};

export default ScoreExplorer;