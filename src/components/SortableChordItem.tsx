import React, { useState, useEffect } from 'react';
import type { Chord } from '../types';
import { isValidFullChordName, isValidDuration } from '../utils/chordValidation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableChordItemProps {
  chord: Chord;
  chordIndex: number;
  sectionId: string;
  itemId: string;
  onUpdateChord: (sectionId: string, chordIndex: number, field: keyof Chord, value: string | number) => void;
  onFinalizeChordName: (sectionId: string, chordIndex: number, value: string) => void;
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
  onFinalizeChordName,
  onDeleteChord,
  onInsertLineBreak,
  onToggleSelection,
}) => {
  // 入力表示用の状態
  const [displayValue, setDisplayValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [durationDisplayValue, setDurationDisplayValue] = useState('');
  const [isDurationEditing, setIsDurationEditing] = useState(false);
  const [memoDisplayValue, setMemoDisplayValue] = useState('');
  const [isMemoEditing, setIsMemoEditing] = useState(false);

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

  // chordが変更された時に表示値を更新
  useEffect(() => {
    if (!isEditing) {
      const fullChordName = chord.name + (chord.base ? `/${chord.base}` : '');
      setDisplayValue(fullChordName);
    }
  }, [chord.name, chord.base, isEditing]);

  // 拍数が変更された時に表示値を更新
  useEffect(() => {
    if (!isDurationEditing) {
      setDurationDisplayValue(String(chord.duration || 4));
    }
  }, [chord.duration, isDurationEditing]);

  // メモが変更された時に表示値を更新
  useEffect(() => {
    if (!isMemoEditing) {
      setMemoDisplayValue(chord.memo);
    }
  }, [chord.memo, isMemoEditing]);

  const handleInputFocus = () => {
    setIsEditing(true);
    // フォーカス時に完全な表記（オンコード含む）を表示
    const fullChordName = chord.name + (chord.base ? `/${chord.base}` : '');
    setDisplayValue(fullChordName);
  };

  const handleInputChange = (value: string) => {
    setDisplayValue(value);
    // 入力中はパースしない
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    // フォーカスアウト時にパースして確定
    if (displayValue.trim()) {
      onFinalizeChordName(sectionId, chordIndex, displayValue.trim());
    } else {
      // 空文字列の場合は元の値に戻す
      const fullChordName = chord.name + (chord.base ? `/${chord.base}` : '');
      setDisplayValue(fullChordName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Enterキーでフォーカスアウト
    }
  };

  // 拍数入力用のイベントハンドラー
  const handleDurationFocus = () => {
    setIsDurationEditing(true);
    setDurationDisplayValue(String(chord.duration || 4));
  };

  const handleDurationChange = (value: string) => {
    setDurationDisplayValue(value);
    // 入力中はパースしない
  };

  const handleDurationBlur = () => {
    setIsDurationEditing(false);
    // フォーカスアウト時にパースして確定
    const parsedValue = parseFloat(durationDisplayValue);
    if (!isNaN(parsedValue) && parsedValue >= 0.5 && parsedValue <= 16) {
      onUpdateChord(sectionId, chordIndex, 'duration', parsedValue);
    } else {
      // 無効な値の場合は元の値に戻す
      setDurationDisplayValue(String(chord.duration || 4));
    }
  };

  const handleDurationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Enterキーでフォーカスアウト
    }
  };

  // メモ入力用のイベントハンドラー
  const handleMemoFocus = () => {
    setIsMemoEditing(true);
    setMemoDisplayValue(chord.memo);
  };

  const handleMemoChange = (value: string) => {
    setMemoDisplayValue(value);
  };

  const handleMemoBlur = () => {
    setIsMemoEditing(false);
    // フォーカスアウト時に更新
    const trimmedMemo = memoDisplayValue.trim();
    if (trimmedMemo) {
      onUpdateChord(sectionId, chordIndex, 'memo', trimmedMemo);
    } else {
      onUpdateChord(sectionId, chordIndex, 'memo', '');
    }
  };

  const handleMemoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Enterキーでフォーカスアウト
    }
  };

  // バリデーション状態
  const isChordNameValid = isEditing ? isValidFullChordName(displayValue) : true;
  const isDurationValid = isDurationEditing ? isValidDuration(durationDisplayValue) : true;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 border rounded-md ${
        chord.isLineBreak === true 
          ? 'border-orange-300 bg-orange-50' 
          : isSelected 
            ? 'border-[#85B0B7] bg-[#85B0B7]/10'
            : 'border-slate-200'
      } ${isDragging ? 'shadow-lg' : ''} ${
        chord.isLineBreak !== true ? 'cursor-pointer hover:border-[#85B0B7]/50' : ''
      }`}
      data-chord-item={`${sectionId}-${chordIndex}`}
      onClick={(e) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) {
          return;
        }
        
        if (chord.isLineBreak !== true && onToggleSelection) {
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
          {chord.isLineBreak !== true && (
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
            data-testid="delete-chord-button"
          >
            ✕
          </button>
        </div>
      </div>
      
      {chord.isLineBreak === true ? (
        <div className="text-center py-2">
          <span className="text-orange-600 font-medium text-sm">改行</span>
          <div className="text-xs text-orange-500 mt-1">ここで行が変わります</div>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={displayValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className={`w-full mb-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
              isChordNameValid
                ? 'border-slate-300 focus:ring-[#85B0B7] bg-white'
                : 'border-red-300 focus:ring-red-400 bg-red-50'
            }`}
            placeholder="コード名"
          />
          <input
            type="text"
            value={memoDisplayValue}
            onChange={(e) => handleMemoChange(e.target.value)}
            onFocus={handleMemoFocus}
            onBlur={handleMemoBlur}
            onKeyDown={handleMemoKeyDown}
            className="w-full mb-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 border-slate-300 focus:ring-[#85B0B7] bg-slate-50"
            placeholder="メモ（歌詞・演奏記号等）"
          />
          <input
            type="number"
            value={durationDisplayValue}
            onChange={(e) => handleDurationChange(e.target.value)}
            onFocus={handleDurationFocus}
            onBlur={handleDurationBlur}
            onKeyDown={handleDurationKeyDown}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
              isDurationValid
                ? 'border-slate-300 focus:ring-[#85B0B7] bg-white'
                : 'border-red-300 focus:ring-red-400 bg-red-50'
            }`}
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