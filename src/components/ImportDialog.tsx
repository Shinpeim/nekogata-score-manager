import React, { useState } from 'react';
import type { ChordChart } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCharts: (charts: ChordChart[]) => Promise<void>;
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImportCharts
}) => {
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleImport = async () => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      
      // データが配列かオブジェクトかを判定
      let charts: ChordChart[] = [];
      if (Array.isArray(data)) {
        charts = data;
      } else if (data && typeof data === 'object') {
        // オブジェクトの場合は、値が配列なら配列を使用、そうでなければ値のみを配列化
        charts = Object.values(data);
      }

      // インポート時にIDを再生成して衝突を防ぐ
      charts = charts.map(chart => ({
        ...chart,
        id: uuidv4(),
        updatedAt: new Date()
      }));

      if (charts.length === 0) {
        alert('有効なコード譜データが見つかりませんでした。');
        return;
      }

      await onImportCharts(charts);
      setImportFile(null);
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      alert('インポートに失敗しました。JSONファイルの形式を確認してください。');
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
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">インポート</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">楽譜をインポート</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JSONファイルを選択
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  エクスポートされたJSONファイルを選択してください
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleImport}
                  disabled={!importFile}
                  className={`flex-1 px-4 py-2 rounded-md font-medium ${
                    importFile
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  インポート
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium"
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