import React, { useState } from 'react';
import type { ChordChart, ChordSection, Chord } from '../types';
import { createLineBreakMarker, isLineBreakMarker } from '../utils/lineBreakHelpers';
import { 
  textToChords, 
  copyChordProgressionToClipboard, 
  pasteChordProgressionFromClipboard,
  isValidChordProgression 
} from '../utils/chordCopyPaste';
import { extractChordRoot } from '../utils/chordUtils';
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
import SortableChordItem from './SortableChordItem';

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
  const [copiedMessage, setCopiedMessage] = useState<string>('');
  const [pasteText, setPasteText] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
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

  const handleSectionChange = (sectionId: string, field: keyof ChordSection, value: string | number) => {
    const updatedChart = {
      ...chart,
      sections: chart.sections?.map(section =>
        section.id === sectionId
          ? { ...section, [field]: value }
          : section
      ) || []
    };
    onUpdateChart(updatedChart);
  };

  const addSection = () => {
    const beatsPerBar = chart.timeSignature ? parseInt(chart.timeSignature.split('/')[0]) : 4;
    const newSection: ChordSection = {
      id: `section-${Date.now()}`,
      name: '新しいセクション',
      beatsPerBar,
      barsCount: 4,
      chords: []
    };
    
    const updatedChart = {
      ...chart,
      sections: [...(chart.sections || []), newSection]
    };
    onUpdateChart(updatedChart);
  };

  const deleteSection = (sectionId: string) => {
    const updatedChart = {
      ...chart,
      sections: chart.sections?.filter(section => section.id !== sectionId) || []
    };
    onUpdateChart(updatedChart);
  };

  const duplicateSection = (sectionId: string) => {
    const sectionToDuplicate = chart.sections?.find(section => section.id === sectionId);
    if (!sectionToDuplicate) return;

    const newSection: ChordSection = {
      ...sectionToDuplicate,
      id: `section-${Date.now()}`,
      name: `${sectionToDuplicate.name} (コピー)`,
      chords: [...sectionToDuplicate.chords]
    };

    const sections = chart.sections || [];
    const originalIndex = sections.findIndex(section => section.id === sectionId);
    if (originalIndex === -1) return;

    const newSections = [
      ...sections.slice(0, originalIndex + 1),
      newSection,
      ...sections.slice(originalIndex + 1)
    ];

    const updatedChart = {
      ...chart,
      sections: newSections
    };
    onUpdateChart(updatedChart);
  };

  const addChordToSection = (sectionId: string) => {
    const newChord: Chord = {
      name: 'C',
      root: 'C',
      duration: 4
    };
    
    const updatedChart = {
      ...chart,
      sections: chart.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: [...section.chords, newChord]
            }
          : section
      ) || []
    };
    onUpdateChart(updatedChart);
  };

  const updateChordInSection = (sectionId: string, chordIndex: number, field: keyof Chord, value: string | number) => {
    const updatedChart = {
      ...chart,
      sections: chart.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: section.chords.map((chord, index) => {
                if (index === chordIndex) {
                  const updatedChord = { ...chord, [field]: value };
                  // コード名が更新された場合、rootも自動更新
                  if (field === 'name' && typeof value === 'string') {
                    updatedChord.root = extractChordRoot(value);
                  }
                  return updatedChord;
                }
                return chord;
              })
            }
          : section
      ) || []
    };
    onUpdateChart(updatedChart);
  };

  const deleteChordFromSection = (sectionId: string, chordIndex: number) => {
    const updatedChart = {
      ...chart,
      sections: chart.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: section.chords.filter((_, index) => index !== chordIndex)
            }
          : section
      ) || []
    };
    onUpdateChart(updatedChart);
  };

  const insertLineBreakAfterChord = (sectionId: string, chordIndex: number) => {
    const lineBreak = createLineBreakMarker();
    
    const updatedChart = {
      ...chart,
      sections: chart.sections?.map(section =>
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
    };
    onUpdateChart(updatedChart);
  };

  const copyChordProgression = async (sectionId: string) => {
    const section = chart.sections?.find(s => s.id === sectionId);
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

    const updatedChart = {
      ...chart,
      sections: chart.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: [...section.chords, ...chords]
            }
          : section
      ) || []
    };
    onUpdateChart(updatedChart);
  };

  const replaceChordProgression = (sectionId: string) => {
    if (!pasteText.trim()) return;
    
    const chords = textToChords(pasteText);
    if (chords.length === 0) return;

    const updatedChart = {
      ...chart,
      sections: chart.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: chords
            }
          : section
      ) || []
    };
    onUpdateChart(updatedChart);

    setPasteText('');
  };

  const toggleChordSelection = (sectionId: string, chordIndex: number, event?: React.MouseEvent) => {
    const chordId = `${sectionId}-${chordIndex}`;
    
    if (event?.shiftKey && lastSelectedChord) {
      const lastParts = lastSelectedChord.split('-');
      const lastSectionId = lastParts.slice(0, -1).join('-');
      const lastChordIndex = parseInt(lastParts[lastParts.length - 1]);
      
      if (lastSectionId === sectionId) {
        const start = Math.min(chordIndex, lastChordIndex);
        const end = Math.max(chordIndex, lastChordIndex);
        
        const newSelected = new Set(selectedChords);
        
        for (let i = start; i <= end; i++) {
          const section = chart.sections?.find(s => s.id === sectionId);
          if (section && i < section.chords.length && !isLineBreakMarker(section.chords[i])) {
            newSelected.add(`${sectionId}-${i}`);
          }
        }
        
        setSelectedChords(newSelected);
        setLastSelectedChord(chordId);
      }
    } else {
      const newSelected = new Set(selectedChords);
      if (newSelected.has(chordId)) {
        newSelected.delete(chordId);
      } else {
        newSelected.add(chordId);
      }
      setSelectedChords(newSelected);
      setLastSelectedChord(chordId);
    }
  };

  const toggleSelectAllInSection = (sectionId: string) => {
    const section = chart.sections?.find(s => s.id === sectionId);
    if (!section) return;

    // セクション内のコード数を取得
    const sectionChordIds = [];
    for (let i = 0; i < section.chords.length; i++) {
      if (!isLineBreakMarker(section.chords[i])) {
        sectionChordIds.push(`${sectionId}-${i}`);
      }
    }

    // 選択されているセクション内のコード数を計算
    const selectedInSection = sectionChordIds.filter(id => selectedChords.has(id)).length;

    const newSelected = new Set(selectedChords);

    if (selectedInSection === sectionChordIds.length) {
      // 全て選択されている場合：全解除
      sectionChordIds.forEach(id => newSelected.delete(id));
      if (newSelected.size === 0) {
        setLastSelectedChord(null);
      }
    } else {
      // 一部または何も選択されていない場合：全選択
      sectionChordIds.forEach(id => newSelected.add(id));
    }

    setSelectedChords(newSelected);
  };

  return (
    <div className="mb-8">
      {copiedMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm">
          {copiedMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">セクション</h3>
      </div>

      {chart.sections?.map((section) => (
        <div key={section.id} className="mb-6 p-4 border border-slate-300 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
            <input
              type="text"
              value={section.name}
              onChange={(e) => handleSectionChange(section.id, 'name', e.target.value)}
              className="text-lg font-medium bg-transparent border-b border-slate-300 focus:outline-none focus:border-[#85B0B7] flex-1 min-w-0"
            />
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => toggleSelectAllInSection(section.id)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-md text-sm w-8 h-8 flex items-center justify-center"
                title={(() => {
                  const sectionChordIds = [];
                  for (let i = 0; i < section.chords.length; i++) {
                    if (!isLineBreakMarker(section.chords[i])) {
                      sectionChordIds.push(`${section.id}-${i}`);
                    }
                  }
                  const selectedInSection = sectionChordIds.filter(id => selectedChords.has(id)).length;
                  
                  if (selectedInSection === sectionChordIds.length && sectionChordIds.length > 0) {
                    return "このセクションの選択をすべて解除";
                  } else {
                    return "このセクションの全選択";
                  }
                })()}
              >
                ☑
              </button>
              <button
                onClick={() => copyChordProgression(section.id)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-md text-sm w-8 h-8 flex items-center justify-center"
                title="コード進行をコピー"
              >
                ⎘
              </button>
              <button
                onClick={() => pasteChordProgression(section.id)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-md text-sm w-8 h-8 flex items-center justify-center"
                title="クリップボードから追加"
              >
                ⎙
              </button>
              <button
                onClick={() => duplicateSection(section.id)}
                className="bg-[#BDD0CA] hover:bg-[#A4C2B5] text-slate-800 p-2 rounded-md text-sm w-8 h-8 flex items-center justify-center"
                title="このセクションを複製"
              >
                ⧉
              </button>
              <button
                onClick={() => deleteSection(section.id)}
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
                <div className="flex items-center justify-center p-2 border border-dashed border-slate-300 rounded-md hover:border-[#85B0B7] transition-colors">
                  <button
                    onClick={() => addChordToSection(section.id)}
                    className="w-full h-full flex flex-col items-center justify-center gap-1 text-[#85B0B7] hover:text-[#6B9CA5] transition-colors"
                  >
                    <span className="text-2xl">+</span>
                    <span className="text-xs font-medium">コード追加</span>
                  </button>
                </div>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ))}
      
      <div className="mt-6 flex justify-center">
        <button
          onClick={addSection}
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