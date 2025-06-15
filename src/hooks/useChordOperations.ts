import type { ChordChart, Chord } from '../types';
import { extractChordRoot, parseOnChord } from '../utils/chordParsing';
import { createLineBreakMarker, isLineBreakMarker } from '../utils/lineBreakHelpers';

interface UseChordOperationsProps {
  chart: ChordChart;
  onUpdateChart: (chart: ChordChart) => void;
  selectedChords: Set<string>;
  setSelectedChords: (chords: Set<string>) => void;
  lastSelectedChord: string | null;
  setLastSelectedChord: (chord: string | null) => void;
}

export const useChordOperations = ({
  chart,
  onUpdateChart,
  selectedChords,
  setSelectedChords,
  lastSelectedChord,
  setLastSelectedChord,
}: UseChordOperationsProps) => {

  const addChordToSection = (sectionId: string) => {
    const newChord: Chord = {
      name: 'C',
      root: 'C',
      duration: 4,
      memo: ''
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
              chords: section.chords.map((chord, index) => 
                index === chordIndex ? { ...chord, [field]: value } : chord
              )
            }
          : section
      ) || []
    };
    onUpdateChart(updatedChart);
  };

  const finalizeChordName = (sectionId: string, chordIndex: number, value: string) => {
    if (!value.trim()) {
      return;
    }
    
    const parsed = parseOnChord(value);
    const updatedChart = {
      ...chart,
      sections: chart.sections?.map(section =>
        section.id === sectionId
          ? {
              ...section,
              chords: section.chords.map((chord, index) => {
                if (index === chordIndex) {
                  return {
                    ...chord,
                    name: parsed.chord,
                    root: extractChordRoot(parsed.chord),
                    base: parsed.base
                  };
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

  return {
    addChordToSection,
    updateChordInSection,
    finalizeChordName,
    deleteChordFromSection,
    insertLineBreakAfterChord,
    toggleChordSelection,
  };
};