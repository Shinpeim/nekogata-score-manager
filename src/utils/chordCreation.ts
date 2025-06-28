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
  
  // ユーザーが選択した拍子を使用してセクションを作成
  const timeSignature = data.timeSignature || empty.timeSignature;
  const sections = data.sections || [createEmptySection('イントロ', timeSignature)];
  
  return {
    id: uuidv4(),
    ...empty,
    ...data,
    // tempoが未定義の場合はデフォルト値を使用
    tempo: data.tempo !== undefined ? data.tempo : empty.tempo,
    // 正しい拍子で作成されたセクションを使用
    sections,
    createdAt: now,
    updatedAt: now
  };
};