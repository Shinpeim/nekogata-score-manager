import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHiddenFeatures } from '../useHiddenFeatures';

describe('useHiddenFeatures', () => {
  const mockLocation = {
    search: '',
  };

  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    mockLocalStorage.getItem.mockClear();
  });

  it('デフォルトでは全ての隠し機能が無効', () => {
    mockLocation.search = '';
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useHiddenFeatures());

    expect(result.current.syncSettings).toBe(false);
  });

  it('?syncクエリパラメータでsyncSettings機能が有効になる', () => {
    mockLocation.search = '?sync';
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useHiddenFeatures());

    expect(result.current.syncSettings).toBe(true);
  });

  it('?debug=syncでsyncSettings機能が有効になる', () => {
    mockLocation.search = '?debug=sync';
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useHiddenFeatures());

    expect(result.current.syncSettings).toBe(true);
  });

  it('localStorageのnekogata-debug-syncがtrueでsyncSettings機能が有効になる', () => {
    mockLocation.search = '';
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'nekogata-debug-sync') return 'true';
      return null;
    });

    const { result } = renderHook(() => useHiddenFeatures());

    expect(result.current.syncSettings).toBe(true);
  });

  it('localStorageのnekogata-debug-syncがfalseの場合は機能が無効', () => {
    mockLocation.search = '';
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'nekogata-debug-sync') return 'false';
      return null;
    });

    const { result } = renderHook(() => useHiddenFeatures());

    expect(result.current.syncSettings).toBe(false);
  });

  it('複数の条件が同時に満たされた場合でも機能が有効になる', () => {
    mockLocation.search = '?sync&other=value';
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'nekogata-debug-sync') return 'true';
      return null;
    });

    const { result } = renderHook(() => useHiddenFeatures());

    expect(result.current.syncSettings).toBe(true);
  });

  it('URLに関係ないクエリパラメータがある場合は機能が無効', () => {
    mockLocation.search = '?other=value&another=test';
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useHiddenFeatures());

    expect(result.current.syncSettings).toBe(false);
  });

  it('debug=syncと他のパラメータが混在している場合は機能が有効', () => {
    mockLocation.search = '?foo=bar&debug=sync&baz=qux';
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useHiddenFeatures());

    expect(result.current.syncSettings).toBe(true);
  });

  it('debug=otherの場合は機能が無効', () => {
    mockLocation.search = '?debug=other';
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useHiddenFeatures());

    expect(result.current.syncSettings).toBe(false);
  });

  it('popstateイベントでURLが変更された場合に再評価される', () => {
    mockLocation.search = '';
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result, rerender } = renderHook(() => useHiddenFeatures());

    expect(result.current.syncSettings).toBe(false);

    // URLを変更してpopstateイベントを発火
    act(() => {
      mockLocation.search = '?sync';
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    
    rerender();
    
    expect(result.current.syncSettings).toBe(true);
  });
});