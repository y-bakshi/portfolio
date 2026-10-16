import { useEffect, useState } from 'react';

/** True while the page is being scrolled, and for a moment after it stops. */
export function useScrolling(settleMs = 700) {
  const [scrolling, setScrolling] = useState(false);
  useEffect(() => {
    let timer: number | undefined;
    const onScroll = () => {
      setScrolling(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setScrolling(false), settleMs);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, [settleMs]);
  return scrolling;
}
