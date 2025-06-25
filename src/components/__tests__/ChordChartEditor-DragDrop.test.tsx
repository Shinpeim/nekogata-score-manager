import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChordChartEditor from '../ChordChartEditor';
import type { ChordChart } from '../../types';

// dnd-kitのモック
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((array, from, to) => {
    const result = [...array];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  rectSortingStrategy: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
}));

describe('ChordChartEditor - Drag & Drop', () => {
  const mockChart: ChordChart = {
    id: 'test-chart',
    title: 'テストチャート',
    artist: 'テストアーティスト',
    key: 'C',
    tempo: 120,
    timeSignature: '4/4',
    sections: [
      {
        id: 'section-1',
        name: 'Aメロ',
        beatsPerBar: 4,
        barsCount: 4,
        chords: [
          { id: 'chord-1', name: 'C', root: 'C', duration: 4, memo: '' },
          { id: 'chord-2', name: 'Am', root: 'A', duration: 4, memo: '' },
          { id: 'chord-3', name: 'F', root: 'F', duration: 4, memo: '' },
          { id: 'chord-4', name: 'G', root: 'G', duration: 4, memo: '' }
        ]
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  it('DndContextが正しく配置されている', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // セクション用のDndContextと、コード用のDndContextが配置されていることを確認
    const dndContexts = screen.getAllByTestId('dnd-context');
    expect(dndContexts.length).toBeGreaterThanOrEqual(2); // 最低でもセクション用とコード用で2つ
  });

  it('SortableContextが正しく配置されている', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // セクション用とコード用のSortableContextが配置されていることを確認
    const sortableContexts = screen.getAllByTestId('sortable-context');
    expect(sortableContexts.length).toBeGreaterThanOrEqual(2);
  });

  it('ドラッグハンドルボタンが表示される', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // ドラッグハンドル（⋮⋮）ボタンがあることを確認
    const dragHandles = screen.getAllByTitle('ドラッグして移動');
    expect(dragHandles).toHaveLength(4); // 4つのコードがあるので4つのハンドル
  });

  it('各コードアイテムが表示される', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // プレースホルダーでコード名入力フィールドを特定
    const chordInputs = screen.getAllByPlaceholderText('コード名');
    expect(chordInputs).toHaveLength(4);
    
    // 各コード入力フィールドの値を確認
    expect((chordInputs[0] as HTMLInputElement).value).toBe('C');
    expect((chordInputs[1] as HTMLInputElement).value).toBe('Am');
    expect((chordInputs[2] as HTMLInputElement).value).toBe('F');
    expect((chordInputs[3] as HTMLInputElement).value).toBe('G');
  });

  it('ドラッグハンドルが正しく機能する', () => {
    render(
      <ChordChartEditor
        chart={mockChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // ドラッグハンドルボタンが存在し、正しいクラスが適用されていることを確認
    const dragHandles = screen.getAllByTitle('ドラッグして移動');
    expect(dragHandles[0]).toHaveClass('cursor-grab', 'active:cursor-grabbing');
  });

  it('改行マーカーにもドラッグハンドルが表示される', () => {
    const chartWithLineBreak: ChordChart = {
      ...mockChart,
      sections: [
        {
          ...mockChart.sections[0],
          chords: [
            { id: 'chord-1', name: 'C', root: 'C', duration: 4, memo: '' },
            { id: 'chord-2', name: '改行', root: '', isLineBreak: true, duration: 0, memo: '' },
            { id: 'chord-3', name: 'Am', root: 'A', duration: 4, memo: '' }
          ]
        }
      ]
    };

    render(
      <ChordChartEditor
        chart={chartWithLineBreak}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // 改行マーカーも含めて3つのドラッグハンドルが表示される
    const dragHandles = screen.getAllByTitle('ドラッグして移動');
    expect(dragHandles).toHaveLength(3);
  });

  it('複数セクションそれぞれにDndContextが配置される', () => {
    const multiSectionChart: ChordChart = {
      ...mockChart,
      sections: [
        mockChart.sections[0],
        {
          id: 'section-2',
          name: 'Bメロ',
          beatsPerBar: 4,
          barsCount: 2,
          chords: [
            { id: 'chord-5', name: 'Dm', root: 'D', duration: 4, memo: '' },
            { id: 'chord-6', name: 'G', root: 'G', duration: 4, memo: '' }
          ]
        }
      ]
    };

    render(
      <ChordChartEditor
        chart={multiSectionChart}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // セクション用のDndContext（1つ）と各セクション内のコード用のDndContext（2つ）で合計3つ
    const dndContexts = screen.getAllByTestId('dnd-context');
    expect(dndContexts).toHaveLength(3);

    // 全コード（6個）にドラッグハンドルがあることを確認
    const dragHandles = screen.getAllByTitle('ドラッグして移動');
    expect(dragHandles).toHaveLength(6);
  });
});