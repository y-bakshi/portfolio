import { useEffect, useState, type RefObject } from 'react';

/** True while the element is on screen, or just about to be. A page with no IntersectionObserver counts as always in view. */
export function useInView(ref: RefObject<Element | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setInView(Boolean(entries.at(-1)?.isIntersecting)),
      { rootMargin: '120px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}
