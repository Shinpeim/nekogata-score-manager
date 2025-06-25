import React, { useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSetListManagement } from '../hooks/useSetListManagement';
import { useChartDataStore } from '../stores/chartDataStore';
import SetListSelector from './SetListSelector';
import SetListChartItem from './SetListChartItem';

interface SetListTabProps {
  onChartSelect: (chartId: string) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const SetListTab: React.FC<SetListTabProps> = ({
  onChartSelect,
  isMobile = false,
  onClose,
}) => {
  const { setLists, currentSetListId, updateSetListOrder } = useSetListManagement();
  const { charts } = useChartDataStore();
  const isDraggingRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const currentSetList = currentSetListId ? setLists[currentSetListId] : null;

  const handleChartClick = (chartId: string) => {
    onChartSelect(chartId);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const getChartById = (chartId: string) => charts[chartId];

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    isDraggingRef.current = false;

    if (!currentSetList || !over || active.id === over.id) {
      return;
    }

    const oldIndex = currentSetList.chartIds.indexOf(active.id as string);
    const newIndex = currentSetList.chartIds.indexOf(over.id as string);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newChartIds = arrayMove(currentSetList.chartIds, oldIndex, newIndex);
      
      // 楽観的更新（即座にUI更新、バックグラウンドで永続化）
      updateSetListOrder(currentSetList.id, newChartIds);
    }
  };

  return (
    <div className={isMobile ? "px-4" : "p-4"}>
      <div className="mb-4">
        <SetListSelector />
      </div>

      {currentSetList ? (
        <div className="space-y-2">
          <div className="text-xs text-slate-500 mb-3">
            {currentSetList.chartIds.length}曲
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={currentSetList.chartIds}
              strategy={verticalListSortingStrategy}
            >
              {currentSetList.chartIds.map((chartId, index) => {
                const chart = getChartById(chartId);
                return (
                  <SetListChartItem
                    key={chartId}
                    index={index}
                    chart={chart}
                    chartId={chartId}
                    onChartClick={handleChartClick}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-sm text-slate-500">
            セットリストを選択してください
          </div>
        </div>
      )}
    </div>
  );
};

export default SetListTab;