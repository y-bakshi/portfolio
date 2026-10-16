import { useEffect, useRef, type RefObject } from 'react';
import { useInView } from '@/lib/useInView';
import { prefersReducedMotion } from '../shared';
import { sample, type Params } from './engine';
import { blend } from './blend';
import { blink, drift, moods, type Mood } from './moods';

type Parts = {
  body: SVGPathElement | null;
  eyes: (SVGEllipseElement | null)[];
  mouth: SVGEllipseElement | null;
};

/** Writes one frame of the face onto its elements. */
function draw(parts: Parts, p: Params, t: number, size: number) {
  const open = p.eyes * (1 - 0.92 * blink(t));
  const wander = drift(t);
  const face = sample(
    { ...p, eyes: open, gazeX: p.gazeX + wander.x * 0.5, gazeY: p.gazeY + wander.y * 0.5 },
    t,
    size,
  );
  parts.body?.setAttribute('d', face.body);
  const place = (
    el: SVGEllipseElement | null,
    e: { cx: number; cy: number; rx: number; ry: number },
  ) => {
    if (!el) return;
    el.setAttribute('cx', String(e.cx));
    el.setAttribute('cy', String(e.cy));
    el.setAttribute('rx', String(e.rx));
    el.setAttribute('ry', String(e.ry));
  };
  face.eyes.forEach((e, i) => place(parts.eyes[i], e));
  place(parts.mouth, face.mouth);
}

/**
 * Runs the face: it eases toward the current mood and redraws every frame, but only while it is on
 * screen. Under reduced motion it is drawn once, in its mood, and holds still.
 */
export function useAvatarMotion(root: RefObject<SVGSVGElement | null>, mood: Mood, size: number) {
  const inView = useInView(root);
  const current = useRef<Params>({ ...moods.idle });

  useEffect(() => {
    const svg = root.current;
    if (!svg) return;
    const parts: Parts = {
      body: svg.querySelector('[data-body]'),
      eyes: [...svg.querySelectorAll<SVGEllipseElement>('[data-eye]')],
      mouth: svg.querySelector('[data-mouth]'),
    };
    const target = moods[mood];
    if (prefersReducedMotion()) {
      current.current = { ...target };
      draw(parts, current.current, 0, size);
      return;
    }
    if (!inView) return;
    let frame = 0;
    let last = 0;
    let drawn = 0;
    let t = 0;
    // at rest the face moves slowly, so 30 frames a second is plenty; it gets every frame only while it is busy
    const busy = ['thinking', 'answering', 'wink', 'dizzy', 'burst'].includes(mood);
    const gap = busy ? 0 : 1000 / 30 - 2;
    const step = (now: number) => {
      frame = requestAnimationFrame(step);
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 0;
      last = now;
      t += dt;
      current.current = blend(current.current, target, dt, 0.18);
      if (now - drawn < gap) return;
      drawn = now;
      draw(parts, current.current, t, size);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [root, mood, size, inView]);
}
