import type { ChordChart, ChordSection } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const createEmptyChordChart = (): Omit<ChordChart, 'id' | 'createdAt' | 'updatedAt'> => {
  const timeSignature = '4/4';
  return {
    title: '新しいコード譜',
    artist: '',
    key: 'C',
    tempo: 120,
    timeSignature,
    sections: [createEmptySection('イントロ', timeSignature)],
    tags: [],
    notes: ''
  };
};

export const createEmptySection = (name: string = 'セクション', timeSignature: string = '4/4'): ChordSection => {
  const beatsPerBar = parseInt(timeSignature.split('/')[0]);
  return {
    id: uuidv4(),
    name,
    chords: [],
    beatsPerBar,
    barsCount: 4
  };
};

export const createNewChordChart = (
  data: Partial<ChordChart>
): ChordChart => {
  const now = new Date();
  const empty = createEmptyChordChart();
  
  return {
    id: uuidv4(),
    ...empty,
    ...data,
    // sectionsが未定義の場合はデフォルトセクションを使用
    sections: data.sections || empty.sections,
    createdAt: now,
    updatedAt: now
  };
};