import React, { useMemo } from 'react';
import type { ChordSection, Chord } from '../types';
import { useResponsiveBars } from '../hooks/useResponsiveBars';
import { splitChordsIntoRows } from '../utils/lineBreakHelpers';

// コード表示幅の設定
const CHORD_WIDTH_CONFIG = {
  MIN_WIDTH_PX: 47, // コード1つの最低表示幅（px）- 36px * 1.3 ≈ 47px
} as const;

interface ChordGridRendererProps {
  section: ChordSection;
  timeSignature: string;
  useDynamicWidth?: boolean; // 動的幅計算を使用するかのフラグ
}

const ChordGridRenderer: React.FC<ChordGridRendererProps> = ({ 
  section, 
  timeSignature, 
  useDynamicWidth = true // デフォルトで動的幅計算を使用
}) => {
  const { barsPerRow, config, calculateDynamicLayout, getBarWidth } = useResponsiveBars();

  const timeSignatureBeats = timeSignature ? parseInt(timeSignature.split('/')[0]) : 4;
  const beatsPerBar = section.beatsPerBar && section.beatsPerBar !== 4 ? section.beatsPerBar : timeSignatureBeats;
  
  // 小節データの前処理（コードを小節に分割）
  const allBars = useMemo(() => {
    const bars: Chord[][] = [];
    let currentBar: Chord[] = [];
    let currentBeats = 0;
    
    for (const chord of section.chords) {
      if (chord.isLineBreak === true) continue;
      
      const chordDuration = chord.duration || 4;
      
      if (currentBeats + chordDuration <= beatsPerBar) {
        currentBar.push(chord);
        currentBeats += chordDuration;
      } else {
        if (currentBar.length > 0) {
          bars.push([...currentBar]);
        }
        currentBar = [chord];
        currentBeats = chordDuration;
      }
      
      if (currentBeats === beatsPerBar) {
        bars.push([...currentBar]);
        currentBar = [];
        currentBeats = 0;
      }
    }
    
    if (currentBar.length > 0) {
      bars.push(currentBar);
    }
    
    return bars;
  }, [section.chords, beatsPerBar]);

  // 動的幅計算または従来の行分割を選択
  const processedRows = useMemo(() => {
    if (useDynamicWidth) {
      // 動的幅計算を使用した行分割
      return calculateDynamicLayout(allBars);
    } else {
      // 従来の固定幅行分割
      const rows = splitChordsIntoRows(section.chords, barsPerRow, beatsPerBar);
      return rows.map(rowChords => {
        const bars: Chord[][] = [];
        let currentBar: Chord[] = [];
        let currentBeats = 0;
        
        for (const chord of rowChords) {
          if (chord.isLineBreak === true) continue;
          
          const chordDuration = chord.duration || 4;
          
          if (currentBeats + chordDuration <= beatsPerBar) {
            currentBar.push(chord);
            currentBeats += chordDuration;
          } else {
            if (currentBar.length > 0) {
              bars.push([...currentBar]);
            }
            currentBar = [chord];
            currentBeats = chordDuration;
          }
          
          if (currentBeats === beatsPerBar) {
            bars.push([...currentBar]);
            currentBar = [];
            currentBeats = 0;
          }
        }
        
        if (currentBar.length > 0) {
          bars.push(currentBar);
        }
        
        return bars;
      });
    }
  }, [useDynamicWidth, allBars, calculateDynamicLayout, section.chords, barsPerRow, beatsPerBar]);
  
  return (
    <>
      {processedRows.map((rowBars, rowIndex) => (
        <div key={rowIndex}>
          <div className="relative bg-white">
            <div className="flex min-h-8 py-0">
              {rowBars.map((bar, barIndex) => {
                // 動的幅計算を使用する場合は実際の幅を計算、そうでなければ従来通り
                const barWidth = useDynamicWidth ? getBarWidth(bar, beatsPerBar) : undefined;
                
                return (
                  <div 
                    key={barIndex} 
                    className="relative"
                    style={useDynamicWidth ? {
                      width: `${barWidth}px`,
                      minWidth: `${barWidth}px`,
                      flexShrink: 0
                    } : { 
                      flexGrow: 1,
                      flexBasis: 0,
                      maxWidth: `${config.MAX_WIDTH}px`
                    }}
                  >
                    {barIndex > 0 && (
                      <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-slate-600"></div>
                    )}
                    
                    <div className="px-0.5 pt-2.5 pb-0.5 h-full flex items-start">
                      {(() => {
                        // 小節の実際の幅を取得（動的幅計算の結果）
                        const barWidthPx = useDynamicWidth ? getBarWidth(bar, beatsPerBar) : 200; // フォールバック値
                        
                        // 各コードの幅を比例配分で計算（小節幅が十分確保されているため）
                        const chordWidthsPx = bar.map(chord => {
                          const chordDuration = chord.duration || 4;
                          const availableWidth = barWidthPx - 8; // パディング分を除く
                          const proportionalWidth = (chordDuration / beatsPerBar) * availableWidth;
                          
                          // 最低幅は保証
                          return Math.max(proportionalWidth, CHORD_WIDTH_CONFIG.MIN_WIDTH_PX);
                        });
                        
                        return bar.map((chord, chordIndex) => {
                          const chordWidthPx = chordWidthsPx[chordIndex];
                          
                          return (
                            <div 
                              key={chordIndex} 
                              className="flex flex-col justify-start hover:bg-slate-100 cursor-pointer rounded px-0.5 flex-shrink-0"
                              style={{ 
                                width: `${chordWidthPx}px`,
                                minWidth: `${CHORD_WIDTH_CONFIG.MIN_WIDTH_PX}px`
                              }}
                            >
                              <div className="text-left flex items-center">
                                <span className="text-xs font-medium leading-none">
                                  {chord.name}
                                  {chord.base && (
                                    <span className="text-slate-500">/{chord.base}</span>
                                  )}
                                </span>
                              </div>
                              {chord.memo && (
                                <div className="text-left text-[10px] text-slate-600 leading-tight">
                                  {chord.memo}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                    
                    {barIndex === rowBars.length - 1 && (
                      <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-slate-600"></div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-slate-600"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ChordGridRenderer;