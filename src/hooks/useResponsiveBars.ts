import { useState, useEffect, useCallback } from 'react';
import type { Chord } from '../types';
import { calculateBarWidth, DYNAMIC_BAR_WIDTH_CONFIG } from '../utils/dynamicBarWidth';

// レガシー互換性のための設定（既存コードとの互換性を保つ）
const BAR_WIDTH_CONFIG = {
  MIN_WIDTH: 120, // 最小幅（px）
  MAX_WIDTH: 340, // 最大幅（px）
  PADDING: 32,    // 左右のパディング合計（px）- スペース効率向上のため削減
} as const;

/**
 * 画面幅に応じて1行に表示する小節数を計算するカスタムフック
 * 動的幅計算にも対応
 */
export const useResponsiveBars = () => {
  const [barsPerRow, setBarsPerRow] = useState(8); // デフォルト値

  const calculateBarsPerRow = useCallback(() => {
    // コンテナの幅を取得（ウィンドウ幅からパディングを引く）
    const containerWidth = window.innerWidth - BAR_WIDTH_CONFIG.PADDING;
    
    // 最小幅で入る最大小節数を計算（これを基準にする）
    const maxBarsWithMinWidth = Math.floor(containerWidth / BAR_WIDTH_CONFIG.MIN_WIDTH);
    
    // 実用的な範囲に制限（1〜16小節）
    const finalBars = Math.max(1, Math.min(16, maxBarsWithMinWidth));
    
    setBarsPerRow(finalBars);
  }, []);

  /**
   * 動的幅計算モード: 小節ごとの実際のコンテンツに基づいて行分割を計算
   */
  const calculateDynamicLayout = useCallback((bars: Chord[][]): Chord[][][] => {
    const containerWidth = window.innerWidth - BAR_WIDTH_CONFIG.PADDING;
    const rows: Chord[][][] = [];
    let currentRow: Chord[][] = [];
    let currentRowWidth = 0;

    for (const bar of bars) {
      const barWidth = calculateBarWidth(bar, 4); // 拍数パラメータを追加
      
      // 現在の行に追加できるかチェック
      if (currentRow.length === 0 || currentRowWidth + barWidth <= containerWidth) {
        currentRow.push(bar);
        currentRowWidth += barWidth;
      } else {
        // 新しい行を開始
        if (currentRow.length > 0) {
          rows.push([...currentRow]);
        }
        currentRow = [bar];
        currentRowWidth = barWidth;
      }
    }
    
    // 最後の行を追加
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  }, []);

  /**
   * 小節の動的幅を計算
   */
  const getBarWidth = useCallback((chords: Chord[], beatsPerBar: number = 4): number => {
    return calculateBarWidth(chords, beatsPerBar);
  }, []);

  useEffect(() => {
    // 初期計算
    calculateBarsPerRow();

    // リサイズイベントリスナーを追加
    let timeoutId: number;
    const handleResize = () => {
      // デバウンス（100ms）
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(calculateBarsPerRow, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [calculateBarsPerRow]);

  return {
    barsPerRow,
    config: BAR_WIDTH_CONFIG,
    // 新しい動的幅計算機能
    dynamicConfig: DYNAMIC_BAR_WIDTH_CONFIG,
    calculateDynamicLayout,
    getBarWidth
  };
};