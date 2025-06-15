import type { ChordChart } from '../types';

const DEFAULT_VERSION = '1.0.0';

// 既存データの移行処理：拍子に応じてbeatsPerBarを修正 + version情報追加
export const migrateChartData = (chart: ChordChart): ChordChart => {
  const beatsPerBar = chart.timeSignature ? parseInt(chart.timeSignature.split('/')[0]) : 4;
  
  return {
    ...chart,
    sections: chart.sections?.map(section => ({
      ...section,
      // beatsPerBarが未定義、または4拍以外の拍子で4拍になっている場合は修正
      beatsPerBar: (!section.beatsPerBar || (beatsPerBar !== 4 && section.beatsPerBar === 4)) ? beatsPerBar : section.beatsPerBar
    })) || [],
    // notesが未設定の場合は空文字で初期化
    notes: chart.notes ?? '',
    // version情報が未設定の場合はデフォルト値を設定
    version: chart.version || DEFAULT_VERSION
  };
};