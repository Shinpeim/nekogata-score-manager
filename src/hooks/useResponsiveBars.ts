import { useState, useEffect, useCallback } from 'react';

// 小節の幅の設定
const BAR_WIDTH_CONFIG = {
  MIN_WIDTH: 120, // 最小幅（px）
  MAX_WIDTH: 200, // 最大幅（px）
  PADDING: 48,    // 左右のパディング合計（px）
} as const;

/**
 * 画面幅に応じて1行に表示する小節数を計算するカスタムフック
 */
export const useResponsiveBars = () => {
  const [barsPerRow, setBarsPerRow] = useState(8); // デフォルト値

  const calculateBarsPerRow = useCallback(() => {
    // コンテナの幅を取得（ウィンドウ幅からパディングを引く）
    const containerWidth = window.innerWidth - BAR_WIDTH_CONFIG.PADDING;
    
    // 最大幅での小節数
    const maxBarsWithMaxWidth = Math.floor(containerWidth / BAR_WIDTH_CONFIG.MAX_WIDTH);
    
    // 最小幅での小節数
    const maxBarsWithMinWidth = Math.floor(containerWidth / BAR_WIDTH_CONFIG.MIN_WIDTH);
    
    // 小節数を決定
    let calculatedBars: number;
    if (maxBarsWithMaxWidth > 0) {
      // 最大幅で1小節以上入る場合は、最大幅を基準にする
      calculatedBars = maxBarsWithMaxWidth;
    } else {
      // 最大幅で1小節も入らない場合は、最小幅を基準にする
      calculatedBars = Math.max(1, maxBarsWithMinWidth);
    }
    
    // 実用的な範囲に制限（1〜16小節）
    const finalBars = Math.min(16, calculatedBars);
    
    setBarsPerRow(finalBars);
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
    config: BAR_WIDTH_CONFIG
  };
};