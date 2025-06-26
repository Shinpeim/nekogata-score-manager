import React, { useMemo } from 'react';
import type { ChordSection, Chord } from '../types';
import { useResponsiveBars } from '../hooks/useResponsiveBars';
import { splitChordsIntoRows } from '../utils/lineBreakHelpers';
import { chordToDegreeWithQuality, isValidKey } from '../utils/degreeNames';

// コード表示幅の設定
const getChordMinWidth = (fontSize: number): number => {
  // フォントサイズに基づいた最低幅（14px時に47px）
  return Math.round((fontSize / 14) * 47);
};

interface ChordGridRendererProps {
  section: ChordSection;
  timeSignature: string;
  chartKey?: string; // 楽曲のキー（ディグリー表示用）
  showDegreeNames?: boolean; // ディグリーネームを表示するか
  useDynamicWidth?: boolean; // 動的幅計算を使用するかのフラグ
  fontSize?: number; // フォントサイズ（px）
}

const ChordGridRenderer: React.FC<ChordGridRendererProps> = ({ 
  section, 
  timeSignature, 
  chartKey,
  showDegreeNames = false,
  useDynamicWidth = true, // デフォルトで動的幅計算を使用
  fontSize = 14 // デフォルトフォントサイズ
}) => {
  const { barsPerRow, config, calculateDynamicLayout, getChordWidth } = useResponsiveBars();

  const timeSignatureBeats = timeSignature ? parseInt(timeSignature.split('/')[0]) : 4;
  const beatsPerBar = section.beatsPerBar && section.beatsPerBar !== 4 ? section.beatsPerBar : timeSignatureBeats;
  
  // 小節データの前処理（改行マーカーを考慮してコードを小節に分割）
  const allBars = useMemo(() => {
    const bars: Chord[][] = [];
    let currentBar: Chord[] = [];
    let currentBeats = 0;
    
    for (const chord of section.chords) {
      if (chord.isLineBreak === true) {
        // 改行マーカーに出会ったら現在の小節を終了し、強制改行
        if (currentBar.length > 0) {
          bars.push([...currentBar]);
          currentBar = [];
          currentBeats = 0;
        }
        // 改行マーカーを示す特別な小節を追加
        bars.push([]);
        continue;
      }
      
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
      return calculateDynamicLayout(allBars, fontSize);
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
  }, [useDynamicWidth, allBars, calculateDynamicLayout, section.chords, barsPerRow, beatsPerBar, fontSize]);
  
  return (
    <>
      {processedRows.map((rowBars, rowIndex) => (
        <div key={rowIndex}>
          <div className="relative bg-white">
            <div className="flex min-h-8 py-0">
              {rowBars.map((bar, barIndex) => {
                // この行にメモがあるかどうかをチェック
                const hasAnyMemoInRow = rowBars.some(b => b.some(chord => chord.memo));
                
                // 各コードの必要幅を先に計算（コードファースト方式）
                const chordWidthsPx = useDynamicWidth ? bar.map(chord => {
                  // フォントサイズに基づいた動的幅を計算
                  return getChordWidth(chord, fontSize);
                }) : undefined;
                
                // 小節の幅は全コード幅の合計 + パディング（動的幅計算の場合）
                const barWidth = useDynamicWidth && chordWidthsPx 
                  ? chordWidthsPx.reduce((sum, width) => sum + width, 0) + 8
                  : undefined;
                
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
                      <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-slate-600"></div>
                    )}
                    
                    <div className="px-0.5 py-0.5 h-full flex items-stretch" style={{ minHeight: '36px' }}>
                      {bar.map((chord, chordIndex) => {
                        // 動的幅計算の場合は外側で計算済みの幅を使用、従来の場合は基本幅
                        const chordWidthPx = useDynamicWidth && chordWidthsPx 
                          ? chordWidthsPx[chordIndex] 
                          : getChordMinWidth(fontSize);
                        
                        return (
                          <div 
                            key={chordIndex} 
                            className={`flex flex-col hover:bg-slate-100 cursor-pointer rounded px-0.5 flex-shrink-0 h-full ${chord.memo ? 'justify-center' : hasAnyMemoInRow ? 'justify-start pt-1' : 'justify-center'}`}
                            style={{ 
                              width: `${chordWidthPx}px`,
                              minWidth: `${chordWidthPx}px`
                            }}
                          >
                            <div className={`text-left flex flex-col ${chord.memo ? 'flex-1' : hasAnyMemoInRow ? '' : 'flex-1'}`}>
                              {showDegreeNames && chartKey && isValidKey(chartKey) && (
                                <div className="text-[9px] text-slate-400 leading-tight mb-0.5">
                                  {chordToDegreeWithQuality(chord, chartKey)}
                                </div>
                              )}
                              <span className="font-medium leading-none" style={{ fontSize: `${fontSize}px` }}>
                                {(() => {
                                  // コード名をルート音とクオリティに分ける
                                  const match = chord.name.match(/^([A-G][#b♭]?)(.*)/);
                                  if (match) {
                                    const [, root, quality] = match;
                                    return (
                                      <>
                                        <span>{root}</span>
                                        {quality && (
                                          <span style={{ fontSize: `${fontSize * 0.8}px` }}>{quality}</span>
                                        )}
                                      </>
                                    );
                                  }
                                  return chord.name;
                                })()}
                                {chord.base && (
                                  <span className="text-slate-500">/{chord.base}</span>
                                )}
                              </span>
                            </div>
                            {chord.memo && (
                              <div className="text-left text-slate-600 leading-tight px-0.5 pb-1" style={{ fontSize: `${fontSize}px` }}>
                                {chord.memo}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {barIndex === rowBars.length - 1 && (
                      <div className="absolute right-0 top-1 bottom-1 w-0.5 bg-slate-600"></div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-slate-600"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ChordGridRenderer;