import React from 'react';
import { useSetListManagement } from '../hooks/useSetListManagement';
import { useChartDataStore } from '../stores/chartDataStore';
import SetListSelector from './SetListSelector';

interface SetListTabProps {
  onChartSelect: (chartId: string) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const SetListTab: React.FC<SetListTabProps> = ({
  onChartSelect,
  isMobile = false,
  onClose,
}) => {
  const { setLists, currentSetListId } = useSetListManagement();
  const { charts } = useChartDataStore();

  const currentSetList = currentSetListId ? setLists[currentSetListId] : null;

  const handleChartClick = (chartId: string) => {
    onChartSelect(chartId);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const getChartById = (chartId: string) => charts[chartId];

  return (
    <div className={isMobile ? "px-4" : "p-4"}>
      <div className="mb-4">
        <SetListSelector />
      </div>

      {currentSetList ? (
        <div className="space-y-2">
          <div className="text-xs text-slate-500 mb-3">
            {currentSetList.chartIds.length}曲
          </div>
          {currentSetList.chartIds.map((chartId, index) => {
            const chart = getChartById(chartId);
            if (!chart) {
              return (
                <div key={chartId} className="p-3 bg-slate-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 min-w-[24px]">
                      {index + 1}.
                    </span>
                    <div className="text-sm text-slate-400">
                      (削除された楽譜)
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={chartId}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                onClick={() => handleChartClick(chartId)}
                data-testid={`setlist-chart-item-${index}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 min-w-[24px] font-medium">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-slate-900">
                      {chart.title}
                      {chart.key && (
                        <span className="ml-2 text-xs text-slate-500">
                          (Key: {chart.key})
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Artist: {chart.artist}
                    </p>
                  </div>
                  <div className="text-xs text-slate-400">
                    ⋮⋮
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-sm text-slate-500">
            セットリストを選択してください
          </div>
        </div>
      )}
    </div>
  );
};

export default SetListTab;