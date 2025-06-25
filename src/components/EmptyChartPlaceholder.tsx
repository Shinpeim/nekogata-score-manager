import React from 'react';

interface EmptyChartPlaceholderProps {
  onOpenExplorer?: () => void;
}

const EmptyChartPlaceholder: React.FC<EmptyChartPlaceholderProps> = ({ 
  onOpenExplorer 
}) => {
  return (
    <div className="h-full bg-white flex items-center justify-center">
      <div className="text-center text-slate-500">
        <h3 className="text-lg font-medium mb-2">コード譜がありません</h3>
        <p className="text-sm mb-6">Score Explorerを開いて、新しいコード譜を作成したり既存のファイルをインポートしてみましょう</p>
        <button 
          onClick={onOpenExplorer}
          className="bg-[#85B0B7] hover:bg-[#6B9CA5] text-white px-6 py-3 rounded-md text-sm font-medium"
          data-testid="open-explorer-button"
        >
          Score Explorerを開く
        </button>
      </div>
    </div>
  );
};

export default EmptyChartPlaceholder;