export interface Chord {
  name: string;
  root: string;
  quality?: string;
  bass?: string;
  duration?: number;
  isLineBreak?: boolean; // 改行マーカーフラグ
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
  tags?: string[];
  notes?: string;
}

export interface ChordLibrary {
  [key: string]: ChordChart;
}

export type ChordRoot = 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B';

export type ChordQuality = '△' | 'm' | '7' | '△7' | 'm7' | 'dim' | 'aug' | 'sus2' | 'sus4' | 'add9' | '6' | 'm6' | '9' | '△9' | 'm9' | '11' | '13';

export interface ChordPosition {
  sectionId: string;
  barIndex: number;
  beatIndex: number;
}

export interface ChordEditAction {
  type: 'add' | 'edit' | 'delete' | 'move';
  position: ChordPosition;
  chord?: Chord;
  newPosition?: ChordPosition;
}