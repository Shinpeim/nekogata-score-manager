import React, { useState } from 'react';
import type { ChordSection, Chord } from '../types';
import { isValidChordProgression } from '../utils/chordCopyPaste';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import SortableChordItem from './SortableChordItem';
import SortableSectionItem from './SortableSectionItem';

interface SectionCardProps {
  section: ChordSection;
  fontSize?: number;
  onSectionChange: (sectionId: string, field: keyof ChordSection, value: string | number) => void;
  onDeleteSection: (sectionId: string) => void;
  onDuplicateSection: (sectionId: string) => void;
  onReplaceChordProgression: (sectionId: string, text: string) => void;
  onChordDragEnd: (event: DragEndEvent) => void;
  onAddChordToSection: (sectionId: string) => void;
  onUpdateChordInSection: (sectionId: string, chordIndex: number, field: keyof Chord, value: string | number) => void;
  onFinalizeChordName: (sectionId: string, chordIndex: number, value: string) => void;
  onDeleteChordFromSection: (sectionId: string, chordIndex: number) => void;
  onInsertLineBreakAfterChord: (sectionId: string, chordIndex: number) => void;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  fontSize = 14,
  onSectionChange,
  onDeleteSection,
  onDuplicateSection,
  onReplaceChordProgression,
  onChordDragEnd,
  onAddChordToSection,
  onUpdateChordInSection,
  onFinalizeChordName,
  onDeleteChordFromSection,
  onInsertLineBreakAfterChord,
}) => {
  const [pasteText, setPasteText] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleReplaceChordProgression = () => {
    if (!pasteText.trim()) return;
    onReplaceChordProgression(section.id, pasteText);
    setPasteText('');
  };


  return (
    <SortableSectionItem id={section.id}>
      <div className="mb-6 p-4 border border-slate-300 rounded-lg" data-section-card={section.id}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
          <input
            type="text"
            value={section.name}
            onChange={(e) => onSectionChange(section.id, 'name', e.target.value)}
            className="text-lg font-medium bg-transparent border-b border-slate-300 focus:outline-none focus:border-[#85B0B7] flex-1 min-w-0"
          />
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onDuplicateSection(section.id)}
              className="bg-[#BDD0CA] hover:bg-[#A4C2B5] text-slate-800 p-2 rounded-md text-sm w-8 h-8 flex items-center justify-center"
              title="このセクションを複製"
            >
              ⧉
            </button>
            <button
              onClick={() => onDeleteSection(section.id)}
              className="bg-[#EE5840] hover:bg-[#D14A2E] text-white p-2 rounded-md text-sm w-8 h-8 flex items-center justify-center"
              title="このセクションを削除"
            >
              ×
            </button>
          </div>
        </div>

        <div className="mb-3 space-y-2">
          <details className="text-sm">
            <summary className="cursor-pointer text-slate-600 hover:text-slate-800">
              テキストから一括入力
            </summary>
            <div className="mt-2 p-3 bg-slate-50 rounded-md">
              <p className="text-xs text-slate-500 mb-2">
                例: "C F G Am" または "C[4] F[2] G[2] | Am[4]" 
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="C F G Am"
                  className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#85B0B7]"
                />
                <button
                  onClick={handleReplaceChordProgression}
                  disabled={!pasteText.trim() || !isValidChordProgression(pasteText)}
                  className="bg-[#BDD0CA] hover:bg-[#A4C2B5] disabled:bg-slate-300 disabled:cursor-not-allowed text-slate-800 disabled:text-slate-500 px-3 py-1 rounded-md text-xs font-medium"
                >
                  置換
                </button>
              </div>
            </div>
          </details>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onChordDragEnd}
        >
          <SortableContext
            items={section.chords.map((_, index) => `${section.id}-${index}`)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {section.chords.map((chord, chordIndex) => {
                const itemId = `${section.id}-${chordIndex}`;
                return (
                  <SortableChordItem
                    key={chord.id}
                    chord={chord}
                    chordIndex={chordIndex}
                    sectionId={section.id}
                    itemId={itemId}
                    fontSize={fontSize}
                    onUpdateChord={onUpdateChordInSection}
                    onFinalizeChordName={onFinalizeChordName}
                    onDeleteChord={onDeleteChordFromSection}
                    onInsertLineBreak={onInsertLineBreakAfterChord}
                  />
                );
              })}
              <div className="flex items-center justify-center p-2 border border-dashed border-slate-300 rounded-md hover:border-[#85B0B7] transition-colors">
                <button
                  onClick={() => onAddChordToSection(section.id)}
                  className="w-full h-full flex flex-col items-center justify-center gap-1 text-[#85B0B7] hover:text-[#6B9CA5] transition-colors"
                  data-testid="add-chord-button"
                >
                  <span className="text-2xl">+</span>
                  <span className="text-xs font-medium">コード追加</span>
                </button>
              </div>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </SortableSectionItem>
  );
};

export default SectionCard;