import React, { useState } from 'react';
import type { ChordChart, ChordSection, Chord } from '../types';
import { createLineBreakMarker, isLineBreakMarker } from '../utils/lineBreakHelpers';
import { 
  textToChords, 
  copyChordProgressionToClipboard, 
  pasteChordProgressionFromClipboard,
  isValidChordProgression 
} from '../utils/chordCopyPaste';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ChordChartEditorProps {
  chart: ChordChart;
  onSave: (chart: ChordChart) => void;
  onCancel: () => void;
}

interface SortableChordItemProps {
  chord: Chord;
  chordIndex: number;
  sectionId: string;
  itemId: string;
  onUpdateChord: (sectionId: string, chordIndex: number, field: keyof Chord, value: string | number) => void;
  onDeleteChord: (sectionId: string, chordIndex: number) => void;
  onInsertLineBreak: (sectionId: string, chordIndex: number) => void;
  isSelected?: boolean;
  onToggleSelection?: (sectionId: string, chordIndex: number) => void;
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
        // 入力フィールドやボタンをクリックした場合は選択を実行しない
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) {
          return;
        }
        
        if (!isLineBreakMarker(chord) && onToggleSelection) {
          onToggleSelection(sectionId, chordIndex);
        }
      }}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-500">#{chordIndex + 1}</span>
        <div className="flex gap-1">
          {/* ドラッグハンドル */}
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

const ChordChartEditor: React.FC<ChordChartEditorProps> = ({ chart, onSave, onCancel }) => {
  const [editedChart, setEditedChart] = useState<ChordChart>({ ...chart });
  const [copiedMessage, setCopiedMessage] = useState<string>('');
  const [pasteText, setPasteText] = useState<string>('');
  const [selectedChords, setSelectedChords] = useState<Set<string>>(new Set());
  
  // ドラッグ&ドロップセンサー
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ドラッグエンドハンドラー
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // activeとoverのIDからsectionIdとchordIndexを抽出
      const activeId = active.id.toString();
      const overId = over?.id.toString();
      
      if (!overId) return;

      // IDの最後の部分がchordIndex、それより前がsectionId
      const activeLastDashIndex = activeId.lastIndexOf('-');
      const activeSectionId = activeId.substring(0, activeLastDashIndex);
      const activeChordIndexStr = activeId.substring(activeLastDashIndex + 1);
      
      const overLastDashIndex = overId.lastIndexOf('-');
      const overSectionId = overId.substring(0, overLastDashIndex);
      const overChordIndexStr = overId.substring(overLastDashIndex + 1);
      
      const activeChordIndex = parseInt(activeChordIndexStr);
      const overChordIndex = parseInt(overChordIndexStr);

      // 同じセクション内でのみドラッグ&ドロップを許可
      if (activeSectionId === overSectionId) {
        setEditedChart(prev => ({
          ...prev,
          sections: prev.sections?.map(section =>
            section.id === activeSectionId
              ? {
                  ...section,
                  chords: arrayMove(section.chords, activeChordIndex, overChordIndex)
                }
              : section
          ) || []
        }));
      }
    }
  };
  
  const handleBasicInfoChange = (field: keyof ChordChart, value: string | number | undefined) => {
    setEditedChart(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // 拍子が変更された場合、全セクションのbeatsPerBarを更新
      if (field === 'timeSignature' && typeof value === 'string') {
        const beatsPerBar = parseInt(value.split('/')[0]);
        updated.sections = prev.sections?.map(section => ({
          ...section,
          beatsPerBar
        })) || [];
      }
      
      return updated;
    });
  };

  const handleSectionChange = (sectionId: string, field: keyof ChordSection, value: string | number) => {
    setEditedChart(prev => ({
      ...prev,
      sections: prev.sections?.map(section =>
        section.id === sectionId
          ? { ...section, [field]: value }
          : section
      ) || []
    }));
  };

  const addSection = () => {
    const beatsPerBar = editedChart.timeSignature ? parseInt(editedChart.timeSignature.split('/')[0]) : 4;
    const newSection: ChordSection = {
      id: `section-${Date.now()}`,
      name: '新しいセクション',
      beatsPerBar,
      barsCount: 4,
      chords: []
    };
    
    setEditedChart(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection]
    }));
  };

  const deleteSection = (sectionId: string) => {
    setEditedChart(prev => ({
      ...prev,
      sections: prev.sections?.filter(section => section.id !== sectionId) || []
    }));
  };

  const addChordToSection = (sectionId: string) => {
    const newChord: Chord = {
      name: 'C',
      root: 'C',
      duration: 4
    };
    
    setEditedChart(prev => ({
      ...prev,
      sections: prev.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: [...section.chords, newChord]
            }
          : section
      ) || []
    }));
  };

  const updateChordInSection = (sectionId: string, chordIndex: number, field: keyof Chord, value: string | number) => {
    setEditedChart(prev => ({
      ...prev,
      sections: prev.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: section.chords.map((chord, index) =>
                index === chordIndex
                  ? { ...chord, [field]: value }
                  : chord
              )
            }
          : section
      ) || []
    }));
  };

  const deleteChordFromSection = (sectionId: string, chordIndex: number) => {
    setEditedChart(prev => ({
      ...prev,
      sections: prev.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: section.chords.filter((_, index) => index !== chordIndex)
            }
          : section
      ) || []
    }));
  };

  const insertLineBreakAfterChord = (sectionId: string, chordIndex: number) => {
    const lineBreak = createLineBreakMarker();
    
    setEditedChart(prev => ({
      ...prev,
      sections: prev.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: [
                ...section.chords.slice(0, chordIndex + 1),
                lineBreak,
                ...section.chords.slice(chordIndex + 1)
              ]
            }
          : section
      ) || []
    }));
  };

  // コピペ機能
  const copyChordProgression = async (sectionId: string) => {
    const section = editedChart.sections?.find(s => s.id === sectionId);
    if (!section || section.chords.length === 0) return;

    const success = await copyChordProgressionToClipboard(section.chords);
    if (success) {
      setCopiedMessage(`「${section.name}」のコード進行をコピーしました`);
      setTimeout(() => setCopiedMessage(''), 3000);
    }
  };

  const pasteChordProgression = async (sectionId: string) => {
    const chords = await pasteChordProgressionFromClipboard();
    if (!chords || chords.length === 0) return;

    setEditedChart(prev => ({
      ...prev,
      sections: prev.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: [...section.chords, ...chords]
            }
          : section
      ) || []
    }));
  };

  const replaceChordProgression = (sectionId: string) => {
    if (!pasteText.trim()) return;
    
    const chords = textToChords(pasteText);
    if (chords.length === 0) return;

    setEditedChart(prev => ({
      ...prev,
      sections: prev.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: chords
            }
          : section
      ) || []
    }));

    setPasteText('');
  };

  // 選択機能
  const toggleChordSelection = (sectionId: string, chordIndex: number) => {
    const chordId = `${sectionId}-${chordIndex}`;
    const newSelected = new Set(selectedChords);
    
    if (newSelected.has(chordId)) {
      newSelected.delete(chordId);
    } else {
      newSelected.add(chordId);
    }
    
    setSelectedChords(newSelected);
  };

  const selectAllInSection = (sectionId: string) => {
    const section = editedChart.sections?.find(s => s.id === sectionId);
    if (!section) return;

    const newSelected = new Set(selectedChords);
    for (let i = 0; i < section.chords.length; i++) {
      newSelected.add(`${sectionId}-${i}`);
    }
    setSelectedChords(newSelected);
  };

  const clearAllSelectionInSection = (sectionId: string) => {
    const section = editedChart.sections?.find(s => s.id === sectionId);
    if (!section) return;

    const newSelected = new Set(selectedChords);
    for (let i = 0; i < section.chords.length; i++) {
      newSelected.delete(`${sectionId}-${i}`);
    }
    setSelectedChords(newSelected);
  };

  const handleSave = () => {
    onSave({
      ...editedChart,
      updatedAt: new Date()
    });
  };

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">コード譜を編集</h2>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="bg-[#85B0B7] hover:bg-[#6B9CA5] text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              保存
            </button>
          </div>
        </div>


        {/* コピー完了メッセージ */}
        {copiedMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm">
            {copiedMessage}
          </div>
        )}

        {/* Basic Information */}
        <div className="mb-8 p-4 bg-slate-50 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">基本情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title-input" className="block text-sm font-medium text-slate-700 mb-1">
                タイトル
              </label>
              <input
                id="title-input"
                type="text"
                value={editedChart.title}
                onChange={(e) => handleBasicInfoChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85B0B7]"
              />
            </div>
            <div>
              <label htmlFor="artist-input" className="block text-sm font-medium text-slate-700 mb-1">
                アーティスト
              </label>
              <input
                id="artist-input"
                type="text"
                value={editedChart.artist}
                onChange={(e) => handleBasicInfoChange('artist', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85B0B7]"
              />
            </div>
            <div>
              <label htmlFor="key-select" className="block text-sm font-medium text-slate-700 mb-1">
                キー
              </label>
              <select
                id="key-select"
                value={editedChart.key}
                onChange={(e) => handleBasicInfoChange('key', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85B0B7]"
              >
                <option value="C">C</option>
                <option value="C#">C#</option>
                <option value="D">D</option>
                <option value="D#">D#</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="F#">F#</option>
                <option value="G">G</option>
                <option value="G#">G#</option>
                <option value="A">A</option>
                <option value="A#">A#</option>
                <option value="B">B</option>
              </select>
            </div>
            <div>
              <label htmlFor="tempo-input" className="block text-sm font-medium text-slate-700 mb-1">
                テンポ (BPM)
              </label>
              <input
                id="tempo-input"
                type="number"
                value={editedChart.tempo || ''}
                onChange={(e) => handleBasicInfoChange('tempo', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85B0B7]"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="time-signature-select" className="block text-sm font-medium text-slate-700 mb-1">
                拍子
              </label>
              <select
                id="time-signature-select"
                value={editedChart.timeSignature}
                onChange={(e) => handleBasicInfoChange('timeSignature', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85B0B7]"
              >
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="2/4">2/4</option>
                <option value="6/8">6/8</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">セクション</h3>
            <button
              onClick={addSection}
              className="bg-[#BDD0CA] hover:bg-[#A4C2B5] text-slate-800 px-3 py-1 rounded-md text-sm font-medium"
            >
              セクション追加
            </button>
          </div>

          {editedChart.sections?.map((section) => (
            <div key={section.id} className="mb-6 p-4 border border-slate-300 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <input
                  type="text"
                  value={section.name}
                  onChange={(e) => handleSectionChange(section.id, 'name', e.target.value)}
                  className="text-lg font-medium bg-transparent border-b border-slate-300 focus:outline-none focus:border-[#85B0B7]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => addChordToSection(section.id)}
                    className="bg-[#85B0B7] hover:bg-[#6B9CA5] text-white px-2 py-1 rounded-md text-xs"
                  >
                    ➕ コード追加
                  </button>
                  <button
                    onClick={() => selectAllInSection(section.id)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-md text-xs"
                    title="このセクションの全選択"
                  >
                    ✅ 全選択
                  </button>
                  <button
                    onClick={() => clearAllSelectionInSection(section.id)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md text-xs"
                    title="このセクションの選択をすべて解除"
                  >
                    ❌ 全解除
                  </button>
                  <button
                    onClick={() => copyChordProgression(section.id)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md text-xs"
                    title="コード進行をコピー"
                  >
                    📋 コピー
                  </button>
                  <button
                    onClick={() => pasteChordProgression(section.id)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md text-xs"
                    title="クリップボードから追加"
                  >
                    📥 貼り付け
                  </button>
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="bg-[#EE5840] hover:bg-[#D14A2E] text-white px-2 py-1 rounded-md text-xs"
                  >
                    削除
                  </button>
                </div>
              </div>

              <div className="mb-3 space-y-2">
                
                {/* テキスト入力での一括設定 */}
                <details className="text-sm">
                  <summary className="cursor-pointer text-slate-600 hover:text-slate-800">
                    テキストから一括入力
                  </summary>
                  <div className="mt-2 p-3 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-2">
                      例: "C F G Am" または "C(4) F(2) G(2) | Am(4)" 
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
                        onClick={() => replaceChordProgression(section.id)}
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
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={section.chords.map((_, index) => `${section.id}-${index}`)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {section.chords.map((chord, chordIndex) => {
                      // 各コードにユニークなIDを生成（コード名+インデックス+セクションIDの組み合わせ）
                      const itemId = `${section.id}-${chordIndex}`;
                      return (
                        <SortableChordItem
                          key={`${section.id}-${chordIndex}`}
                          chord={chord}
                          chordIndex={chordIndex}
                          sectionId={section.id}
                          itemId={itemId}
                          isSelected={selectedChords.has(`${section.id}-${chordIndex}`)}
                          onUpdateChord={updateChordInSection}
                          onDeleteChord={deleteChordFromSection}
                          onInsertLineBreak={insertLineBreakAfterChord}
                          onToggleSelection={toggleChordSelection}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mb-8">
          <label htmlFor="notes-textarea" className="block text-sm font-medium text-slate-700 mb-2">
            メモ
          </label>
          <textarea
            id="notes-textarea"
            value={editedChart.notes || ''}
            onChange={(e) => handleBasicInfoChange('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="コード譜に関するメモを入力してください"
          />
        </div>
      </div>
    </div>
  );
};

export default ChordChartEditor;