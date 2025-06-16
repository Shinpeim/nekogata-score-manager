import React from 'react';
import type { ChordSection, Chord } from '../types';
import { useResponsiveBars } from '../hooks/useResponsiveBars';
import { splitChordsIntoRows } from '../utils/lineBreakHelpers';

interface ChordGridRendererProps {
  section: ChordSection;
  timeSignature: string;
}

const ChordGridRenderer: React.FC<ChordGridRendererProps> = ({ section, timeSignature }) => {
  const { barsPerRow, config } = useResponsiveBars();

  const timeSignatureBeats = timeSignature ? parseInt(timeSignature.split('/')[0]) : 4;
  const beatsPerBar = section.beatsPerBar && section.beatsPerBar !== 4 ? section.beatsPerBar : timeSignatureBeats;
  
  const rows = splitChordsIntoRows(section.chords, barsPerRow, beatsPerBar);
  
  const processedRows = rows.map(rowChords => {
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
  
  return (
    <>
      {processedRows.map((rowBars, rowIndex) => (
        <div key={rowIndex}>
          <div className="relative bg-white">
            <div className="flex min-h-12 py-1">
              {rowBars.map((bar, barIndex) => (
                <div 
                  key={barIndex} 
                  className="relative"
                  style={{ 
                    flexGrow: 1,
                    flexBasis: 0,
                    maxWidth: `${config.MAX_WIDTH}px`
                  }}
                >
                  {barIndex > 0 && (
                    <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-slate-600"></div>
                  )}
                  
                  <div className="px-1 py-1 h-full flex items-center">
                    {bar.map((chord, chordIndex) => {
                      const chordDuration = chord.duration || 4;
                      const widthPercentage = (chordDuration / beatsPerBar) * 100;
                      
                      return (
                        <div 
                          key={chordIndex} 
                          className="flex flex-col justify-center hover:bg-slate-100 cursor-pointer rounded px-1"
                          style={{ width: `${widthPercentage}%` }}
                        >
                          <div className="text-left flex items-center">
                            <span className="text-xs font-semibold">
                              {chord.name}
                              {chord.base && (
                                <span className="text-slate-500">/{chord.base}</span>
                              )}
                            </span>
                          </div>
                          {chord.memo && (
                            <div className="text-left text-xs text-slate-600 leading-tight mt-0.5">
                              {chord.memo}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {barIndex === rowBars.length - 1 && (
                    <div className="absolute right-0 top-3 bottom-3 w-0.5 bg-slate-600"></div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-slate-600"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ChordGridRenderer;