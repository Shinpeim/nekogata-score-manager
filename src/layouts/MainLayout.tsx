import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useChartManagement } from '../hooks/useChartManagement';
import ChordChartForm from '../components/ChordChartForm';
import ImportDialog from '../components/ImportDialog';
import ExportDialog from '../components/ExportDialog';
import Header from './Header';
import Footer from './Footer';
import ScoreExplorer from './ScoreExplorer';
import type { ChordChart } from '../types';

interface MainLayoutProps {
  children: ReactNode;
  explorerOpen?: boolean;
  setExplorerOpen?: (open: boolean) => void;
  onEditChart?: (chartId: string) => void;
  onStartEdit?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, explorerOpen: propExplorerOpen, setExplorerOpen: propSetExplorerOpen, onEditChart, onStartEdit }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [localExplorerOpen, setLocalExplorerOpen] = useState(false);
  
  // Use props if provided, otherwise use local state
  const explorerOpen = propExplorerOpen !== undefined ? propExplorerOpen : localExplorerOpen;
  const setExplorerOpen = propSetExplorerOpen || setLocalExplorerOpen;
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedChartIds, setSelectedChartIds] = useState<string[]>([]);
  
  const {
    charts: chartsData,
    currentChartId,
    setCurrentChart,
    createNewChart,
    loadFromStorage,
    deleteMultipleCharts,
    addChart
  } = useChartManagement();
  
  const handleImportComplete = async () => {
    // Storage-first方式: インポート後にStorageから再読み込み
    await loadFromStorage();
  };

  
  const charts = useMemo(() => 
    Object.values(chartsData).sort((a, b) => 
      a.title.localeCompare(b.title, 'ja')
    ), [chartsData]
  );

  const handleCreateChart = async (chartData: ChordChart) => {
    try {
      await createNewChart(chartData);
      setShowCreateForm(false);
      
      // 新規作成後はサイドバーを閉じる
      setExplorerOpen(false);
      
      // 新規作成後は編集モードに遷移
      if (onStartEdit) {
        onStartEdit();
      }
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
    setShowExportDialog(true);
  };

  const handleDuplicateSelected = async () => {
    if (selectedChartIds.length === 0) return;
    
    try {
      for (const chartId of selectedChartIds) {
        const originalChart = chartsData[chartId];
        if (originalChart) {
          const duplicatedChart = {
            ...originalChart,
            id: `chord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: `${originalChart.title} (コピー)`,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await addChart(duplicatedChart);
        }
      }
      setSelectedChartIds([]);
    } catch (error) {
      console.error('Failed to duplicate charts:', error);
    }
  };

  const handleEditChart = (chartId: string) => {
    setCurrentChart(chartId);
    // 編集開始時はサイドバーを閉じる
    setExplorerOpen(false);
    if (onEditChart) {
      onEditChart(chartId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        explorerOpen={explorerOpen}
        setExplorerOpen={setExplorerOpen}
      />

      <div className="flex-1 relative">
        {/* Main Content Area - 常に表示 */}
        <main className="h-full overflow-hidden">
          {children}
        </main>

        {/* Sidebar Layer - 常に存在、開閉はCSSで制御 */}
        <div className={`fixed inset-0 ${explorerOpen ? '' : 'pointer-events-none'}`}>
          {/* Backdrop - explorerOpenの時のみ表示 */}
          <div 
            className={`absolute inset-0 bg-black bg-opacity-50 md:bg-transparent transition-opacity duration-300 ${
              explorerOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setExplorerOpen(false)}
            data-testid="desktop-overlay"
          />
          
          {/* Sidebar - 常に存在、開閉はtransformで制御 */}
          <aside className={`absolute inset-y-0 left-0 w-80 bg-white shadow-lg border-r border-slate-200 overflow-y-auto transition-transform duration-300 ${
            explorerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <ScoreExplorer
              charts={charts}
              currentChartId={currentChartId}
              selectedChartIds={selectedChartIds}
              onChartSelect={handleChartSelect}
              onSelectAll={handleSelectAll}
              onSetCurrentChart={setCurrentChart}
              onCreateNew={() => setShowCreateForm(true)}
              onImport={() => setShowImportDialog(true)}
              onExportSelected={handleExportSelected}
              onDeleteSelected={handleDeleteSelected}
              onDuplicateSelected={handleDuplicateSelected}
              onEditChart={handleEditChart}
              onClose={() => setExplorerOpen(false)}
            />
          </aside>
        </div>
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
          onImportComplete={handleImportComplete}
        />
      )}

      {/* エクスポートダイアログ */}
      {showExportDialog && (
        <ExportDialog 
          isOpen={showExportDialog}
          onClose={() => {
            setShowExportDialog(false);
            setSelectedChartIds([]);
          }}
          charts={charts.filter(chart => selectedChartIds.includes(chart.id))}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default MainLayout;