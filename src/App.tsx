import { useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import ChordChart from './components/ChordChart';
import { useChordChartStore } from './stores/chordChartStore';

function App() {
  const loadInitialData = useChordChartStore(state => state.loadInitialData);
  const isLoading = useChordChartStore(state => state.isLoading);
  const error = useChordChartStore(state => state.error);
  const clearError = useChordChartStore(state => state.clearError);

  useEffect(() => {
    loadInitialData().catch(error => {
      console.error('Failed to load initial data:', error);
    });
  }, [loadInitialData]);

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
    <MainLayout>
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
      <ChordChart />
    </MainLayout>
  );
}

export default App;
