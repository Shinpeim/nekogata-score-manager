import { v4 as uuidv4 } from 'uuid';
import type { StoredChord, DisplayChord } from '../types';

/**
 * 保存用ChordからUI表示用Chordに変換（idを生成）
 */
export function toDisplayChord(storedChord: StoredChord): DisplayChord {
  return {
    ...storedChord,
    id: uuidv4()
  };
}



