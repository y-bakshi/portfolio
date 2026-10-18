import { useEffect, type RefObject } from 'react';
import { asksForStillness } from '@/lib/motion';
import type { timelineOf } from './timeline';

type Timeline = ReturnType<typeof timelineOf>;

/**
 * Moves the packet along its trip while the chart is on screen, and lights the step it rests at.
 * It writes straight onto the SVG and the step boxes, so React does not render again on each frame.
 * With reduced motion, or off screen, the packet holds one still frame partway along the first belt.
 */
export function useFlowMotion(
  root: RefObject<HTMLElement | null>,
  packet: RefObject<SVGGElement | null>,
  timeline: Timeline,
  running: boolean,
) {
  useEffect(() => {
    const dot = packet.current;
    const chart = root.current;
    if (!dot || !chart) return;
    const place = (time: number) => {
      const f = timeline.frame(time);
      dot.setAttribute('transform', `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)})`);
      dot.setAttribute('opacity', '1');
      chart.querySelectorAll<HTMLElement>('[data-station]').forEach((el) => {
        if (el.dataset.station === f.at) el.setAttribute('data-lit', '');
        else el.removeAttribute('data-lit');
      });
    };
    if (!running || asksForStillness()) {
      place(0.55 + 0.4);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      place((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      chart.querySelectorAll('[data-lit]').forEach((el) => el.removeAttribute('data-lit'));
    };
  }, [root, packet, timeline, running]);
}
