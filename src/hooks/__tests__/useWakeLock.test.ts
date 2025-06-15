import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useWakeLock } from '../useWakeLock';

// Mock Wake Lock API
const createMockWakeLockSentinel = () => {
  let released = false;
  const listeners: (() => void)[] = [];
  
  return {
    get released() { return released; },
    type: 'screen' as const,
    async release() {
      released = true;
      listeners.forEach(listener => listener());
    },
    addEventListener(type: 'release', listener: () => void) {
      if (type === 'release') {
        listeners.push(listener);
      }
    },
    removeEventListener(type: 'release', listener: () => void) {
      if (type === 'release') {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }
  };
};

describe('useWakeLock', () => {
  let mockWakeLockSentinel: ReturnType<typeof createMockWakeLockSentinel>;
  let mockWakeLock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockWakeLockSentinel = createMockWakeLockSentinel();
    mockWakeLock = vi.fn().mockResolvedValue(mockWakeLockSentinel);
    
    Object.defineProperty(navigator, 'wakeLock', {
      writable: true,
      value: {
        request: mockWakeLock
      }
    });

    // Mock document.visibilityState
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should detect Wake Lock API support', () => {
      const { result } = renderHook(() => useWakeLock());
      
      expect(result.current.isSupported).toBe(true);
      expect(result.current.isActive).toBe(false);
    });

    it('should detect when Wake Lock API is not supported', () => {
      Object.defineProperty(navigator, 'wakeLock', {
        writable: true,
        value: undefined
      });
      
      const { result } = renderHook(() => useWakeLock());
      
      expect(result.current.isSupported).toBe(false);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('requestWakeLock', () => {
    it('should request wake lock successfully', async () => {
      const { result } = renderHook(() => useWakeLock());
      
      await act(async () => {
        await result.current.requestWakeLock();
      });
      
      expect(mockWakeLock).toHaveBeenCalledWith('screen');
      expect(result.current.isActive).toBe(true);
    });

    it('should handle wake lock request failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockWakeLock.mockRejectedValue(new Error('Not allowed'));
      
      const { result } = renderHook(() => useWakeLock());
      
      await act(async () => {
        await result.current.requestWakeLock();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to request wake lock:', expect.any(Error));
      expect(result.current.isActive).toBe(false);
      
      consoleSpy.mockRestore();
    });

    it('should not request wake lock when not supported', async () => {
      Object.defineProperty(navigator, 'wakeLock', {
        writable: true,
        value: undefined
      });
      
      const { result } = renderHook(() => useWakeLock());
      
      await act(async () => {
        await result.current.requestWakeLock();
      });
      
      expect(mockWakeLock).not.toHaveBeenCalled();
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('releaseWakeLock', () => {
    it('should release wake lock successfully', async () => {
      const { result } = renderHook(() => useWakeLock());
      
      // First request wake lock
      await act(async () => {
        await result.current.requestWakeLock();
      });
      
      expect(result.current.isActive).toBe(true);
      
      // Then release it
      await act(async () => {
        await result.current.releaseWakeLock();
      });
      
      expect(result.current.isActive).toBe(false);
    });

    it('should handle wake lock release failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useWakeLock());
      
      // First request wake lock
      await act(async () => {
        await result.current.requestWakeLock();
      });
      
      // Mock release failure
      vi.spyOn(mockWakeLockSentinel, 'release').mockRejectedValue(new Error('Release failed'));
      
      await act(async () => {
        await result.current.releaseWakeLock();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to release wake lock:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('toggleWakeLock', () => {
    it('should request wake lock when inactive', async () => {
      const { result } = renderHook(() => useWakeLock());
      
      await act(async () => {
        await result.current.toggleWakeLock();
      });
      
      expect(result.current.isActive).toBe(true);
    });

    it('should release wake lock when active', async () => {
      const { result } = renderHook(() => useWakeLock());
      
      // First activate
      await act(async () => {
        await result.current.requestWakeLock();
      });
      
      expect(result.current.isActive).toBe(true);
      
      // Then toggle to deactivate
      await act(async () => {
        await result.current.toggleWakeLock();
      });
      
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('automatic wake lock release handling', () => {
    it('should update state when wake lock is released by the system', async () => {
      const { result } = renderHook(() => useWakeLock());
      
      await act(async () => {
        await result.current.requestWakeLock();
      });
      
      expect(result.current.isActive).toBe(true);
      
      // Simulate system releasing the wake lock
      await act(async () => {
        await mockWakeLockSentinel.release();
      });
      
      expect(result.current.isActive).toBe(false);
    });
  });

});