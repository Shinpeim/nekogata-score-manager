import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChordChartEditor from '../ChordChartEditor';
import type { ChordChart } from '../../types';

// DnD Kitをモック
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn(),
  SortableContext: ({ children }: { children: React.ReactNode }) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  rectSortingStrategy: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
}));

// Clipboard API をモック
const mockWriteText = vi.fn();
const mockReadText = vi.fn();

Object.defineProperty(globalThis.navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
    readText: mockReadText,
  },
  writable: true,
});

const sampleChart: ChordChart = {
  id: 'test-chart',
  title: 'Test Song',
  artist: 'Test Artist',
  key: 'C',
  tempo: 120,
  timeSignature: '4/4',
  sections: [
    {
      id: 'verse-1',
      name: 'Verse',
      beatsPerBar: 4,
      barsCount: 4,
      chords: [
        { name: 'C', root: 'C', duration: 4 },
        { name: 'F', root: 'F', duration: 4 },
        { name: 'G', root: 'G', duration: 4 },
        { name: 'Am', root: 'A', duration: 4 },
      ],
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: ['test'],
};

describe('ChordSelection', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
    mockWriteText.mockClear();
    mockReadText.mockClear();
  });

  it('should show toggle select all button in sections', () => {
    render(
      <ChordChartEditor 
        chart={sampleChart} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    expect(screen.getByTitle('このセクションの全選択')).toBeInTheDocument();
  });

  it('should allow selecting chords without showing action bar', () => {
    render(
      <ChordChartEditor 
        chart={sampleChart} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    // Action bar should never appear
    expect(screen.queryByText('📋 選択をコピー')).not.toBeInTheDocument();
    expect(screen.queryByText('🗑️ 選択を削除')).not.toBeInTheDocument();

    // Click "全選択" to select all chords
    const selectAllButton = screen.getByTitle('このセクションの全選択');
    fireEvent.click(selectAllButton);

    // Action bar should still not appear
    expect(screen.queryByText('📋 選択をコピー')).not.toBeInTheDocument();
    expect(screen.queryByText('🗑️ 選択を削除')).not.toBeInTheDocument();
  });

  it('should always show copy/paste buttons in sections', () => {
    render(
      <ChordChartEditor 
        chart={sampleChart} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    // Copy/paste buttons should always be visible
    expect(screen.getByTitle('コード進行をコピー')).toBeInTheDocument();
    expect(screen.getByTitle('クリップボードから追加')).toBeInTheDocument();
  });





  it('should show checkmark for selected chords', async () => {
    render(
      <ChordChartEditor 
        chart={sampleChart} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    // Select all chords
    const selectAllButton = screen.getByTitle('このセクションの全選択');
    fireEvent.click(selectAllButton);

    await waitFor(() => {
      // Should show checkmarks for selected chords
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBeGreaterThan(0);
    });
  });

  it('should toggle selection when clicking 全選択 button twice', async () => {
    render(
      <ChordChartEditor 
        chart={sampleChart} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    // First click to select all chords
    const selectAllButton = screen.getByTitle('このセクションの全選択');
    fireEvent.click(selectAllButton);

    await waitFor(() => {
      // Should show checkmarks for selected chords
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    // Second click should toggle to clear all selections (since all are selected, it should clear them)
    const toggleButton = screen.getByTitle('このセクションの選択をすべて解除');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      // Should not show any checkmarks
      const checkmarks = screen.queryAllByText('✓');
      expect(checkmarks).toHaveLength(0);
    });
  });

});