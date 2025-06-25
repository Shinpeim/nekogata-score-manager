import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SetListTab from '../SetListTab';
import { useSetListStore } from '../../stores/setListStore';
import { useChartDataStore } from '../../stores/chartDataStore';

// Mock the stores
vi.mock('../../stores/setListStore');
vi.mock('../../stores/chartDataStore');

const mockUseSetListStore = vi.mocked(useSetListStore);
const mockUseChartDataStore = vi.mocked(useChartDataStore);

describe('SetListTab', () => {
  const mockOnChartSelect = vi.fn();
  const mockOnClose = vi.fn();

  const mockCharts = {
    'chart1': {
      id: 'chart1',
      title: 'Song A',
      artist: 'Artist A',
      key: 'C',
      tempo: 120,
      timeSignature: '4/4',
      sections: [],
      tags: [],
      notes: '',
    },
    'chart2': {
      id: 'chart2',
      title: 'Song B',
      artist: 'Artist B',
      key: 'G',
      tempo: 140,
      timeSignature: '4/4',
      sections: [],
      tags: [],
      notes: '',
    },
  };

  const mockSetLists = {
    'setlist1': {
      id: 'setlist1',
      name: 'Live Set 2024',
      chartIds: ['chart1', 'chart2'],
      createdAt: new Date('2024-01-01'),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChartDataStore.mockReturnValue({
      charts: mockCharts,
      currentChartId: null,
      setCharts: vi.fn(),
      setCurrentChart: vi.fn(),
    });
  });

  it('セットリストが選択されていない場合、選択を促すメッセージを表示', () => {
    mockUseSetListStore.mockReturnValue({
      setLists: mockSetLists,
      currentSetListId: null,
      createSetList: vi.fn(),
      deleteSetList: vi.fn(),
      updateSetListOrder: vi.fn(),
      setCurrentSetList: vi.fn(),
      setSetLists: vi.fn(),
      clearSetLists: vi.fn(),
    });

    render(<SetListTab onChartSelect={mockOnChartSelect} />);

    expect(screen.getByText('セットリストを選択してください')).toBeInTheDocument();
  });

  it('セットリストが選択されている場合、楽譜一覧を表示', () => {
    mockUseSetListStore.mockReturnValue({
      setLists: mockSetLists,
      currentSetListId: 'setlist1',
      createSetList: vi.fn(),
      deleteSetList: vi.fn(),
      updateSetListOrder: vi.fn(),
      setCurrentSetList: vi.fn(),
      setSetLists: vi.fn(),
      clearSetLists: vi.fn(),
    });

    render(<SetListTab onChartSelect={mockOnChartSelect} />);

    expect(screen.getByText('2曲')).toBeInTheDocument();
    expect(screen.getByText('Song A')).toBeInTheDocument();
    expect(screen.getByText('Song B')).toBeInTheDocument();
    expect(screen.getByText('(Key: C)')).toBeInTheDocument();
    expect(screen.getByText('Artist: Artist A')).toBeInTheDocument();
  });

  it('楽譜をクリックすると選択ハンドラーが呼ばれる', () => {
    mockUseSetListStore.mockReturnValue({
      setLists: mockSetLists,
      currentSetListId: 'setlist1',
      createSetList: vi.fn(),
      deleteSetList: vi.fn(),
      updateSetListOrder: vi.fn(),
      setCurrentSetList: vi.fn(),
      setSetLists: vi.fn(),
      clearSetLists: vi.fn(),
    });

    render(<SetListTab onChartSelect={mockOnChartSelect} />);

    const chartItem = screen.getByTestId('setlist-chart-item-0');
    fireEvent.click(chartItem);

    expect(mockOnChartSelect).toHaveBeenCalledWith('chart1');
  });

  it('削除された楽譜の場合、適切なメッセージを表示', () => {
    const setListWithDeletedChart = {
      'setlist1': {
        id: 'setlist1',
        name: 'Live Set 2024',
        chartIds: ['chart1', 'deleted-chart'],
        createdAt: new Date('2024-01-01'),
      },
    };

    mockUseSetListStore.mockReturnValue({
      setLists: setListWithDeletedChart,
      currentSetListId: 'setlist1',
      createSetList: vi.fn(),
      deleteSetList: vi.fn(),
      updateSetListOrder: vi.fn(),
      setCurrentSetList: vi.fn(),
      setSetLists: vi.fn(),
      clearSetLists: vi.fn(),
    });

    render(<SetListTab onChartSelect={mockOnChartSelect} />);

    expect(screen.getByText('(削除された楽譜)')).toBeInTheDocument();
  });

  it('モバイル表示で楽譜をクリックすると閉じるハンドラーが呼ばれる', () => {
    // Mock window.matchMedia to return true for mobile
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(max-width: 767px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    mockUseSetListStore.mockReturnValue({
      setLists: mockSetLists,
      currentSetListId: 'setlist1',
      createSetList: vi.fn(),
      deleteSetList: vi.fn(),
      updateSetListOrder: vi.fn(),
      setCurrentSetList: vi.fn(),
      setSetLists: vi.fn(),
      clearSetLists: vi.fn(),
    });

    render(
      <SetListTab 
        onChartSelect={mockOnChartSelect} 
        onClose={mockOnClose}
      />
    );

    const chartItem = screen.getByTestId('setlist-chart-item-0');
    fireEvent.click(chartItem);

    expect(mockOnChartSelect).toHaveBeenCalledWith('chart1');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('順序番号が正しく表示される', () => {
    mockUseSetListStore.mockReturnValue({
      setLists: mockSetLists,
      currentSetListId: 'setlist1',
      createSetList: vi.fn(),
      deleteSetList: vi.fn(),
      updateSetListOrder: vi.fn(),
      setCurrentSetList: vi.fn(),
      setSetLists: vi.fn(),
      clearSetLists: vi.fn(),
    });

    render(<SetListTab onChartSelect={mockOnChartSelect} />);

    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
  });
});