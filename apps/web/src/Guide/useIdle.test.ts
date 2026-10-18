import { act, renderHook } from '@testing-library/react';
import { SLEEP_AFTER_MS, useIdle } from './useIdle';

describe('useIdle', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is awake at first, and asleep after the time with nothing happening', () => {
    const { result } = renderHook(() => useIdle(true, SLEEP_AFTER_MS));
    expect(result.current).toBe(false);
    act(() => void vi.advanceTimersByTime(SLEEP_AFTER_MS - 1));
    expect(result.current).toBe(false);
    act(() => void vi.advanceTimersByTime(2));
    expect(result.current).toBe(true);
  });

  it('wakes on a movement, a key or a touch, and starts counting again', () => {
    const { result } = renderHook(() => useIdle(true, 1000));
    act(() => void vi.advanceTimersByTime(1500));
    expect(result.current).toBe(true);
    act(() => void window.dispatchEvent(new Event('pointermove')));
    expect(result.current).toBe(false);
    act(() => void vi.advanceTimersByTime(900));
    act(() => void window.dispatchEvent(new Event('keydown')));
    act(() => void vi.advanceTimersByTime(900));
    expect(result.current).toBe(false);
    act(() => void vi.advanceTimersByTime(200));
    expect(result.current).toBe(true);
  });

  it('never sleeps while inactive, and wakes when it stops being active', () => {
    const { result, rerender } = renderHook(({ on }) => useIdle(on, 1000), {
      initialProps: { on: false },
    });
    act(() => void vi.advanceTimersByTime(5000));
    expect(result.current).toBe(false);
    rerender({ on: true });
    act(() => void vi.advanceTimersByTime(1500));
    expect(result.current).toBe(true);
    rerender({ on: false });
    expect(result.current).toBe(false);
  });
});
