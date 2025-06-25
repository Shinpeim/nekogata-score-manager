import { v4 as uuidv4 } from 'uuid';
import type { StoredChord, DisplayChord, ChordSection } from '../types';

/**
 * 保存用ChordからUI表示用Chordに変換（idを生成）
 */
export function toDisplayChord(storedChord: StoredChord): DisplayChord {
  return {
    ...storedChord,
    id: uuidv4()
  };
}

/**
 * UI表示用Chordから保存用Chordに変換（idを除去）
 */
export function toStoredChord(displayChord: DisplayChord): StoredChord {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...storedChord } = displayChord;
  return storedChord;
}

/**
 * ChordSectionの全コードをUI表示用に変換
 */
export function toDisplaySection(section: Omit<ChordSection, 'chords'> & { chords: StoredChord[] }): ChordSection {
  return {
    ...section,
    chords: section.chords.map(toDisplayChord)
  };
}

/**
 * ChordSectionの全コードを保存用に変換
 */
export function toStoredSection(section: ChordSection): Omit<ChordSection, 'chords'> & { chords: StoredChord[] } {
  return {
    ...section,
    chords: section.chords.map(toStoredChord)
  };
}