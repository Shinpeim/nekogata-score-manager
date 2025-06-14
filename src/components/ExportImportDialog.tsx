import React, { useState, useRef } from 'react';
import type { ChordChart } from '../types';
import { 
  exportSingleChart, 
  exportMultipleCharts, 
  exportAllCharts, 
  importChartsFromFile,
  type ImportResult 
} from '../utils/exportImport';

interface ExportImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentChart?: ChordChart;
  allCharts: ChordChart[];
  onImportCharts: (charts: ChordChart[]) => void;
}

const ExportImportDialog: React.FC<ExportImportDialogProps> = ({
  isOpen,
  onClose,
  currentChart,
  allCharts,
  onImportCharts
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [selectedCharts, setSelectedCharts] = useState<Set<string>>(new Set());
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportSingle = () => {
    if (currentChart) {
      exportSingleChart(currentChart);
    }
  };

  const handleExportSelected = () => {
    const charts = allCharts.filter(chart => selectedCharts.has(chart.id));
    if (charts.length > 0) {
      exportMultipleCharts(charts);
    }
  };

  const handleExportAll = () => {
    const library = allCharts.reduce((acc, chart) => {
      acc[chart.id] = chart;
      return acc;
    }, {} as Record<string, ChordChart>);
    exportAllCharts(library);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await importChartsFromFile(file);
      setImportResult(result);
      
      if (result.success && result.charts.length > 0) {
        onImportCharts(result.charts);
      }
    } catch (error) {
      setImportResult({
        success: false,
        charts: [],
        errors: [`インポートに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`],
        warnings: []
      });
    } finally {
      setIsImporting(false);
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectAll = () => {
    setSelectedCharts(new Set(allCharts.map(chart => chart.id)));
  };

  const handleSelectNone = () => {
    setSelectedCharts(new Set());
  };

  const toggleChartSelection = (chartId: string) => {
    const newSelection = new Set(selectedCharts);
    if (newSelection.has(chartId)) {
      newSelection.delete(chartId);
    } else {
      newSelection.add(chartId);
    }
    setSelectedCharts(newSelection);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              コード譜のエクスポート・インポート
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* タブ */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'export'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              エクスポート
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'import'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              インポート
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              {/* 現在のコード譜をエクスポート */}
              {currentChart && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">現在のコード譜</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{currentChart.title}</p>
                      <p className="text-sm text-gray-500">{currentChart.artist}</p>
                    </div>
                    <button
                      onClick={handleExportSingle}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      エクスポート
                    </button>
                  </div>
                </div>
              )}

              {/* 選択したコード譜をエクスポート */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">選択したコード譜</h3>
                  <div className="space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      すべて選択
                    </button>
                    <button
                      onClick={handleSelectNone}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      選択解除
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {allCharts.map(chart => (
                    <label key={chart.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCharts.has(chart.id)}
                        onChange={() => toggleChartSelection(chart.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{chart.title}</p>
                        <p className="text-xs text-gray-500">{chart.artist}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleExportSelected}
                    disabled={selectedCharts.size === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    選択した楽譜をエクスポート ({selectedCharts.size}件)
                  </button>
                </div>
              </div>

              {/* すべてのコード譜をエクスポート */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">すべてのコード譜</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    ライブラリ内のすべてのコード譜 ({allCharts.length}件) をエクスポートします
                  </p>
                  <button
                    onClick={handleExportAll}
                    disabled={allCharts.length === 0}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    すべてエクスポート
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ファイル選択 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">JSONファイルからインポート</h3>
                <div className="space-y-4">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      .json形式のコード譜ファイルを選択してください
                    </p>
                  </div>

                  {isImporting && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">インポート中...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* インポート結果 */}
              {importResult && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">インポート結果</h3>
                  
                  {importResult.success ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-green-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">
                          {importResult.charts.length}件のコード譜をインポートしました
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {importResult.charts.map(chart => (
                          <div key={chart.id} className="text-sm text-gray-600">
                            • {chart.title} ({chart.artist})
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-red-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">インポートに失敗しました</span>
                    </div>
                  )}

                  {/* 警告メッセージ */}
                  {importResult.warnings.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">警告</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {importResult.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* エラーメッセージ */}
                  {importResult.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <h4 className="text-sm font-medium text-red-800 mb-1">エラー</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportImportDialog;