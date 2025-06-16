import { useState } from 'react';
import type { ChordChart, ChordSection } from '../types';
import { copyChordProgressionToClipboard, pasteChordProgressionFromClipboard, textToChords } from '../utils/chordCopyPaste';

interface UseSectionOperationsProps {
  chart: ChordChart;
  onUpdateChart: (chart: ChordChart) => void;
  selectedChords: Set<string>;
  setSelectedChords: (chords: Set<string>) => void;
  setLastSelectedChord: (chord: string | null) => void;
}

export const useSectionOperations = ({
  chart,
  onUpdateChart,
  selectedChords,
  setSelectedChords,
  setLastSelectedChord,
}: UseSectionOperationsProps) => {
  const [copiedMessage, setCopiedMessage] = useState<string>('');

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

  const replaceChordProgression = (sectionId: string, text: string) => {
    if (!text.trim()) return;
    
    const chords = textToChords(text);
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
  };

  const toggleSelectAllInSection = (sectionId: string) => {
    const section = chart.sections?.find(s => s.id === sectionId);
    if (!section) return;

    const sectionChordIds = [];
    for (let i = 0; i < section.chords.length; i++) {
      if (section.chords[i].isLineBreak !== true) {
        sectionChordIds.push(`${sectionId}-${i}`);
      }
    }

    const selectedInSection = sectionChordIds.filter(id => selectedChords.has(id)).length;
    const newSelected = new Set(selectedChords);

    if (selectedInSection === sectionChordIds.length) {
      sectionChordIds.forEach(id => newSelected.delete(id));
      if (newSelected.size === 0) {
        setLastSelectedChord(null);
      }
    } else {
      sectionChordIds.forEach(id => newSelected.add(id));
    }

    setSelectedChords(newSelected);
  };

  return {
    copiedMessage,
    handleSectionChange,
    addSection,
    deleteSection,
    duplicateSection,
    copyChordProgression,
    pasteChordProgression,
    replaceChordProgression,
    toggleSelectAllInSection,
  };
};