import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsiveBars } from '../useResponsiveBars';

// モックオブジェクトの型定義
interface MockWindow extends Omit<Window, 'innerWidth'> {
  innerWidth: number;
}

describe('useResponsiveBars', () => {
  let mockAddEventListener: ReturnType<typeof vi.fn>;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;
  let originalWindow: Window;

  beforeEach(() => {
    vi.useFakeTimers();
    
    // window.innerWidthをモック
    originalWindow = globalThis.window;
    mockAddEventListener = vi.fn();
    mockRemoveEventListener = vi.fn();
    
    // windowオブジェクトを部分的にモック
    Object.defineProperty(globalThis, 'window', {
      value: {
        ...originalWindow,
        innerWidth: 1200, // デフォルト幅
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        setTimeout: globalThis.setTimeout,
        clearTimeout: globalThis.clearTimeout
      } as MockWindow & { addEventListener: typeof vi.fn; removeEventListener: typeof vi.fn; setTimeout: typeof setTimeout; clearTimeout: typeof clearTimeout },
      writable: true
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true
    });
  });

  it('デフォルトで適切な小節数を計算する', () => {
    // 1200px - 32px(padding) = 1168px
    // 最小幅120pxで計算: 1168 / 120 = 9.73 → 9小節
    const { result } = renderHook(() => useResponsiveBars());
    
    expect(result.current.barsPerRow).toBe(9);
    expect(result.current.config.MIN_WIDTH).toBe(120);
    expect(result.current.config.MAX_WIDTH).toBe(340);
    expect(result.current.config.PADDING).toBe(32);
  });

  it('小さい画面幅で最小幅での計算をする', () => {
    // 500px - 32px = 468px
    // 最小幅120pxで計算: 468 / 120 = 3.9 → 3小節
    (globalThis.window as MockWindow).innerWidth = 500;
    
    const { result } = renderHook(() => useResponsiveBars());
    
    expect(result.current.barsPerRow).toBe(3);
  });

  it('最小幅で計算する', () => {
    // 300px - 32px = 268px
    // 最小幅120px: 268 / 120 = 2.23 → 2小節
    (globalThis.window as MockWindow).innerWidth = 300;
    
    const { result } = renderHook(() => useResponsiveBars());
    
    expect(result.current.barsPerRow).toBe(2);
  });

  it('最大幅でも入らない場合は最小幅で計算', () => {
    // 150px - 32px = 118px (最小幅120pxより小さい)
    // 最小幅120px: 118 / 120 = 0.98 → 1小節（最低保証）
    (globalThis.window as MockWindow).innerWidth = 150;
    
    const { result } = renderHook(() => useResponsiveBars());
    
    expect(result.current.barsPerRow).toBe(1);
  });

  it('非常に小さい画面でも最低1小節は表示', () => {
    // 100px - 32px = 68px (最小幅120pxより小さい)
    (globalThis.window as MockWindow).innerWidth = 100;
    
    const { result } = renderHook(() => useResponsiveBars());
    
    expect(result.current.barsPerRow).toBe(1);
  });

  it('非常に大きい画面では最大16小節に制限', () => {
    // 4000px - 32px = 3968px
    // 最小幅120pxで計算: 3968 / 120 = 33.07 → 16小節(制限)
    (globalThis.window as MockWindow).innerWidth = 4000;
    
    const { result } = renderHook(() => useResponsiveBars());
    
    expect(result.current.barsPerRow).toBe(16);
  });

  it('リサイズイベントリスナーを設定する', () => {
    renderHook(() => useResponsiveBars());
    
    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('アンマウント時にリサイズイベントリスナーを削除する', () => {
    const { unmount } = renderHook(() => useResponsiveBars());
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('リサイズ時に小節数を再計算する（デバウンス付き）', () => {
    const { result } = renderHook(() => useResponsiveBars());
    
    // 初期状態
    expect(result.current.barsPerRow).toBe(9); // 1200px
    
    // 画面幅を変更
    (globalThis.window as MockWindow).innerWidth = 800;
    
    // リサイズイベントをトリガー
    const resizeHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'resize'
    )?.[1];
    
    if (resizeHandler) {
      act(() => {
        resizeHandler();
        // デバウンス（100ms）を進める
        vi.advanceTimersByTime(100);
      });
    }
    
    // 800px - 32px = 768px
    // 最小幅120pxで計算: 768 / 120 = 6.4 → 6小節
    expect(result.current.barsPerRow).toBe(6);
  });

  it('連続したリサイズイベントがデバウンスされる', () => {
    const { result } = renderHook(() => useResponsiveBars());
    
    const resizeHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'resize'
    )?.[1];
    
    if (resizeHandler) {
      act(() => {
        // 連続でリサイズイベントを発生
        (globalThis.window as MockWindow).innerWidth = 600;
        resizeHandler();
        
        (globalThis.window as MockWindow).innerWidth = 700;
        resizeHandler();
        
        (globalThis.window as MockWindow).innerWidth = 800;
        resizeHandler();
        
        // 50ms経過（まだデバウンス中）
        vi.advanceTimersByTime(50);
      });
      
      // まだ初期値のまま
      expect(result.current.barsPerRow).toBe(9);
      
      act(() => {
        // 100ms経過（デバウンス完了）
        vi.advanceTimersByTime(50);
      });
      
      // 最後の値（800px）で計算される
      expect(result.current.barsPerRow).toBe(6);
    }
  });
});