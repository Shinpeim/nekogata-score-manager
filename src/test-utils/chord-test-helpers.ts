import { v4 as uuidv4 } from 'uuid';
import type { DisplayChord, StoredChord } from '../types';

/**
 * テスト用のDisplayChordを作成するヘルパー関数
 * idを自動生成し、デフォルト値を設定する
 */
export function createTestChord(chord: Omit<StoredChord, 'memo'> & { memo?: string }): DisplayChord {
  return {
    id: uuidv4(),
    memo: '',
    ...chord
  };
}

/**
 * 複数のテスト用DisplayChordを一度に作成
 */
export function createTestChords(chords: Array<Omit<StoredChord, 'memo'> & { memo?: string }>): DisplayChord[] {
  return chords.map(createTestChord);
}

/**
 * よく使うコード進行のプリセット
 */
export const TEST_CHORD_PROGRESSIONS = {
  // C-Am-F-G (ポップスの定番進行)
  popProgression: () => createTestChords([
    { name: 'C', root: 'C', duration: 4 },
    { name: 'Am', root: 'A', duration: 4 },
    { name: 'F', root: 'F', duration: 4 },
    { name: 'G', root: 'G', duration: 4 }
  ]),
  
  // C-G-Am-F (カノン進行)
  canonProgression: () => createTestChords([
    { name: 'C', root: 'C', duration: 4 },
    { name: 'G', root: 'G', duration: 4 },
    { name: 'Am', root: 'A', duration: 4 },
    { name: 'F', root: 'F', duration: 4 }
  ]),
  
  // オンコードを含む進行
  onChordProgression: () => createTestChords([
    { name: 'C', root: 'C', duration: 4 },
    { name: 'G/B', root: 'G', base: 'B', duration: 4 },
    { name: 'Am', root: 'A', duration: 4 },
    { name: 'F', root: 'F', duration: 4 }
  ]),
  
  // 短い拍数のコード
  shortDurationChords: () => createTestChords([
    { name: 'C', root: 'C', duration: 2 },
    { name: 'G', root: 'G', duration: 2 },
    { name: 'Am', root: 'A', duration: 1 },
    { name: 'F', root: 'F', duration: 3 }
  ])
};