import { useEffect, useRef, type RefObject } from 'react';
import { translateAlong } from '../iso/vendor/kit';
import { useInView, useStillness } from '../iso/vendor/live';
import { curves } from './timeline';
import type { Scene } from './buildScene';

/** Puts every packet and every moving part where the timeline says they are at `seconds`. */
function paint(svg: SVGSVGElement, scene: Scene, seconds: number) {
  const frame = scene.timeline.at(seconds);
  const { P } = scene;

  svg.querySelectorAll<SVGGElement>('[data-slot]').forEach((group) => {
    const slot = group.dataset.slot;
    group.querySelectorAll<SVGGElement>('[data-packet]').forEach((copy) => {
      const mine = frame.packets[Number(copy.dataset.packet)];
      if (mine && mine.slot === slot) {
        copy.setAttribute('transform', translateAlong(P, mine.pos));
        copy.setAttribute('opacity', String(Math.round(mine.opacity * 100) / 100));
      } else {
        copy.setAttribute('opacity', '0');
      }
    });
  });

  for (const m of scene.movers) {
    const el = svg.querySelector<SVGGElement>(`[data-mover="${m.name}"]`);
    const state = frame.stations[m.station];
    if (!el || !state) continue;
    const activity = state[m.curve];
    el.setAttribute('transform', translateAlong(P, m.move(activity, state.exit)));
  }
}

/**
 * Runs a figure: a loop that moves the packets along their belts, only while the figure is on screen,
 * and a single still frame for people who ask for less motion. Everything is written straight onto the
 * drawing, so nothing re-renders.
 */
export function useSceneMotion(svgRef: RefObject<SVGSVGElement | null>, scene: Scene) {
  const still = useStillness();
  const wrapper = useRef<HTMLDivElement | null>(null);
  const inView = useInView(wrapper);
  const clock = useRef(0);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (still) {
      paint(svg, scene, scene.timeline.still);
      return;
    }
    if (!inView) return;
    let frame = 0;
    let last = 0;
    const step = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 0;
      last = now;
      clock.current += dt;
      paint(svg, scene, clock.current);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [svgRef, scene, still, inView]);

  return wrapper;
}

export { curves };
