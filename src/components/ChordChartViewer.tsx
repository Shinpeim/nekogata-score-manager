import React, { useState } from 'react';
import type { ChordChart as ChordChartType } from '../types';
import BpmIndicator from './BpmIndicator';
import ChordGridRenderer from './ChordGridRenderer';
import { KEY_DISPLAY_NAMES } from '../utils/musicConstants';

interface ChordChartViewerProps {
  chart: ChordChartType;
  currentChartId: string | null;
  onEdit?: () => void;
}

const ChordChartViewer: React.FC<ChordChartViewerProps> = ({ chart }) => {
  const [showDegreeNames, setShowDegreeNames] = useState(false);

  return (
    <div className="h-full bg-white overflow-y-auto" data-testid="chart-viewer">
      <div className="p-2">
        <div className="mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900" data-testid="chart-title">{chart.title}</h2>
            <span className="text-sm text-slate-600" data-testid="chart-artist">{chart.artist}</span>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span data-testid="chart-key">キー: {KEY_DISPLAY_NAMES[chart.key] || chart.key}</span>
              {chart.tempo && <BpmIndicator bpm={chart.tempo} />}
              <span data-testid="chart-time-signature">拍子: {chart.timeSignature}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-slate-700">ディグリー表示</span>
                <div
                  onClick={() => setShowDegreeNames(!showDegreeNames)}
                  className={`flex items-center rounded-full p-0.5 w-11 relative cursor-pointer transition-all duration-150 ${
                    showDegreeNames
                      ? 'bg-[#85B0B7] hover:bg-[#6B9CA5]'
                      : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                  title={showDegreeNames ? 'ディグリー表示を無効にする' : 'ディグリー表示を有効にする'}
                  data-testid="degree-names-toggle"
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    showDegreeNames ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-1" data-testid="chart-content">
          {chart.sections && chart.sections.length > 0 ? (
            chart.sections.map((section) => (
              <div key={section.id} className="mb-1 last:mb-0" data-testid={`section-${section.id}`}>
                {section.name && (
                  <h3 className="text-xs font-medium text-slate-600 mb-0.5" data-testid={`section-name-${section.id}`}>
                    【{section.name}】
                  </h3>
                )}
                <ChordGridRenderer 
                  section={section} 
                  timeSignature={chart.timeSignature} 
                  chartKey={chart.key} 
                  showDegreeNames={showDegreeNames} 
                />
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
          <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200" data-testid="chart-notes">
            <h4 className="text-sm font-semibold text-slate-800 mb-1">メモ</h4>
            <p className="text-sm text-slate-700">{chart.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChordChartViewer;