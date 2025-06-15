import React, { useState } from 'react';
import { importChartsToStorage } from '../utils/importFunctions';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => Promise<void>;
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    try {
      // Storage-first方式でインポート
      const result = await importChartsToStorage(importFile);
      
      if (result.success) {
        alert(`${result.importedCount}件のコード譜をインポートしました。`);
        
        // Storeに再読み込みを指示
        await onImportComplete();
        
        setImportFile(null);
        onClose();
      } else {
        alert(`インポートに失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('インポートに失敗しました。JSONファイルの形式を確認してください。');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setImportFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-900">インポート</h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">楽譜をインポート</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  JSONファイルを選択
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  エクスポートされたJSONファイルを選択してください
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleImport}
                  disabled={!importFile || isImporting}
                  className={`flex-1 px-4 py-2 rounded-md font-medium ${
                    importFile && !isImporting
                      ? 'bg-[#BDD0CA] hover:bg-[#A4C2B5] text-slate-800'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isImporting ? 'インポート中...' : 'インポート'}
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-medium"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportDialog;