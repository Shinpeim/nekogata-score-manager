import React from 'react';
import type { ChordChart as ChordChartType, ChordSection, Chord } from '../types';
import { sampleCharts } from '../data/sampleCharts';

interface ChordChartProps {
  chartData?: ChordChartType;
}

const ChordChart: React.FC<ChordChartProps> = ({ chartData = sampleCharts[0] }) => {
  const renderChordGrid = (section: ChordSection) => {
    const beatsPerBar = section.beatsPerBar || 4;
    const barsPerRow = 8;
    
    // コードを小節に分割
    const bars: Chord[][] = [];
    let currentBar: Chord[] = [];
    let currentBeats = 0;
    
    for (const chord of section.chords) {
      const chordDuration = chord.duration || 4;
      
      if (currentBeats + chordDuration <= beatsPerBar) {
        currentBar.push(chord);
        currentBeats += chordDuration;
      } else {
        // 現在の小節を完了し、新しい小節を開始
        if (currentBar.length > 0) {
          bars.push([...currentBar]);
        }
        currentBar = [chord];
        currentBeats = chordDuration;
      }
      
      // 小節が完了した場合
      if (currentBeats === beatsPerBar) {
        bars.push([...currentBar]);
        currentBar = [];
        currentBeats = 0;
      }
    }
    
    // 最後の未完了の小節を追加
    if (currentBar.length > 0) {
      bars.push(currentBar);
    }
    
    // 8小節ずつの行に分割
    const rows = [];
    for (let i = 0; i < bars.length; i += barsPerRow) {
      rows.push(bars.slice(i, i + barsPerRow));
    }
    
    return rows.map((row, rowIndex) => (
      <div key={rowIndex} className="mb-8">
        {/* 小節番号の行 */}
        <div className="flex mb-1">
          {row.map((bar, barIndex) => (
            <div key={barIndex} className="flex-1 text-center">
              <span className="text-xs text-gray-400">
                {rowIndex * barsPerRow + barIndex + 1}
              </span>
            </div>
          ))}
        </div>
        
        {/* コード表示エリア */}
        <div className="relative bg-white">
          {/* 下の罫線 */}
          <div className="absolute bottom-8 left-0 right-0 h-px bg-gray-400"></div>
          
          {/* 小節の内容 */}
          <div className="flex min-h-20 py-2">
            {row.map((bar, barIndex) => (
              <div key={barIndex} className="flex-1 relative">
                {/* 小節線（縦線） */}
                {barIndex > 0 && (
                  <div className="absolute left-0 top-6 bottom-6 w-px bg-gray-400"></div>
                )}
                
                {/* コード表示 */}
                <div className="px-1 py-2 h-full flex items-center">
                  {bar.map((chord, chordIndex) => {
                    const chordDuration = chord.duration || 4;
                    const widthPercentage = (chordDuration / beatsPerBar) * 100;
                    
                    return (
                      <div 
                        key={chordIndex} 
                        className="flex items-center hover:bg-blue-50 cursor-pointer rounded px-1"
                        style={{ width: `${widthPercentage}%` }}
                      >
                        <div className="text-left flex items-center">
                          <span className="text-xs font-semibold">{chord.name}</span>
                          {chord.duration && chord.duration !== 4 && (
                            <span className="text-xs text-gray-500 ml-1">({chord.duration})</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* 右端の小節線 */}
                {barIndex === row.length - 1 && (
                  <div className="absolute right-0 top-6 bottom-6 w-px bg-gray-400"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* 左右の境界線 */}
          <div className="absolute left-0 top-8 bottom-8 w-px bg-gray-400"></div>
          <div className="absolute right-0 top-8 bottom-8 w-px bg-gray-400"></div>
        </div>
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