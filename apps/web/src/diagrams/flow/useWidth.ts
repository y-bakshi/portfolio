import { useEffect, useState, type RefObject } from 'react';

/** The width of an element, kept up to date, or null until it is known (and on a page with no window). */
export function useWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    setWidth(node.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}
