import React from 'react';
import type { ChordChart as ChordChartType } from '../types';
import { useChordChartStore } from '../hooks/useChartManagement';

interface ChordChartActionsProps {
  chart: ChordChartType;
  currentChartId: string | null;
  onEdit: () => void;
}

const ChordChartActions: React.FC<ChordChartActionsProps> = ({ chart, currentChartId, onEdit }) => {
  const { deleteChart, addChart } = useChordChartStore();

  const handleDelete = async () => {
    if (currentChartId && confirm('このコード譜を削除しますか？')) {
      try {
        await deleteChart(currentChartId);
      } catch (error) {
        console.error('Failed to delete chart:', error);
      }
    }
  };

  const handleDuplicate = async () => {
    try {
      const duplicatedChart = {
        ...chart,
        id: `chord-${Date.now()}`,
        title: `${chart.title} (コピー)`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await addChart(duplicatedChart);
    } catch (error) {
      console.error('Failed to duplicate chart:', error);
    }
  };

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button 
        onClick={onEdit}
        className="bg-[#85B0B7] hover:bg-[#6B9CA5] text-white px-4 py-2 rounded-md text-sm font-medium"
      >
        編集
      </button>
      <button 
        onClick={handleDuplicate}
        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium"
      >
        複製
      </button>
      <button 
        onClick={handleDelete}
        className="bg-[#EE5840] hover:bg-[#D14A2E] text-white px-4 py-2 rounded-md text-sm font-medium"
      >
        削除
      </button>
    </div>
  );
};

export default ChordChartActions;