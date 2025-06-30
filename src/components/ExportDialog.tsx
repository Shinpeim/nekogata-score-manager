import React, { useState, useEffect } from 'react';
import type { ChordChart } from '../types';
import { exportMultipleCharts } from '../utils/export';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  charts: ChordChart[];
  defaultFilename?: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  charts,
  defaultFilename
}) => {
  const [filename, setFilename] = useState('');

  useEffect(() => {
    if (isOpen) {
      // デフォルトファイル名を設定
      if (defaultFilename) {
        setFilename(defaultFilename);
      } else if (charts.length === 1) {
        // 単一チャートの場合はタイトルを使用
        const sanitizedTitle = charts[0].title
          .replace(/[<>:"/\\|?*]/g, '-')
          .replace(/\s+/g, '_')
          .toLowerCase();
        setFilename(sanitizedTitle);
      } else {
        // 複数チャートの場合は日付を含める
        const today = new Date().toISOString().split('T')[0];
        setFilename(`selected-charts-${today}`);
      }
    }
  }, [isOpen, charts, defaultFilename]);

  const handleExport = () => {
    if (!filename.trim()) return;

    // .jsonを自動で付与（すでにある場合は重複させない）
    const finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;

    exportMultipleCharts(charts, finalFilename);
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleExport();
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            コード譜をエクスポート
          </h3>
          
          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-2">
              {charts.length === 1 
                ? `「${charts[0].title}」をエクスポートします`
                : `${charts.length}件のコード譜をエクスポートします`
              }
            </p>
            
            <label htmlFor="filename" className="block text-sm font-medium text-slate-700 mb-2">
              ファイル名
            </label>
            <div className="relative">
              <input
                id="filename"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85B0B7] focus:border-[#85B0B7]"
                placeholder="ファイル名を入力してください"
                autoFocus
              />
              <span className="absolute right-3 top-2 text-sm text-slate-400">.json</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              .json拡張子は自動で付与されます
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleExport}
              disabled={!filename.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#85B0B7] hover:bg-[#6B9CA5] disabled:bg-slate-300 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              エクスポート
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;