import React from 'react';
import type { ChordChart } from '../types';
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
import SectionCard from './SectionCard';
import { useSectionOperations } from '../hooks/useSectionOperations';
import { useChordOperations } from '../hooks/useChordOperations';

interface SectionEditorProps {
  chart: ChordChart;
  onUpdateChart: (chart: ChordChart) => void;
  selectedChords: Set<string>;
  setSelectedChords: (chords: Set<string>) => void;
  lastSelectedChord: string | null;
  setLastSelectedChord: (chord: string | null) => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  chart,
  onUpdateChart,
  selectedChords,
  setSelectedChords,
  lastSelectedChord,
  setLastSelectedChord,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sectionOperations = useSectionOperations({
    chart,
    onUpdateChart,
    selectedChords,
    setSelectedChords,
    setLastSelectedChord,
  });

  const chordOperations = useChordOperations({
    chart,
    onUpdateChart,
    selectedChords,
    setSelectedChords,
    lastSelectedChord,
    setLastSelectedChord,
  });

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = chart.sections?.findIndex(section => section.id === active.id) ?? -1;
      const newIndex = chart.sections?.findIndex(section => section.id === over.id) ?? -1;

      if (oldIndex !== -1 && newIndex !== -1) {
        const updatedChart = {
          ...chart,
          sections: arrayMove(chart.sections || [], oldIndex, newIndex)
        };
        onUpdateChart(updatedChart);
      }
    }
  };

  const handleChordDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const activeId = active.id.toString();
      const overId = over?.id.toString();
      
      if (!overId) return;

      const activeLastDashIndex = activeId.lastIndexOf('-');
      const activeSectionId = activeId.substring(0, activeLastDashIndex);
      const activeChordIndexStr = activeId.substring(activeLastDashIndex + 1);
      
      const overLastDashIndex = overId.lastIndexOf('-');
      const overSectionId = overId.substring(0, overLastDashIndex);
      const overChordIndexStr = overId.substring(overLastDashIndex + 1);
      
      const activeChordIndex = parseInt(activeChordIndexStr);
      const overChordIndex = parseInt(overChordIndexStr);

      if (activeSectionId === overSectionId) {
        const updatedChart = {
          ...chart,
          sections: chart.sections?.map(section =>
            section.id === activeSectionId
              ? {
                  ...section,
                  chords: arrayMove(section.chords, activeChordIndex, overChordIndex)
                }
              : section
          ) || []
        };
        onUpdateChart(updatedChart);
      }
    }
  };


  return (
    <div className="mb-8">
      {sectionOperations.copiedMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm">
          {sectionOperations.copiedMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">セクション</h3>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectionDragEnd}
      >
        <SortableContext
          items={chart.sections?.map(section => section.id) || []}
          strategy={verticalListSortingStrategy}
        >
          {chart.sections?.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              selectedChords={selectedChords}
              onSectionChange={sectionOperations.handleSectionChange}
              onDeleteSection={sectionOperations.deleteSection}
              onDuplicateSection={sectionOperations.duplicateSection}
              onCopyChordProgression={sectionOperations.copyChordProgression}
              onPasteChordProgression={sectionOperations.pasteChordProgression}
              onReplaceChordProgression={sectionOperations.replaceChordProgression}
              onToggleSelectAllInSection={sectionOperations.toggleSelectAllInSection}
              onChordDragEnd={handleChordDragEnd}
              onAddChordToSection={chordOperations.addChordToSection}
              onUpdateChordInSection={chordOperations.updateChordInSection}
              onFinalizeChordName={chordOperations.finalizeChordName}
              onDeleteChordFromSection={chordOperations.deleteChordFromSection}
              onInsertLineBreakAfterChord={chordOperations.insertLineBreakAfterChord}
              onToggleChordSelection={chordOperations.toggleChordSelection}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      <div className="mt-6 flex justify-center">
        <button
          onClick={sectionOperations.addSection}
          className="flex items-center gap-2 bg-[#BDD0CA] hover:bg-[#A4C2B5] text-slate-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <span className="text-lg">+</span>
          <span>セクション追加</span>
        </button>
      </div>
    </div>
  );
};

export default SectionEditor;