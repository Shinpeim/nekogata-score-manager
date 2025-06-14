import React from 'react';
import type { ChordChart as ChordChartType, ChordSection } from '../types';
import { sampleCharts } from '../data/sampleCharts';

interface ChordChartProps {
  chartData?: ChordChartType;
}

const ChordChart: React.FC<ChordChartProps> = ({ chartData = sampleCharts[0] }) => {
  const renderChordGrid = (section: ChordSection) => {
    const chordsPerRow = 4;
    const chordRows = [];
    
    for (let i = 0; i < section.chords.length; i += chordsPerRow) {
      const rowChords = section.chords.slice(i, i + chordsPerRow);
      chordRows.push(rowChords);
    }

    return chordRows.map((row, rowIndex) => (
      <div key={rowIndex} className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
        {row.map((chord, chordIndex) => (
          <div key={chordIndex} className="text-center p-2 sm:p-4 bg-white rounded border-2 border-gray-200 hover:border-blue-300 cursor-pointer">
            <span className="text-base sm:text-lg font-semibold">{chord.name}</span>
            {chord.duration && chord.duration !== 4 && (
              <div className="text-xs text-gray-500 mt-1">{chord.duration}拍</div>
            )}
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="p-6">
        {/* Chart Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{chartData.title}</h2>
          <div className="flex flex-wrap gap-4 text-gray-600">
            <span>{chartData.artist}</span>
            <span>キー: {chartData.key}</span>
            {chartData.tempo && <span>テンポ: {chartData.tempo} BPM</span>}
            <span>拍子: {chartData.timeSignature}</span>
          </div>
          {chartData.tags && chartData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {chartData.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Chart Content */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
          {chartData.sections.map((section) => (
            <div key={section.id} className="mb-8 last:mb-0">
              {section.name && (
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
                  {section.name}
                </h3>
              )}
              {renderChordGrid(section)}
            </div>
          ))}
        </div>

        {chartData.notes && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-gray-800 mb-2">メモ</h4>
            <p className="text-gray-700">{chartData.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            編集
          </button>
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium">
            複製
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            削除
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChordChart;