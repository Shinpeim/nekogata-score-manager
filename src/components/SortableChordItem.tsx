import React from 'react';
import type { Chord } from '../types';
import { isLineBreakMarker } from '../utils/lineBreakHelpers';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableChordItemProps {
  chord: Chord;
  chordIndex: number;
  sectionId: string;
  itemId: string;
  onUpdateChord: (sectionId: string, chordIndex: number, field: keyof Chord, value: string | number) => void;
  onDeleteChord: (sectionId: string, chordIndex: number) => void;
  onInsertLineBreak: (sectionId: string, chordIndex: number) => void;
  isSelected?: boolean;
  onToggleSelection?: (sectionId: string, chordIndex: number, event?: React.MouseEvent) => void;
}

const SortableChordItem: React.FC<SortableChordItemProps> = ({
  chord,
  chordIndex,
  sectionId,
  itemId,
  isSelected = false,
  onUpdateChord,
  onDeleteChord,
  onInsertLineBreak,
  onToggleSelection,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 border rounded-md ${
        isLineBreakMarker(chord) 
          ? 'border-orange-300 bg-orange-50' 
          : isSelected 
            ? 'border-[#85B0B7] bg-[#85B0B7]/10'
            : 'border-slate-200'
      } ${isDragging ? 'shadow-lg' : ''} ${
        !isLineBreakMarker(chord) ? 'cursor-pointer hover:border-[#85B0B7]/50' : ''
      }`}
      onClick={(e) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) {
          return;
        }
        
        if (!isLineBreakMarker(chord) && onToggleSelection) {
          onToggleSelection(sectionId, chordIndex, e);
        }
      }}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-500">#{chordIndex + 1}</span>
        <div className="flex gap-1">
          <button
            {...attributes}
            {...listeners}
            className="text-slate-400 hover:text-slate-600 text-xs cursor-grab active:cursor-grabbing"
            title="ドラッグして移動"
          >
            ⋮⋮
          </button>
          {isSelected && (
            <span className="text-[#85B0B7] text-xs">
              ✓
            </span>
          )}
          {!isLineBreakMarker(chord) && (
            <button
              onClick={() => onInsertLineBreak(sectionId, chordIndex)}
              className="text-orange-600 hover:text-orange-800 text-xs"
              title="この後に改行を挿入"
            >
              ↵
            </button>
          )}
          <button
            onClick={() => onDeleteChord(sectionId, chordIndex)}
            className="text-[#EE5840] hover:text-[#D14A2E] text-xs"
          >
            ✕
          </button>
        </div>
      </div>
      
      {isLineBreakMarker(chord) ? (
        <div className="text-center py-2">
          <span className="text-orange-600 font-medium text-sm">改行</span>
          <div className="text-xs text-orange-500 mt-1">ここで行が変わります</div>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={chord.name}
            onChange={(e) => onUpdateChord(sectionId, chordIndex, 'name', e.target.value)}
            className="w-full mb-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#85B0B7]"
            placeholder="コード名"
          />
          <input
            type="number"
            value={chord.duration || 4}
            onChange={(e) => onUpdateChord(sectionId, chordIndex, 'duration', parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#85B0B7]"
            placeholder="拍数"
            min="0.5"
            max="16"
            step="0.5"
          />
        </>
      )}
    </div>
  );
};

export default SortableChordItem;