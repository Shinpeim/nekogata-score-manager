import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useChordChartStore } from '../stores/chordChartStore';
import ChordChartForm from '../components/ChordChartForm';
import type { ChordChart } from '../types';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const chartsData = useChordChartStore(state => state.charts);
  const currentChartId = useChordChartStore(state => state.currentChartId);
  const setCurrentChart = useChordChartStore(state => state.setCurrentChart);
  const createNewChart = useChordChartStore(state => state.createNewChart);
  
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
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 hover:text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mr-3 shadow-sm transition-all duration-150"
                aria-label="サイドバーを開く"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h6v12H4V6zM14 6h6v12h-6V6z" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Nekogata Score Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                新規作成
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 flex z-40 md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <span className="sr-only">サイドバーを閉じる</span>
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="px-4">
                  <h2 className="text-sm font-medium text-gray-900 mb-3">コード譜一覧</h2>
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
                          setSidebarOpen(false);
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} w-64 bg-white shadow-sm border-r border-gray-200 overflow-y-auto`}>
          <div className="p-4">
            <h2 className="text-sm font-medium text-gray-900 mb-3">コード譜一覧</h2>
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
    </div>
  );
};

export default MainLayout;