import { act, renderHook } from '@testing-library/react';
import { POKE_MS, usePoke } from './usePoke';

describe('usePoke', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reacts a different way each time, then goes back after a moment', () => {
    const { result } = renderHook(() => usePoke(true));
    expect(result.current[0]).toBeNull();
    const seen: unknown[] = [];
    for (let i = 0; i < 4; i++) {
      act(() => result.current[1]());
      seen.push(result.current[0]);
      act(() => void vi.advanceTimersByTime(POKE_MS + 1));
      expect(result.current[0]).toBeNull();
    }
    expect(seen).toEqual(['wink', 'dizzy', 'burst', 'wink']);
  });

  it('does nothing while the guide is busy, and drops a reaction when it gets busy', () => {
    const { result, rerender } = renderHook(({ ok }) => usePoke(ok), {
      initialProps: { ok: false },
    });
    act(() => result.current[1]());
    expect(result.current[0]).toBeNull();
    rerender({ ok: true });
    act(() => result.current[1]());
    expect(result.current[0]).toBe('wink');
    rerender({ ok: false });
    expect(result.current[0]).toBeNull();
  });
});
