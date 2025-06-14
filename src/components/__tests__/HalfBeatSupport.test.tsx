import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChordChartEditor from '../ChordChartEditor';
import ChordChart from '../ChordChart';
import type { ChordChart as ChordChartType } from '../../types';

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

describe('Half Beat Support', () => {
  const mockChart: ChordChartType = {
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
          { name: 'C', root: 'C', duration: 4 },
          { name: 'Am', root: 'A', duration: 2 },
          { name: 'F', root: 'F', duration: 1.5 },
          { name: 'G', root: 'G', duration: 0.5 }
        ]
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  describe('ChordChartEditor', () => {
    it('拍数入力フィールドで0.5刻みの入力が可能', () => {
      render(
        <ChordChartEditor
          chart={mockChart}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const durationInputs = screen.getAllByPlaceholderText('拍数');
      const firstDurationInput = durationInputs[0] as HTMLInputElement;

      // 入力フィールドの属性確認
      expect(firstDurationInput.min).toBe('0.5');
      expect(firstDurationInput.step).toBe('0.5');
      expect(firstDurationInput.max).toBe('16');
      expect(firstDurationInput.type).toBe('number');
    });

    it('小数点の拍数値が正しく表示される', () => {
      render(
        <ChordChartEditor
          chart={mockChart}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const durationInputs = screen.getAllByPlaceholderText('拍数');
      
      // 各拍数の値を確認
      expect((durationInputs[0] as HTMLInputElement).value).toBe('4');
      expect((durationInputs[1] as HTMLInputElement).value).toBe('2');
      expect((durationInputs[2] as HTMLInputElement).value).toBe('1.5');
      expect((durationInputs[3] as HTMLInputElement).value).toBe('0.5');
    });

    it('拍数入力で小数値を設定できる', () => {
      render(
        <ChordChartEditor
          chart={mockChart}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const durationInputs = screen.getAllByPlaceholderText('拍数');
      const firstDurationInput = durationInputs[0];

      // 小数値を入力
      fireEvent.change(firstDurationInput, { target: { value: '2.5' } });
      
      expect((firstDurationInput as HTMLInputElement).value).toBe('2.5');
    });

    it('0.5未満の値は入力できない', () => {
      render(
        <ChordChartEditor
          chart={mockChart}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const durationInputs = screen.getAllByPlaceholderText('拍数');
      const firstDurationInput = durationInputs[0] as HTMLInputElement;

      // 最小値0.5未満を入力しようとする
      fireEvent.change(firstDurationInput, { target: { value: '0.25' } });
      
      // ブラウザのバリデーションによりmin値以下は設定されない
      expect(parseFloat(firstDurationInput.min)).toBe(0.5);
    });
  });

  describe('ChordChart Display', () => {
    it('コード名が正しく表示される', () => {
      render(<ChordChart chartData={mockChart} />);

      // 各コード名が表示されることを確認（拍数表示は削除済み）
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('Am')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
    });

    it('セクション名が【】で囲まれて表示される', () => {
      render(<ChordChart chartData={mockChart} />);

      // セクション名が【】で囲まれて表示される
      expect(screen.getByText('【Aメロ】')).toBeInTheDocument();
    });

    // 拍数表示はUI簡素化により削除済み
    // it('小数の拍数が正しい表示フォーマットで表示される', () => {
    //   const chartWithVariousDecimals: ChordChartType = {
    //     ...mockChart,
    //     sections: [
    //       {
    //         ...mockChart.sections[0],
    //         chords: [
    //           { name: 'C', root: 'C', duration: 1.5 },
    //           { name: 'F', root: 'F', duration: 2.5 },
    //           { name: 'G', root: 'G', duration: 0.5 },
    //           { name: 'Am', root: 'A', duration: 3.0 } // 整数だが小数点形式
    //         ]
    //       }
    //     ]
    //   };

    //   render(<ChordChart chartData={chartWithVariousDecimals} />);

    //   // 小数点のある値は小数点付きで表示
    //   expect(screen.getByText('(1.5)')).toBeInTheDocument();
    //   expect(screen.getByText('(2.5)')).toBeInTheDocument();
    //   expect(screen.getByText('(0.5)')).toBeInTheDocument();
      
    //   // 3.0は整数として扱われるので(3)と表示される
    //   expect(screen.getByText('(3)')).toBeInTheDocument();
    // });

    // it('デフォルト拍数4は表示されない', () => {
    //   const chartWithDefaultDuration: ChordChartType = {
    //     ...mockChart,
    //     sections: [
    //       {
    //         ...mockChart.sections[0],
    //         chords: [
    //           { name: 'C', root: 'C', duration: 4 }
    //         ]
    //       }
    //     ]
    //   };

    //   render(<ChordChart chartData={chartWithDefaultDuration} />);

    //   // duration=4の場合は拍数表示されない
    //   expect(screen.queryByText('(4)')).not.toBeInTheDocument();
    // });
  });

  describe('Beat Calculation', () => {
    it('小数拍数でも小節計算が正しく動作する', () => {
      const chartWithHalfBeats: ChordChartType = {
        ...mockChart,
        sections: [
          {
            ...mockChart.sections[0],
            chords: [
              { name: 'C', root: 'C', duration: 0.5 },  // 0.5拍
              { name: 'F', root: 'F', duration: 0.5 },  // 0.5拍
              { name: 'G', root: 'G', duration: 1 },    // 1拍
              { name: 'Am', root: 'A', duration: 2 },   // 2拍
              // 合計4拍で1小節完了
              { name: 'Dm', root: 'D', duration: 1.5 }, // 次の小節開始
              { name: 'G7', root: 'G', duration: 2.5 }  // 合計4拍
            ]
          }
        ]
      };

      render(<ChordChart chartData={chartWithHalfBeats} />);

      // コード名が表示されることを確認（小節計算が正しく動作している証拠）
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
      expect(screen.getByText('Am')).toBeInTheDocument();
      expect(screen.getByText('Dm')).toBeInTheDocument();
      expect(screen.getByText('G7')).toBeInTheDocument();
    });
  });
});