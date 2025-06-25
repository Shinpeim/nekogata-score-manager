import React, { useState } from 'react';
import type { ChordChart as ChordChartType } from '../types';
import { useChartManagement } from '../hooks/useChartManagement';
import ChordChartEditor from './ChordChartEditor';
import ChordChartViewer from './ChordChartViewer';
import EmptyChartPlaceholder from './EmptyChartPlaceholder';

interface ChordChartProps {
  chartData?: ChordChartType;
  onOpenExplorer?: () => void;
  isEditing?: boolean;
  onEditingComplete?: () => void;
}

const ChordChart: React.FC<ChordChartProps> = ({ chartData, onOpenExplorer, isEditing: propIsEditing, onEditingComplete }) => {
  const [localIsEditing, setLocalIsEditing] = useState(false);
  const { charts, currentChartId, updateChart } = useChartManagement();
  
  const isEditing = propIsEditing !== undefined ? propIsEditing : localIsEditing;
  
  const currentChart = currentChartId ? charts[currentChartId] : null;
  const displayChart = chartData || currentChart;

  const handleSave = async (updatedChart: ChordChartType) => {
    try {
      if (currentChartId) {
        await updateChart(currentChartId, updatedChart);
      }
      setLocalIsEditing(false);
      if (onEditingComplete) {
        onEditingComplete();
      }
    } catch (error) {
      console.error('Failed to save chart:', error);
    }
  };

  const handleCancel = () => {
    setLocalIsEditing(false);
    if (onEditingComplete) {
      onEditingComplete();
    }
  };

  if (!displayChart) {
    return (
      <EmptyChartPlaceholder 
        onOpenExplorer={onOpenExplorer}
      />
    );
  }

  if (isEditing) {
    return (
      <ChordChartEditor
        chart={displayChart}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }
  return (
    <ChordChartViewer 
      chart={displayChart} 
      currentChartId={currentChartId} 
      onEdit={() => setLocalIsEditing(true)} 
    />
  );
};

export default ChordChart;