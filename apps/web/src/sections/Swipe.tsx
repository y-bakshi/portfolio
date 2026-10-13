import { Children, useEffect, useRef, useState, type ReactNode } from 'react';

/** A row of items that wide screens lay out as a grid and phones turn into cards to swipe through. */
export function Swipe({
  as,
  className,
  label,
  children,
}: {
  as: 'ol' | 'div';
  className: string;
  label: string;
  children: ReactNode;
}) {
  const list = useRef<HTMLElement>(null);
  const [at, setAt] = useState(0);
  const count = Children.count(children);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      const kids = [...el.children] as HTMLElement[];
      const stride = kids.length > 1 ? kids[1].offsetLeft - kids[0].offsetLeft : el.clientWidth;
      const gap = (k: HTMLElement) => Math.abs(k.offsetLeft - el.scrollLeft);
      setAt(kids.reduce((best, k, i) => (gap(k) < gap(kids[best]) ? i : best), 0));
      // how far each card is from the front, -1 to 1: the styles fan the cards out by it
      kids.forEach((k) => {
        const d = Math.max(-1, Math.min(1, (k.offsetLeft - el.scrollLeft) / stride));
        k.style.setProperty('--d', String(d));
        k.style.setProperty('--a', String(Math.abs(d)));
      });
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const go = (i: number) =>
    (list.current?.children[i] as HTMLElement | undefined)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    });

  const Tag = as;
  return (
    <>
      <Tag ref={list as never} className={`${className} swipe`} tabIndex={0} aria-label={label}>
        {children}
      </Tag>
      <div className="swipe-dots" role="group" aria-label={label}>
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            className="swipe-dot"
            aria-label={`Show ${i + 1} of ${count}`}
            aria-current={i === at}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </>
  );
}
