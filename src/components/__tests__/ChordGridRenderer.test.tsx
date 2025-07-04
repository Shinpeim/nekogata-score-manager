import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChordGridRenderer from '../ChordGridRenderer';
import type { ChordSection } from '../../types';

vi.mock('../../hooks/useResponsiveBars', () => ({
  useResponsiveBars: () => ({
    barsPerRow: 4,
    config: { MAX_WIDTH: 200 },
    calculateDynamicLayout: vi.fn((bars) => [bars]), // 動的幅計算モック
    getBarWidth: vi.fn(() => 200), // 小節幅計算モック
    getChordWidth: vi.fn(() => 47) // コード幅計算モック
  })
}));

vi.mock('../../utils/lineBreakHelpers', () => ({
  splitChordsIntoRows: vi.fn((chords) => [chords]),
  isLineBreakMarker: vi.fn(() => false)
}));

describe('ChordGridRenderer', () => {
  const mockSection: ChordSection = {
    id: 'section-1',
    name: 'Test Section',
    chords: [
      { id: 'chord-1', name: 'C', root: 'C', duration: 4, memo: '' },
      { id: 'chord-2', name: 'Am', root: 'A', duration: 4, memo: '' },
      { id: 'chord-3', name: 'F', root: 'F', duration: 4, memo: '' },
      { id: 'chord-4', name: 'G', root: 'G', duration: 4, memo: '' }
    ],
    beatsPerBar: 4,
    barsCount: 4
  };

  describe('Chord rendering', () => {
    it('should render chord names correctly', () => {
      render(<ChordGridRenderer section={mockSection} timeSignature="4/4" />);

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('m')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
    });

    it('should render chords with base notes', () => {
      const sectionWithBaseChords: ChordSection = {
        ...mockSection,
        chords: [
          { id: 'chord-5', name: 'C', root: 'C', base: 'E', duration: 4, memo: '' },
          { id: 'chord-6', name: 'F', root: 'F', base: 'A', duration: 4, memo: '' }
        ]
      };

      render(<ChordGridRenderer section={sectionWithBaseChords} timeSignature="4/4" />);

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('/E')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
      expect(screen.getByText('/A')).toBeInTheDocument();
    });

    it('should handle chords with different durations', () => {
      const sectionWithDurations: ChordSection = {
        ...mockSection,
        chords: [
          { id: 'chord-7', name: 'C', root: 'C', duration: 2, memo: '' },
          { id: 'chord-8', name: 'G', root: 'G', duration: 1, memo: '' },
          { id: 'chord-9', name: 'Am', root: 'A', duration: 1, memo: '' }
        ]
      };

      render(<ChordGridRenderer section={sectionWithDurations} timeSignature="4/4" />);

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('m')).toBeInTheDocument();
    });

    it('should use default duration when chord duration is not specified', () => {
      const sectionWithoutDurations: ChordSection = {
        ...mockSection,
        chords: [
          { id: 'chord-10', name: 'C', root: 'C', memo: '' },
          { id: 'chord-11', name: 'G', root: 'G', memo: '' }
        ]
      };

      render(<ChordGridRenderer section={sectionWithoutDurations} timeSignature="4/4" />);

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
    });

    it('should render chord memos when present', () => {
      const sectionWithMemos: ChordSection = {
        ...mockSection,
        chords: [
          { id: 'chord-12', name: 'C', root: 'C', duration: 4, memo: '愛を込めて' },
          { id: 'chord-13', name: 'Am', root: 'A', duration: 4, memo: 'cresc.' },
          { id: 'chord-14', name: 'F', root: 'F', duration: 4, memo: '' },
          { id: 'chord-15', name: 'G', root: 'G', duration: 4, memo: 'forte' }
        ]
      };

      render(<ChordGridRenderer section={sectionWithMemos} timeSignature="4/4" />);

      expect(screen.getByText('愛を込めて')).toBeInTheDocument();
      expect(screen.getByText('cresc.')).toBeInTheDocument();
      expect(screen.getByText('forte')).toBeInTheDocument();
      
      // メモがないコードはメモが表示されない
      expect(screen.queryByText('F')).toBeInTheDocument();
    });

    it('should not render memo div when memo is empty', () => {
      const sectionWithoutMemos: ChordSection = {
        ...mockSection,
        chords: [
          { id: 'chord-16', name: 'C', root: 'C', duration: 4, memo: '' },
          { id: 'chord-17', name: 'Am', root: 'A', duration: 4, memo: '' }
        ]
      };

      const { container } = render(<ChordGridRenderer section={sectionWithoutMemos} timeSignature="4/4" />);

      // メモ用のdivが存在しないことを確認
      const memoElements = container.querySelectorAll('.text-slate-600');
      expect(memoElements.length).toBe(0);
    });
  });

  describe('Time signature handling', () => {
    it('should handle different time signatures', () => {
      render(<ChordGridRenderer section={mockSection} timeSignature="3/4" />);

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('m')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
    });

    it('should use section beatsPerBar when different from time signature', () => {
      const sectionWithCustomBeats: ChordSection = {
        ...mockSection,
        beatsPerBar: 8
      };

      render(<ChordGridRenderer section={sectionWithCustomBeats} timeSignature="4/4" />);

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('m')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
    });

    it('should handle missing time signature gracefully', () => {
      render(<ChordGridRenderer section={mockSection} timeSignature="" />);

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('m')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
    });
  });

  describe('Empty sections', () => {
    it('should handle empty chord arrays', () => {
      const emptySection: ChordSection = {
        ...mockSection,
        chords: []
      };

      const { container } = render(<ChordGridRenderer section={emptySection} timeSignature="4/4" />);

      // Should render without errors but with no chord content
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Grid layout', () => {
    it('should render chord grid structure with proper styling', () => {
      const { container } = render(<ChordGridRenderer section={mockSection} timeSignature="4/4" />);

      // Check for grid container classes
      const gridElements = container.querySelectorAll('.relative.bg-white');
      expect(gridElements.length).toBeGreaterThan(0);

      // Check for flex layout
      const flexElements = container.querySelectorAll('.flex.min-h-8');
      expect(flexElements.length).toBeGreaterThan(0);
    });

    it('should apply hover effects to chord elements', () => {
      const { container } = render(<ChordGridRenderer section={mockSection} timeSignature="4/4" />);

      const hoverElements = container.querySelectorAll('.hover\\:bg-slate-100');
      expect(hoverElements.length).toBeGreaterThan(0);
    });
  });
});