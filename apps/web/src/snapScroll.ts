import { useLayoutEffect } from 'react';

/** A wide, tall screen with a real pointer. Phones and short windows scroll freely. */
const WIDE = '(min-width: 901px) and (min-height: 640px) and (hover: hover)';
/** The sections that start a screen, in page order. */
const SCREENS = '.ask, .work, .record, .more, .tools, .contact';
/** After a step, ignore input for this long so a trackpad's momentum does not skip a screen. */
const LOCK_MS = 900;
/** Focus here means a key press belongs to that control, not to the page. */
const OWN_KEYS = 'input, textarea, select, button, a, summary, [contenteditable]';

/**
 * The scroll positions the page steps between: the top of every screen and, for a section taller
 * than the window, further stops down to the one that brings its end into view.
 */
function stops(header: number) {
  const view = window.innerHeight - header;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const tops = [...document.querySelectorAll<HTMLElement>(SCREENS)].map(
    (el) => el.getBoundingClientRect().top + window.scrollY - header,
  );
  const all: number[] = [];
  tops.forEach((top, i) => {
    const end = i + 1 < tops.length ? tops[i + 1] : maxY + view;
    all.push(top);
    for (let s = top; end - (s + view) > 4;) {
      s = Math.min(s + view, end - view);
      all.push(s);
    }
  });
  const clamped = all.map((v) => Math.round(Math.min(Math.max(v, 0), maxY)));
  return [...new Set(clamped)].sort((a, b) => a - b);
}

/**
 * On wide screens one wheel step, or one press of Page Down, Page Up or Space, moves the page to the
 * next stop or back to the previous one, so each screen is reached with a single scroll. CSS scroll
 * snapping cannot do this on its own: a small wheel or trackpad movement just snaps back to where it
 * started, and a section a little taller than the window can trap the page. Everything else, such as
 * arrow keys, the scroll bar and touch, scrolls normally.
 */
export function useSnapScroll() {
  // a layout effect, so the listeners are in place before the first paint
  useLayoutEffect(() => {
    const wide = window.matchMedia(WIDE);
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lockedUntil = 0;

    /** Move one stop in a direction. Returns false when there is nowhere to go. */
    const step = (down: boolean) => {
      const header =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
      const y = window.scrollY;
      const all = stops(header);
      const target = down ? all.find((s) => s > y + 2) : [...all].reverse().find((s) => s < y - 2);
      if (target === undefined) return false;
      lockedUntil = performance.now() + LOCK_MS;
      window.scrollTo({ top: target, behavior: still.matches ? 'auto' : 'smooth' });
      return true;
    };

    const onWheel = (e: WheelEvent) => {
      if (!wide.matches || e.ctrlKey) return;
      if (Math.abs(e.deltaY) < 2 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      // the chat bar and form fields keep their own wheel behaviour
      if ((e.target as Element | null)?.closest('.dock, input, textarea')) return;
      if (performance.now() < lockedUntil) {
        e.preventDefault();
        return;
      }
      if (step(e.deltaY > 0)) e.preventDefault();
    };

    const onKey = (e: KeyboardEvent) => {
      if (!wide.matches || e.ctrlKey || e.metaKey || e.altKey) return;
      const page = e.key === 'PageDown' || e.key === 'PageUp';
      const space = e.key === ' ';
      if (!page && !space) return;
      const el = document.activeElement;
      if (el && el !== document.body && el.matches(OWN_KEYS)) return;
      if (performance.now() < lockedUntil) {
        e.preventDefault();
        return;
      }
      if (step(e.key === 'PageDown' || (space && !e.shiftKey))) e.preventDefault();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, []);
}
