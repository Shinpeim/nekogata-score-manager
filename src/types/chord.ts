// 保存用のChord（永続化データ）
export interface StoredChord {
  name: string;
  root: string;
  base?: string; // オンコードのベース音
  duration?: number;
  isLineBreak?: boolean; // 改行マーカーフラグ
  memo: string; // コードに付加するメモ（歌詞、演奏記号等）
}

// 表示用のChord（UI専用、idを含む）
export interface DisplayChord extends StoredChord {
  id: string; // UI専用のユニークID
}

// 後方互換性のため
export type Chord = DisplayChord;

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