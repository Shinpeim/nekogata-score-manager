import type { ChordChart } from '../types';

export const sampleCharts: ChordChart[] = [
  {
    id: 'sample-1',
    title: 'Let It Be',
    artist: 'The Beatles',
    key: 'C',
    tempo: 72,
    timeSignature: '4/4',
    sections: [
      {
        id: 'verse-1',
        name: 'Verse 1',
        beatsPerBar: 4,
        barsCount: 4,
        chords: [
          { name: 'C', root: 'C', duration: 4 },
          { name: 'G', root: 'G', duration: 4 },
          { name: 'Am', root: 'A', quality: 'm', duration: 4 },
          { name: 'F', root: 'F', duration: 4 },
          { name: 'C', root: 'C', duration: 4 },
          { name: 'G', root: 'G', duration: 4 },
          { name: 'Am', root: 'A', quality: 'm', duration: 4 },
          { name: 'F', root: 'F', duration: 4 },
        ]
      },
      {
        id: 'chorus-1',
        name: 'Chorus',
        beatsPerBar: 4,
        barsCount: 4,
        chords: [
          { name: 'C', root: 'C', duration: 4 },
          { name: 'G', root: 'G', duration: 4 },
          { name: 'F', root: 'F', duration: 2 },
          { name: 'C', root: 'C', duration: 2 },
          { name: 'G', root: 'G', duration: 4 },
          { name: 'C', root: 'C', duration: 4 },
          { name: 'G', root: 'G', duration: 4 },
          { name: 'Am', root: 'A', quality: 'm', duration: 2 },
          { name: 'F', root: 'F', duration: 2 },
        ]
      }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    tags: ['classic', 'ballad'],
    notes: 'Simple chord progression, great for beginners'
  },
  {
    id: 'sample-2',
    title: 'Wonderwall',
    artist: 'Oasis',
    key: 'G',
    tempo: 87,
    timeSignature: '4/4',
    sections: [
      {
        id: 'intro-1',
        name: 'Intro',
        beatsPerBar: 4,
        barsCount: 2,
        chords: [
          { name: 'Em7', root: 'E', quality: 'm7', duration: 4 },
          { name: 'G', root: 'G', duration: 4 },
        ]
      },
      {
        id: 'verse-1',
        name: 'Verse',
        beatsPerBar: 4,
        barsCount: 4,
        chords: [
          { name: 'Em7', root: 'E', quality: 'm7', duration: 4 },
          { name: 'G', root: 'G', duration: 4 },
          { name: 'D', root: 'D', duration: 4 },
          { name: 'C', root: 'C', duration: 4 },
        ]
      }
    ],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-22'),
    tags: ['rock', 'britpop'],
    notes: 'Capo on 2nd fret for original key'
  }
];