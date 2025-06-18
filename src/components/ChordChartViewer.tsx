import React from 'react';
import type { ChordChart as ChordChartType } from '../types';
import BpmIndicator from './BpmIndicator';
import ChordGridRenderer from './ChordGridRenderer';
import ChordChartActions from './ChordChartActions';
import { KEY_DISPLAY_NAMES } from '../utils/musicConstants';

interface ChordChartViewerProps {
  chart: ChordChartType;
  currentChartId: string | null;
  onEdit: () => void;
}

const ChordChartViewer: React.FC<ChordChartViewerProps> = ({ chart, currentChartId, onEdit }) => {
  return (
    <div className="h-full bg-white overflow-y-auto" data-testid="chart-viewer">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2" data-testid="chart-title">{chart.title}</h2>
          <div className="flex flex-wrap gap-4 text-slate-600">
            <span data-testid="chart-artist">{chart.artist}</span>
            <span data-testid="chart-key">キー: {KEY_DISPLAY_NAMES[chart.key] || chart.key}</span>
            {chart.tempo && <BpmIndicator bpm={chart.tempo} />}
            <span data-testid="chart-time-signature">拍子: {chart.timeSignature}</span>
          </div>
          {chart.tags && chart.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2" data-testid="chart-tags">
              {chart.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-slate-100 text-slate-800 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-lg p-3 sm:p-6" data-testid="chart-content">
          {chart.sections && chart.sections.length > 0 ? (
            chart.sections.map((section) => (
              <div key={section.id} className="mb-8 last:mb-0" data-testid={`section-${section.id}`}>
                {section.name && (
                  <h3 className="text-sm font-medium text-slate-600 mb-1" data-testid={`section-name-${section.id}`}>
                    【{section.name}】
                  </h3>
                )}
                <ChordGridRenderer section={section} timeSignature={chart.timeSignature} />
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8" data-testid="empty-sections">
              <p>セクションがありません</p>
              <p className="text-sm mt-2">コード譜を編集してセクションを追加してください</p>
            </div>
          )}
        </div>

        {chart.notes && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200" data-testid="chart-notes">
            <h4 className="font-semibold text-slate-800 mb-2">メモ</h4>
            <p className="text-slate-700">{chart.notes}</p>
          </div>
        )}

        <ChordChartActions 
          chart={chart} 
          currentChartId={currentChartId} 
          onEdit={onEdit} 
        />
      </div>
    </div>
  );
};

export default ChordChartViewer;