import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useChordChartStore } from '../stores/chordChartStore';
import ChordChartForm from '../components/ChordChartForm';
import ImportDialog from '../components/ImportDialog';
import type { ChordChart } from '../types';

interface MainLayoutProps {
  children: ReactNode;
  explorerOpen?: boolean;
  setExplorerOpen?: (open: boolean) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, explorerOpen: propExplorerOpen, setExplorerOpen: propSetExplorerOpen }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [localExplorerOpen, setLocalExplorerOpen] = useState(false);
  
  // Use props if provided, otherwise use local state
  const explorerOpen = propExplorerOpen !== undefined ? propExplorerOpen : localExplorerOpen;
  const setExplorerOpen = propSetExplorerOpen || setLocalExplorerOpen;
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedChartIds, setSelectedChartIds] = useState<string[]>([]);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRef2 = useRef<HTMLDivElement>(null);
  
  const chartsData = useChordChartStore(state => state.charts);
  const currentChartId = useChordChartStore(state => state.currentChartId);
  const setCurrentChart = useChordChartStore(state => state.setCurrentChart);
  const createNewChart = useChordChartStore(state => state.createNewChart);
  const addChart = useChordChartStore(state => state.addChart);
  const deleteMultipleCharts = useChordChartStore(state => state.deleteMultipleCharts);
  
  const handleImportCharts = async (charts: ChordChart[]) => {
    for (const chart of charts) {
      await addChart(chart);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isInsideDropdown = (dropdownRef.current?.contains(event.target as Node)) || 
                               (dropdownRef2.current?.contains(event.target as Node));
      
      if (!isInsideDropdown) {
        setShowActionsDropdown(false);
      }
    };

    if (showActionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showActionsDropdown]);
  
  const charts = useMemo(() => 
    Object.values(chartsData).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ), [chartsData]
  );

  const handleCreateChart = async (chartData: ChordChart) => {
    try {
      await createNewChart(chartData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create chart:', error);
      // エラーはストアで管理されているため、ここでは何もしない
    }
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };



  const handleChartSelect = (chartId: string) => {
    setSelectedChartIds(prev => 
      prev.includes(chartId) 
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId]
    );
  };

  const handleSelectAll = () => {
    if (selectedChartIds.length === charts.length) {
      setSelectedChartIds([]);
    } else {
      setSelectedChartIds(charts.map(chart => chart.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedChartIds.length === 0) return;
    
    if (confirm(`選択した${selectedChartIds.length}件のコード譜を削除しますか？`)) {
      try {
        await deleteMultipleCharts(selectedChartIds);
        setSelectedChartIds([]);
      } catch (error) {
        console.error('Failed to delete charts:', error);
      }
    }
  };

  const handleExportSelected = () => {
    if (selectedChartIds.length === 0) return;
    
    const selectedCharts = charts.filter(chart => selectedChartIds.includes(chart.id));
    const dataStr = JSON.stringify(selectedCharts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `selected-charts-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Mobile Score Explorer overlay */}
        {explorerOpen && (
          <div className="fixed inset-0 flex z-40 md:hidden">
            <div className="fixed inset-0 bg-slate-600 bg-opacity-75" onClick={() => setExplorerOpen(false)}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  onClick={() => setExplorerOpen(false)}
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
                        onChange={handleSelectAll}
                        className="text-[#85B0B7] focus:ring-[#85B0B7]"
                        title={selectedChartIds.length === charts.length ? '全て解除' : '全て選択'}
                      />
                      <span className="text-xs text-slate-600">一括選択</span>
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
                                setTimeout(() => handleExportSelected(), 0);
                              }}
                              className="block w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
                            >
                              エクスポート
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowActionsDropdown(false);
                                setTimeout(() => handleDeleteSelected(), 0);
                              }}
                              className="block w-full text-left px-3 py-2 text-xs text-[#EE5840] hover:bg-slate-100"
                            >
                              削除
                            </button>
                          </div>
                        )}
                      </div>
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
                          onChange={() => handleChartSelect(chart.id)}
                          className="mt-3 text-[#85B0B7] focus:ring-[#85B0B7]"
                        />
                        <div 
                          className={`flex-1 p-3 rounded-md transition-colors cursor-pointer ${
                            currentChartId === chart.id 
                              ? 'bg-slate-100 border-[#85B0B7] border' 
                              : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                          onClick={() => {
                            setCurrentChart(chart.id);
                            setExplorerOpen(false);
                          }}
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
                      onClick={() => setShowCreateForm(true)}
                      className="w-full bg-[#85B0B7] hover:bg-[#6B9CA5] text-white px-3 py-2 rounded text-sm font-medium"
                    >
                      新規作成
                    </button>
                    <button 
                      onClick={() => setShowImportDialog(true)}
                      className="w-full bg-[#BDD0CA] hover:bg-[#A4C2B5] text-slate-800 text-white px-3 py-2 rounded text-sm font-medium"
                    >
                      インポート
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Score Explorer */}
        <aside className={`${explorerOpen ? 'block' : 'hidden'} w-80 bg-white shadow-sm border-r border-slate-200 overflow-y-auto`}>
          <div className="p-4">
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
                  onChange={handleSelectAll}
                  className="text-[#85B0B7] focus:ring-[#85B0B7]"
                  title={selectedChartIds.length === charts.length ? '全て解除' : '全て選択'}
                />
                <span className="text-xs text-slate-600">一括選択</span>
                <div className="relative" ref={dropdownRef2}>
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
                          setTimeout(() => handleExportSelected(), 0);
                        }}
                        className="block w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        エクスポート
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowActionsDropdown(false);
                          setTimeout(() => handleDeleteSelected(), 0);
                        }}
                        className="block w-full text-left px-3 py-2 text-xs text-[#EE5840] hover:bg-slate-100"
                      >
                        削除
                      </button>
                    </div>
                  )}
                </div>
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
                    onChange={() => handleChartSelect(chart.id)}
                    className="mt-3 text-[#85B0B7] focus:ring-[#85B0B7]"
                  />
                  <div 
                    className={`flex-1 p-3 rounded-md transition-colors cursor-pointer ${
                      currentChartId === chart.id 
                        ? 'bg-slate-100 border-[#85B0B7] border' 
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                    onClick={() => setCurrentChart(chart.id)}
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
            
            {/* Desktop Actions */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
              <button 
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-[#85B0B7] hover:bg-[#6B9CA5] text-white px-3 py-2 rounded text-sm font-medium"
              >
                新規作成
              </button>
              <button 
                onClick={() => setShowImportDialog(true)}
                className="w-full bg-[#BDD0CA] hover:bg-[#A4C2B5] text-slate-800 px-3 py-2 rounded text-sm font-medium"
              >
                インポート
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {/* 新規作成フォーム */}
      {showCreateForm && (
        <ChordChartForm
          onSave={handleCreateChart}
          onCancel={handleCancelCreate}
        />
      )}

      {/* インポートダイアログ */}
      {showImportDialog && (
        <ImportDialog 
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImportCharts={handleImportCharts}
        />
      )}
    </div>
  );
};

export default MainLayout;