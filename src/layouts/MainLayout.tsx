import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useChordChartStore } from '../stores/chordChartStore';
import ChordChartForm from '../components/ChordChartForm';
import type { ChordChart } from '../types';

interface MainLayoutProps {
  children: ReactNode;
  onCreateNewChart?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, onCreateNewChart }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  
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
              <h1 className="text-xl font-semibold text-gray-900">Chord Chart</h1>
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
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <aside className="hidden md:block w-64 bg-white shadow-sm border-r border-gray-200 overflow-y-auto">
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