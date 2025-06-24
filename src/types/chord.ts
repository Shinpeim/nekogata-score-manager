export interface Chord {
  name: string;
  root: string;
  base?: string; // オンコードのベース音
  duration?: number;
  isLineBreak?: boolean; // 改行マーカーフラグ
  memo: string; // コードに付加するメモ（歌詞、演奏記号等）
}

export interface ChordSection {
  id: string;
  name?: string;
  chords: Chord[];
  beatsPerBar: number;
  barsCount: number;
}

export interface ChordChart {
  id: string;
  title: string;
  artist?: string;
  key: string;
  tempo?: number;
  timeSignature: string;
  sections: ChordSection[];
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  version?: string;
}

export interface ChordLibrary {
  [key: string]: ChordChart;
}