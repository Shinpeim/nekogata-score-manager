import React, { useMemo } from 'react';
import type { ChordSection, Chord } from '../types';
import { useResponsiveBars } from '../hooks/useResponsiveBars';
import { splitChordsIntoRows } from '../utils/lineBreakHelpers';

// コード表示幅の設定
const CHORD_WIDTH_CONFIG = {
  MIN_WIDTH_PX: 47, // コード1つの最低表示幅（px）- 36px * 1.3 ≈ 47px
};

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
  const { barsPerRow, config, calculateDynamicLayout } = useResponsiveBars();

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
                // この行にメモがあるかどうかをチェック
                const hasAnyMemoInRow = rowBars.some(b => b.some(chord => chord.memo));
                
                // 各コードの必要幅を先に計算（コードファースト方式）
                const chordWidthsPx = useDynamicWidth ? bar.map(chord => {
                  const chordDuration = chord.duration || 4;
                  
                  // メモの文字数に応じて基本幅を動的に計算
                  let baseWidth = CHORD_WIDTH_CONFIG.MIN_WIDTH_PX;
                  if (chord.memo && chord.memo.trim() !== '') {
                    // メモの文字数に基づいて幅を計算（1文字あたり約10pxとして概算）
                    const memoWidth = chord.memo.length * 10 + 16; // パディング分を考慮
                    baseWidth = Math.max(CHORD_WIDTH_CONFIG.MIN_WIDTH_PX, memoWidth);
                  }
                  
                  // 拍数による調整（拍数が多ければより幅を取る）
                  const durationMultiplier = chordDuration / 4; // 4拍を基準とした倍率
                  return baseWidth * Math.max(durationMultiplier, 1);
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
                          : CHORD_WIDTH_CONFIG.MIN_WIDTH_PX;
                        
                        return (
                          <div 
                            key={chordIndex} 
                            className={`flex flex-col hover:bg-slate-100 cursor-pointer rounded px-0.5 flex-shrink-0 h-full ${chord.memo ? 'justify-center' : hasAnyMemoInRow ? 'justify-start pt-1' : 'justify-center'}`}
                            style={{ 
                              width: `${chordWidthPx}px`,
                              minWidth: `${chordWidthPx}px`
                            }}
                          >
                            <div className={`text-left flex items-center ${chord.memo ? 'flex-1' : hasAnyMemoInRow ? '' : 'flex-1'}`}>
                              <span className="text-xs font-medium leading-none">
                                {(() => {
                                  // コード名をルート音とクオリティに分ける
                                  const match = chord.name.match(/^([A-G][#b♭]?)(.*)/);
                                  if (match) {
                                    const [, root, quality] = match;
                                    return (
                                      <>
                                        <span>{root}</span>
                                        {quality && (
                                          <span className="text-[10px]">{quality}</span>
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
                              <div className="text-left text-[10px] text-slate-600 leading-tight px-0.5 pb-1">
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