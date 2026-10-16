import { useEffect, useState } from 'react';

/** How long the open guide can be left alone before its face falls asleep. */
export const SLEEP_AFTER_MS = 40_000;

const EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'focusin'] as const;

/**
 * True once `active` has been true for `ms` with no movement, key or touch anywhere on the page. Any of
 * those, or `active` turning false, wakes it. Listeners are only attached while it is active.
 */
export function useIdle(active: boolean, ms: number) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    setIdle(false);
    if (!active) return;
    let timer = window.setTimeout(() => setIdle(true), ms);
    const wake = () => {
      window.clearTimeout(timer);
      setIdle(false);
      timer = window.setTimeout(() => setIdle(true), ms);
    };
    for (const e of EVENTS) window.addEventListener(e, wake, { passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const e of EVENTS) window.removeEventListener(e, wake);
    };
  }, [active, ms]);
  return idle;
}
