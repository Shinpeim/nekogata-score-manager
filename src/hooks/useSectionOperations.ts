import type { ChordChart, ChordSection } from '../types';
import { textToChords } from '../utils/chordCopyPaste';

interface UseSectionOperationsProps {
  chart: ChordChart;
  onUpdateChart: (chart: ChordChart) => void;
}

export const useSectionOperations = ({
  chart,
  onUpdateChart,
}: UseSectionOperationsProps) => {

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
    
    // 新しいセクションを最後に追加
    const newSections = [...sections, newSection];

    const updatedChart = {
      ...chart,
      sections: newSections
    };
    onUpdateChart(updatedChart);
  };


  const replaceChordProgression = (sectionId: string, text: string) => {
    if (!text.trim()) return;
    
    // セクションの拍子からデフォルト拍数を取得
    const section = chart.sections?.find(s => s.id === sectionId);
    const defaultDuration = section?.beatsPerBar || 4;
    
    const chords = textToChords(text, defaultDuration);
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


  return {
    handleSectionChange,
    addSection,
    deleteSection,
    duplicateSection,
    replaceChordProgression,
  };
};