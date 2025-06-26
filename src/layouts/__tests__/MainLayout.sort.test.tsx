import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MainLayout from '../MainLayout';

// useChartManagementのモック
vi.mock('../../hooks/useChartManagement', () => ({
  useChartManagement: () => ({
    charts: {
      'chart1': {
        id: 'chart1',
        title: 'Zenith',
        artist: 'Artist 1',
        key: 'C',
        tempo: 120,
        timeSignature: '4/4',
        sections: [],
        notes: '',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-03T00:00:00.000Z'),
      },
      'chart2': {
        id: 'chart2',
        title: 'Apple',
        artist: 'Artist 2',
        key: 'G',
        tempo: 100,
        timeSignature: '4/4',
        sections: [],
        notes: '',
        createdAt: new Date('2023-01-02T00:00:00.000Z'),
        updatedAt: new Date('2023-01-04T00:00:00.000Z'),
      },
      'chart3': {
        id: 'chart3',
        title: 'Morning',
        artist: 'Artist 3',
        key: 'D',
        tempo: 90,
        timeSignature: '3/4',
        sections: [],
        notes: '',
        createdAt: new Date('2023-01-03T00:00:00.000Z'),
        updatedAt: new Date('2023-01-02T00:00:00.000Z'),
      },
      'chart4': {
        id: 'chart4',
        title: 'あいうえお',
        artist: 'Artist 4',
        key: 'A',
        tempo: 140,
        timeSignature: '4/4',
        sections: [],
        notes: '',
        createdAt: new Date('2023-01-04T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z'),
      },
      'chart5': {
        id: 'chart5',
        title: 'かきくけこ',
        artist: 'Artist 5',
        key: 'E',
        tempo: 110,
        timeSignature: '4/4',
        sections: [],
        notes: '',
        createdAt: new Date('2023-01-05T00:00:00.000Z'),
        updatedAt: new Date('2023-01-05T00:00:00.000Z'),
      },
    },
    currentChartId: 'chart1',
    setCurrentChart: vi.fn(),
    createNewChart: vi.fn(),
    addChart: vi.fn(),
    loadFromStorage: vi.fn(),
    deleteMultipleCharts: vi.fn(),
  }),
}));

// ScoreExplorerコンポーネントのモック（チャートリストを受け取って表示）
vi.mock('../ScoreExplorer', () => ({
  default: ({ charts }: { charts: Array<{ id: string; title: string }> }) => (
    <div data-testid="score-explorer">
      <div data-testid="chart-list">
        {charts.map((chart) => (
          <div key={chart.id} data-testid={`chart-${chart.id}`}>
            {chart.title}
          </div>
        ))}
      </div>
    </div>
  ),
}));

// その他のコンポーネントのモック
vi.mock('../Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('../../components/ChordChartForm', () => ({
  default: () => null,
}));

vi.mock('../../components/ImportDialog', () => ({
  default: () => null,
}));

vi.mock('../../components/ExportDialog', () => ({
  default: () => null,
}));

describe('MainLayout - Chart Sorting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sort charts by title in ascending order', () => {
    render(
      <MainLayout explorerOpen={true}>
        <div>Content</div>
      </MainLayout>
    );

    const chartList = screen.getByTestId('chart-list');
    const chartElements = chartList.children;

    // 曲名の昇順でソートされているか確認
    expect(chartElements[0]).toHaveTextContent('Apple');
    expect(chartElements[1]).toHaveTextContent('Morning');
    expect(chartElements[2]).toHaveTextContent('Zenith');
    expect(chartElements[3]).toHaveTextContent('あいうえお');
    expect(chartElements[4]).toHaveTextContent('かきくけこ');
  });

  it('should sort charts with Japanese titles correctly', () => {
    render(
      <MainLayout explorerOpen={true}>
        <div>Content</div>
      </MainLayout>
    );

    const chartList = screen.getByTestId('chart-list');
    const chartElements = chartList.children;

    // 日本語タイトルも正しくソートされているか確認
    // localeCompare('ja')を使用しているため、ひらがなは英語の後に来る
    expect(chartElements[3]).toHaveTextContent('あいうえお');
    expect(chartElements[4]).toHaveTextContent('かきくけこ');
  });

  it('should maintain sort order regardless of updatedAt dates', () => {
    render(
      <MainLayout explorerOpen={true}>
        <div>Content</div>
      </MainLayout>
    );

    const chartList = screen.getByTestId('chart-list');
    const chartElements = chartList.children;

    // updatedAtの順番に関わらず、title順でソートされていることを確認
    // chart2 (Apple) が最新の更新日時だが、最初に表示される
    expect(chartElements[0]).toHaveTextContent('Apple');
    
    // chart4 (あいうえお) が最も古い更新日時だが、日本語として正しい位置に表示される
    const aiueoIndex = Array.from(chartElements).findIndex(el => el.textContent === 'あいうえお');
    expect(aiueoIndex).toBeGreaterThan(2); // 英語タイトルの後に表示される
  });
});