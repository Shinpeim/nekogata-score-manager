import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ChordChart } from '../types';

interface SetListChartItemProps {
  /** セットリスト内のインデックス */
  index: number;
  /** 楽譜データ */
  chart: ChordChart | null;
  /** 楽譜ID（削除された楽譜の場合はchartがnullでもIDは残る） */
  chartId: string;
  /** 楽譜クリック時のハンドラ */
  onChartClick: (chartId: string) => void;
}

const SetListChartItem: React.FC<SetListChartItemProps> = ({
  index,
  chart,
  chartId,
  onChartClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: chartId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 削除された楽譜の場合
  if (!chart) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`py-3 pr-3 pl-1 bg-slate-50 rounded-md ${isDragging ? 'opacity-50' : ''}`}
        data-testid={`setlist-chart-item-${index}`}
      >
        <div className="flex items-center gap-1">
          <div
            className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 w-6 h-full flex items-center justify-center"
            {...attributes}
            {...listeners}
          >
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>
          <span className="text-xs text-slate-400 min-w-[24px]">
            {index + 1}.
          </span>
          <div className="text-sm text-slate-400 flex-1">
            (削除された楽譜)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`py-3 pr-3 pl-1 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors cursor-pointer ${
        isDragging ? 'opacity-50 bg-slate-200' : ''
      }`}
      onClick={() => onChartClick(chartId)}
      data-testid={`setlist-chart-item-${index}`}
    >
      <div className="flex items-center gap-1">
        <div
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-500 w-6 h-full flex items-center justify-center"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()} // ドラッグハンドルクリック時に楽譜選択を防ぐ
        >
          <svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>
        <span className="text-xs text-slate-500 min-w-[24px] font-medium">
          {index + 1}.
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-slate-900">
            {chart.title}
            {chart.key && chart.key.trim() && (
              <span className="ml-2 text-xs text-slate-500">
                (Key: {chart.key})
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Artist: {chart.artist}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetListChartItem;