import { useEffect, useState } from 'react';
import MainLayout from './layouts/MainLayout';
import ChordChart from './components/ChordChart';
import ChordChartForm from './components/ChordChartForm';
import ImportDialog from './components/ImportDialog';
import { useChartManagement } from './hooks/useChartManagement';
import { useChartSync } from './hooks/useChartSync';
import type { ChordChart as ChordChartType } from './types';

function App() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);
  
  const {
    loadInitialData,
    loadFromStorage,
    isLoading,
    error,
    clearError,
    createNewChart
  } = useChartManagement();

  // 同期機能を有効化（自動的に初期化される）
  useChartSync();

  useEffect(() => {
    loadInitialData().catch(error => {
      console.error('Failed to load initial data:', error);
    });
  }, [loadInitialData]);

  const handleCreateChart = async (chartData: ChordChartType) => {
    try {
      await createNewChart(chartData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create chart:', error);
    }
  };

  const handleImportComplete = async () => {
    // Storage-first方式: インポート後にStorageから再読み込み
    await loadFromStorage();
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
  };

  const handleShowImportDialog = () => {
    setShowImportDialog(true);
  };

  const handleOpenExplorer = () => {
    setExplorerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MainLayout explorerOpen={explorerOpen} setExplorerOpen={setExplorerOpen}>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={clearError}
                    className="bg-red-100 px-2 py-1 text-sm font-medium text-red-800 rounded-md hover:bg-red-200"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <ChordChart 
          onCreateNew={handleShowCreateForm}
          onOpenImport={handleShowImportDialog}
          onOpenExplorer={handleOpenExplorer}
        />
      </MainLayout>

      {showCreateForm && (
        <ChordChartForm
          onSave={handleCreateChart}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {showImportDialog && (
        <ImportDialog 
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImportComplete={handleImportComplete}
        />
      )}
    </>
  );
}

export default App;
