import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useChordChartStore } from '../stores/chordChartStore';
import ChordChartForm from '../components/ChordChartForm';
import ImportDialog from '../components/ImportDialog';
import ExportDialog from '../components/ExportDialog';
import Header from './Header';
import ScoreExplorer from './ScoreExplorer';
import MobileScoreExplorer from './MobileScoreExplorer';
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
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedChartIds, setSelectedChartIds] = useState<string[]>([]);
  
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
    setShowExportDialog(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        explorerOpen={explorerOpen}
        setExplorerOpen={setExplorerOpen}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Mobile Score Explorer overlay */}
        {explorerOpen && (
          <MobileScoreExplorer
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
            onClose={() => setExplorerOpen(false)}
          />
        )}

        {/* Desktop Score Explorer */}
        <aside className={`${explorerOpen ? 'block' : 'hidden'} w-80 bg-white shadow-sm border-r border-slate-200 overflow-y-auto`}>
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
          />
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
    </div>
  );
};

export default MainLayout;