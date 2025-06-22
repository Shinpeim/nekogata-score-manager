import React from 'react';
import type { ChordChart as ChordChartType } from '../types';

interface ChordChartActionsProps {
  chart: ChordChartType;
  currentChartId: string | null;
  onEdit: () => void;
}

const ChordChartActions: React.FC<ChordChartActionsProps> = ({ onEdit }) => {
  return (
    <div className="mt-6 flex flex-wrap gap-3" data-testid="chart-actions">
      <button 
        onClick={onEdit}
        className="bg-[#85B0B7] hover:bg-[#6B9CA5] text-white px-4 py-2 rounded-md text-sm font-medium"
        data-testid="edit-button"
      >
        編集
      </button>
    </div>
  );
};

export default ChordChartActions;