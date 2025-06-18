import React from 'react';

interface EmptyChartPlaceholderProps {
  onCreateNew?: () => void;
  onOpenImport?: () => void;
  onOpenExplorer?: () => void;
}

const EmptyChartPlaceholder: React.FC<EmptyChartPlaceholderProps> = ({ 
  onCreateNew, 
  onOpenImport, 
  onOpenExplorer 
}) => {
  return (
    <div className="h-full bg-white flex items-center justify-center">
      <div className="text-center text-slate-500">
        <h3 className="text-lg font-medium mb-2">コード譜がありません</h3>
        <p className="text-sm mb-6">まずは新しいコード譜を作成するか、既存のファイルをインポートしてみましょう</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={onCreateNew}
            className="bg-[#85B0B7] hover:bg-[#6B9CA5] text-white px-6 py-3 rounded-md text-sm font-medium"
            data-testid="create-new-button"
          >
            新規作成
          </button>
          <button 
            onClick={onOpenImport}
            className="bg-[#BDD0CA] hover:bg-[#A4C2B5] text-slate-800 px-6 py-3 rounded-md text-sm font-medium"
            data-testid="import-button"
          >
            インポート
          </button>
          <button 
            onClick={onOpenExplorer}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-md text-sm font-medium"
            data-testid="open-explorer-button"
          >
            Score Explorerを開く
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmptyChartPlaceholder;