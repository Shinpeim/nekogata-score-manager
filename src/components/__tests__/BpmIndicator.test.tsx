import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import BpmIndicator from '../BpmIndicator';

describe('BpmIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with BPM text', () => {
    render(<BpmIndicator bpm={120} />);
    expect(screen.getByText('テンポ: 120 BPM')).toBeInTheDocument();
  });

  it('does not render when BPM is 0 or negative', () => {
    const { container } = render(<BpmIndicator bpm={0} />);
    expect(container.firstChild).toBeNull();

    const { container: container2 } = render(<BpmIndicator bpm={-10} />);
    expect(container2.firstChild).toBeNull();
  });

  it('renders indicator circle', () => {
    render(<BpmIndicator bpm={120} />);
    const circle = document.querySelector('.w-3.h-3.rounded-full');
    expect(circle).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<BpmIndicator bpm={120} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('initially shows active state (blue circle) since pulse starts immediately', () => {
    render(<BpmIndicator bpm={120} />);
    const circle = document.querySelector('.w-3.h-3.rounded-full');
    expect(circle).toHaveClass('bg-blue-500');
    expect(circle).not.toHaveClass('bg-gray-300');
  });

  it('starts with blue circle and maintains state', () => {
    render(<BpmIndicator bpm={120} />);
    const circle = document.querySelector('.w-3.h-3.rounded-full');
    
    // Initially active (blue) since pulse starts immediately
    expect(circle).toHaveClass('bg-blue-500');
    expect(circle).not.toHaveClass('bg-gray-300');
  });

  it('deactivates circle after flash duration', () => {
    render(<BpmIndicator bpm={120} />);
    const circle = document.querySelector('.w-3.h-3.rounded-full');
    
    // Initially active (blue)
    expect(circle).toHaveClass('bg-blue-500');
    
    // After flash duration (50ms)
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(circle).toHaveClass('bg-gray-300');
    expect(circle).not.toHaveClass('bg-blue-500');
  });

  it('repeats pulse cycle based on BPM', () => {
    render(<BpmIndicator bpm={120} />); // 120 BPM = 500ms interval
    const circle = document.querySelector('.w-3.h-3.rounded-full');
    
    // Initially active
    expect(circle).toHaveClass('bg-blue-500');
    
    // After flash duration
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(circle).toHaveClass('bg-gray-300');
    
    // Wait for next cycle (500ms - 50ms = 450ms)
    act(() => {
      vi.advanceTimersByTime(450);
    });
    expect(circle).toHaveClass('bg-blue-500');
    
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(circle).toHaveClass('bg-gray-300');
  });

  it('calculates correct interval for 60 BPM', () => {
    // 60 BPM = 1000ms interval
    render(<BpmIndicator bpm={60} />);
    const circle = document.querySelector('.w-3.h-3.rounded-full');
    
    // Initially active
    expect(circle).toHaveClass('bg-blue-500');
    
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(circle).toHaveClass('bg-gray-300');
    
    // Next pulse should be at 1000ms - 50ms = 950ms
    act(() => {
      vi.advanceTimersByTime(949);
    });
    expect(circle).toHaveClass('bg-gray-300');
    
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(circle).toHaveClass('bg-blue-500');
  });

  it('cleans up timers on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = render(<BpmIndicator bpm={120} />);
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('restarts pulse when BPM changes', () => {
    const { rerender } = render(<BpmIndicator bpm={120} />);
    const circle = document.querySelector('.w-3.h-3.rounded-full');
    
    // Initially active
    expect(circle).toHaveClass('bg-blue-500');
    
    // Change BPM - should restart
    rerender(<BpmIndicator bpm={60} />);
    
    // Should still be active with new BPM
    expect(circle).toHaveClass('bg-blue-500');
  });
});