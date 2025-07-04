import type { ChordChart, Chord } from '../types';
import { parseChordInput } from '../utils/chordParsing';
import { createLineBreakMarker } from '../utils/lineBreakHelpers';
import { toDisplayChord } from '../utils/chordConversion';

interface UseChordOperationsProps {
  chart: ChordChart;
  onUpdateChart: (chart: ChordChart) => void;
}

export const useChordOperations = ({
  chart,
  onUpdateChart,
}: UseChordOperationsProps) => {

  const addChordToSection = (sectionId: string) => {
    // 拍子に応じてデフォルトの拍数を決定
    const section = chart.sections?.find(s => s.id === sectionId);
    const defaultDuration = section?.beatsPerBar || 4;
    
    const newChord: Chord = toDisplayChord({
      name: '',
      root: '',
      duration: defaultDuration,
      memo: ''
    });
    
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
    
    // 既存のコードの拍数をデフォルトとして使用、なければセクションの拍子から
    const section = chart.sections?.find(s => s.id === sectionId);
    const currentChord = section?.chords[chordIndex];
    const defaultDuration = currentChord?.duration || section?.beatsPerBar || 4;
    
    const parsed = parseChordInput(value, defaultDuration);
    if (!parsed) {
      return; // パースに失敗した場合は何もしない
    }
    
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
                    name: parsed.name,
                    root: parsed.root,
                    base: parsed.base,
                    duration: parsed.duration
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

  return {
    addChordToSection,
    updateChordInSection,
    finalizeChordName,
    deleteChordFromSection,
    insertLineBreakAfterChord,
  };
};