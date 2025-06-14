import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useChordChartStore } from '../stores/chordChartStore';
import ChordChartForm from '../components/ChordChartForm';
import ExportImportDialog from '../components/ExportImportDialog';
import type { ChordChart } from '../types';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [showExportImportDialog, setShowExportImportDialog] = useState(false);
  
  const chartsData = useChordChartStore(state => state.charts);
  const currentChartId = useChordChartStore(state => state.currentChartId);
  const setCurrentChart = useChordChartStore(state => state.setCurrentChart);
  const createNewChart = useChordChartStore(state => state.createNewChart);
  const addChart = useChordChartStore(state => state.addChart);
  
  const handleImportCharts = async (charts: ChordChart[]) => {
    for (const chart of charts) {
      await addChart(chart);
    }
  };
  
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setExplorerOpen(!explorerOpen)}
                className="px-3 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 hover:text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mr-3 shadow-sm transition-all duration-150 text-sm font-medium"
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
              <h1 className="text-xl font-semibold text-gray-900">Nekogata Score Manager</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Mobile Score Explorer overlay */}
        {explorerOpen && (
          <div className="fixed inset-0 flex z-40 md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setExplorerOpen(false)}></div>
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
                    <h2 className="text-sm font-medium text-gray-900">Score Explorer</h2>
                    <button 
                      onClick={() => setShowCreateForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium"
                      title="新規作成"
                    >
                      +
                    </button>
                  </div>
                  <div className="space-y-2">
                    {charts.map((chart) => (
                      <div 
                        key={chart.id} 
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          currentChartId === chart.id 
                            ? 'bg-blue-50 border-blue-200 border' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          setCurrentChart(chart.id);
                          setExplorerOpen(false);
                        }}
                      >
                        <h3 className="text-sm font-medium text-gray-900">{chart.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{chart.artist}</p>
                        {chart.tags && chart.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {chart.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Mobile Import/Export Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => setShowExportImportDialog(true)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium"
                    >
                      インポート・エクスポート
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Score Explorer */}
        <aside className={`${explorerOpen ? 'block' : 'hidden'} w-64 bg-white shadow-sm border-r border-gray-200 overflow-y-auto`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-900">Score Explorer</h2>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium"
                title="新規作成"
              >
                +
              </button>
            </div>
            <div className="space-y-2">
              {charts.map((chart) => (
                <div 
                  key={chart.id} 
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    currentChartId === chart.id 
                      ? 'bg-blue-50 border-blue-200 border' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setCurrentChart(chart.id)}
                >
                  <h3 className="text-sm font-medium text-gray-900">{chart.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{chart.artist}</p>
                  {chart.tags && chart.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {chart.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Desktop Import/Export Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button 
                onClick={() => setShowExportImportDialog(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium"
              >
                インポート・エクスポート
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

      {/* インポート・エクスポートダイアログ */}
      {showExportImportDialog && (
        <ExportImportDialog 
          isOpen={showExportImportDialog}
          onClose={() => setShowExportImportDialog(false)}
          allCharts={charts}
          onImportCharts={handleImportCharts}
        />
      )}
    </div>
  );
};

export default MainLayout;