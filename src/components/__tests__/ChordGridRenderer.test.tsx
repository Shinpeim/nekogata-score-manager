import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChordGridRenderer from '../ChordGridRenderer';
import type { ChordSection } from '../../types';

vi.mock('../../hooks/useResponsiveBars', () => ({
  useResponsiveBars: () => ({
    barsPerRow: 4,
    config: { MAX_WIDTH: 200 }
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
      { name: 'C', root: 'C', duration: 4 },
      { name: 'Am', root: 'A', duration: 4 },
      { name: 'F', root: 'F', duration: 4 },
      { name: 'G', root: 'G', duration: 4 }
    ],
    beatsPerBar: 4,
    barsCount: 4
  };

  describe('Chord rendering', () => {
    it('should render chord names correctly', () => {
      render(<ChordGridRenderer section={mockSection} timeSignature="4/4" />);

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('Am')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
    });

    it('should render chords with base notes', () => {
      const sectionWithBaseChords: ChordSection = {
        ...mockSection,
        chords: [
          { name: 'C', root: 'C', base: 'E', duration: 4 },
          { name: 'F', root: 'F', base: 'A', duration: 4 }
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
          { name: 'C', root: 'C', duration: 2 },
          { name: 'G', root: 'G', duration: 1 },
          { name: 'Am', root: 'A', duration: 1 }
        ]
      };

      render(<ChordGridRenderer section={sectionWithDurations} timeSignature="4/4" />);

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
      expect(screen.getByText('Am')).toBeInTheDocument();
    });

    it('should use default duration when chord duration is not specified', () => {
      const sectionWithoutDurations: ChordSection = {
        ...mockSection,
        chords: [
          { name: 'C', root: 'C' },
          { name: 'G', root: 'G' }
        ]
      };

      render(<ChordGridRenderer section={sectionWithoutDurations} timeSignature="4/4" />);

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
    });
  });

  describe('Time signature handling', () => {
    it('should handle different time signatures', () => {
      render(<ChordGridRenderer section={mockSection} timeSignature="3/4" />);

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('Am')).toBeInTheDocument();
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
      expect(screen.getByText('Am')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
    });

    it('should handle missing time signature gracefully', () => {
      render(<ChordGridRenderer section={mockSection} timeSignature="" />);

      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('Am')).toBeInTheDocument();
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
      const flexElements = container.querySelectorAll('.flex.min-h-12');
      expect(flexElements.length).toBeGreaterThan(0);
    });

    it('should apply hover effects to chord elements', () => {
      const { container } = render(<ChordGridRenderer section={mockSection} timeSignature="4/4" />);

      const hoverElements = container.querySelectorAll('.hover\\:bg-slate-100');
      expect(hoverElements.length).toBeGreaterThan(0);
    });
  });
});