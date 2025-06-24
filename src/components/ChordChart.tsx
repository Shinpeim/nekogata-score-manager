import React, { useState } from 'react';
import type { ChordChart as ChordChartType } from '../types';
import { useChartManagement } from '../hooks/useChartManagement';
import ChordChartEditor from './ChordChartEditor';
import ChordChartForm from './ChordChartForm';
import ChordChartViewer from './ChordChartViewer';
import EmptyChartPlaceholder from './EmptyChartPlaceholder';

interface ChordChartProps {
  chartData?: ChordChartType;
  onCreateNew?: () => void;
  onOpenImport?: () => void;
  onOpenExplorer?: () => void;
  isEditing?: boolean;
  onEditingComplete?: () => void;
}

const ChordChart: React.FC<ChordChartProps> = ({ chartData, onCreateNew, onOpenImport, onOpenExplorer, isEditing: propIsEditing, onEditingComplete }) => {
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
        onCreateNew={onCreateNew}
        onOpenImport={onOpenImport}
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

// 新規作成フォームの追加（ChordChartコンポーネントの外で）
const ChordChartWithForm: React.FC<ChordChartProps> = (props) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { createNewChart } = useChartManagement();

  const handleCreateNew = () => {
    if (props.onCreateNew) {
      props.onCreateNew();
    } else {
      setShowCreateForm(true);
    }
  };

  const handleCreateChart = async (chartData: ChordChartType) => {
    try {
      await createNewChart(chartData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create chart:', error);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  return (
    <>
      <ChordChart 
        {...props} 
        onCreateNew={handleCreateNew}
        onOpenImport={props.onOpenImport}
        onOpenExplorer={props.onOpenExplorer}
      />
      {showCreateForm && (
        <ChordChartForm
          onSave={handleCreateChart}
          onCancel={handleCancelCreate}
        />
      )}
    </>
  );
};

export default ChordChartWithForm;