import { describe, expect, test } from 'vitest';

// バランス調整されたコード幅計算のロジックをテストするためのユーティリティ関数
function calculateChordWidthsPx(
  chords: { duration?: number }[], 
  beatsPerBar: number, 
  barWidthPx: number,
  minWidthPx: number = 47
): number[] {
  const availableWidth = barWidthPx - 8; // パディング分を除く
  
  // 1. 各コードの比例幅を計算
  const proportionalWidths = chords.map(chord => {
    const chordDuration = chord.duration || 4;
    return (chordDuration / beatsPerBar) * availableWidth;
  });
  
  // 2. 最低幅未満のコードを特定し、調整
  const adjustedWidths = proportionalWidths.map(width => 
    Math.max(width, minWidthPx)
  );
  
  // 3. 合計幅が利用可能幅を超える場合の処理
  const totalAdjustedWidth = adjustedWidths.reduce((sum, width) => sum + width, 0);
  
  if (totalAdjustedWidth <= availableWidth) {
    // 収まる場合はそのまま
    return adjustedWidths;
  }
  
  // 4. 比例幅が最低幅以上のコードを特定（長いコード）
  const longChordIndices = proportionalWidths
    .map((width, index) => ({ width, index }))
    .filter(item => item.width >= minWidthPx)
    .map(item => item.index);
  
  if (longChordIndices.length === 0) {
    // 全コードが最低幅の場合は横スクロール
    return adjustedWidths;
  }
  
  // 5. 超過分を長いコードで負担
  const excess = totalAdjustedWidth - availableWidth;
  const reductionPerLongChord = excess / longChordIndices.length;
  
  const finalWidths = [...adjustedWidths];
  longChordIndices.forEach(index => {
    const newWidth = finalWidths[index] - reductionPerLongChord;
    // 最低幅は維持
    finalWidths[index] = Math.max(newWidth, minWidthPx);
  });
  
  return finalWidths;
}

describe('chordWidthCalculation', () => {
  describe('calculateChordWidthsPx (絶対値ベース)', () => {
    test('通常の4拍子での幅計算 - 200px小節', () => {
      const chords = [
        { duration: 4 }, // 1小節全部
      ];
      
      const widths = calculateChordWidthsPx(chords, 4, 200);
      expect(widths).toEqual([192]); // 200 - 8 = 192px
    });

    test('0.5拍コードの最低幅保証 - 小さな小節（バランス調整）', () => {
      const chords = [
        { duration: 0.5 }, // 0.5拍
        { duration: 3.5 }, // 残り
      ];
      
      const widths = calculateChordWidthsPx(chords, 4, 100); // 小さい小節
      
      // 比例幅: 0.5拍=11.5px, 3.5拍=80.5px
      // 調整後: 0.5拍=47px, 3.5拍=80.5px
      // 合計=127.5px > 92px なので、3.5拍から35.5px削減
      // 最終: 0.5拍=47px, 3.5拍=47px（最低幅まで削減）
      expect(widths[0]).toBe(47);
      expect(widths[1]).toBe(47);
      expect(widths.reduce((sum, w) => sum + w, 0)).toBeCloseTo(94, 1);
    });

    test('0.5拍コードの最低幅保証 - 大きな小節', () => {
      const chords = [
        { duration: 0.5 }, // 0.5拍
        { duration: 3.5 }, // 残り
      ];
      
      const widths = calculateChordWidthsPx(chords, 4, 400); // 大きい小節
      
      // 0.5拍は (0.5/4) * 392 = 49px > 47px なので比例幅適用
      expect(widths[0]).toBeCloseTo(49, 1);
      // 3.5拍は (3.5/4) * 392 = 343px
      expect(widths[1]).toBeCloseTo(343, 1);
    });

    test('短いコードが多い場合 - 最低幅保証（バランス調整）', () => {
      const chords = [
        { duration: 0.5 }, // 36px保証
        { duration: 0.5 }, // 36px保証
        { duration: 0.5 }, // 36px保証
        { duration: 0.5 }, // 36px保証
        { duration: 2 },   // 残り
      ];
      
      const widths = calculateChordWidthsPx(chords, 4, 150); // 小さい小節
      
      // 比例幅: 0.5拍×4=17.75px×4=71px, 2拍=71px, 合計=142px
      // 調整後: 0.5拍×4=47px×4=188px, 2拍=71px, 合計=259px > 142px
      // 超過分117pxを2拍から削減: 2拍=71px-117px=47px(最低幅)
      expect(widths[0]).toBe(47);
      expect(widths[1]).toBe(47);
      expect(widths[2]).toBe(47);
      expect(widths[3]).toBe(47);
      expect(widths[4]).toBe(47); // 最低幅まで削減
      expect(widths.reduce((sum, w) => sum + w, 0)).toBeCloseTo(235, 1); // 横スクロール
    });

    test('3/4拍子での計算（バランス調整）', () => {
      const chords = [
        { duration: 0.5 },
        { duration: 2.5 },
      ];
      
      const widths = calculateChordWidthsPx(chords, 3, 200);
      
      // 比例幅: 0.5拍=32px, 2.5拍=160px, 合計=192px
      // 調整後: 0.5拍=47px, 2.5拍=160px, 合計=207px > 192px
      // 超過分15pxを2.5拍から削減: 2.5拍=160px-15px=145px
      expect(widths[0]).toBe(47);
      expect(widths[1]).toBeCloseTo(145, 1);
      expect(widths.reduce((sum, w) => sum + w, 0)).toBeCloseTo(192, 1);
    });

    test('カスタム最低幅設定', () => {
      const chords = [
        { duration: 0.5 },
      ];
      
      const widthsWith50 = calculateChordWidthsPx(chords, 4, 200, 50);
      expect(widthsWith50[0]).toBe(50);
      
      const widthsWith20 = calculateChordWidthsPx(chords, 4, 200, 20);
      expect(widthsWith20[0]).toBeCloseTo(24, 1); // (0.5/4) * 192 = 24px > 20px
    });

    test('問題ケース: 0.5拍×3 + 2.5拍×1', () => {
      const chords = [
        { duration: 0.5 }, // 0.5拍
        { duration: 0.5 }, // 0.5拍
        { duration: 0.5 }, // 0.5拍
        { duration: 2.5 }, // 2.5拍
      ];
      
      const widths = calculateChordWidthsPx(chords, 4, 200); // 200px小節
      
      // 比例幅: 0.5拍×3=24px×3=72px, 2.5拍=120px, 合計=192px
      // 調整後: 0.5拍×3=47px×3=141px, 2.5拍=120px, 合計=261px > 192px
      // 超過分69pxを2.5拍から削減: 2.5拍=120px-69px=51px
      expect(widths[0]).toBe(47);
      expect(widths[1]).toBe(47);
      expect(widths[2]).toBe(47);
      expect(widths[3]).toBeCloseTo(51, 1);
      expect(widths.reduce((sum, w) => sum + w, 0)).toBeCloseTo(192, 1);
    });
  });
});