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

