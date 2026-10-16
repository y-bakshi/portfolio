import { useEffect, useRef } from 'react';
import { PUSH_RADIUS } from './pointerPush';

const SPACING = 14;
const RADIUS = PUSH_RADIUS; // shared with the portrait so both clear the same-sized gap
const PUSH = 5; // strength of the push
const DOT_RADIUS = 1.35;
const DOT_ALPHA = 0.32;

type RGB = [number, number, number];

/** Reads a hex colour token such as --ink from the stylesheet, so the dots follow the design tokens. */
const token = (name: string, fallback: RGB): RGB => {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

type Dot = { hx: number; hy: number; ox: number; oy: number; vx: number; vy: number };

/**
 * A page-wide grid of round dots fixed behind the content. Dots near the pointer are pushed away
 * from it and spring back when it leaves. The loop stops once everything is at rest. Under reduced
 * motion the grid is drawn once and does not react.
 */
export function DotGrid() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Dots use --ink, the same colour as the portrait's line work.
    const INK = token('--ink', [14, 29, 97]);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let mouse: { x: number; y: number } | null = null;
    let frame = 0;
    let lastMove = 0;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // The page canvas fills the viewport; the header canvas fills just the header strip, which
      // sits at the top of the viewport, so both draw the same grid in the same place.
      const rect = canvas.getBoundingClientRect();
      width = rect.width || window.innerWidth;
      height = rect.height || window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const cols = Math.floor(width / SPACING) + 2;
      const rows = Math.floor(height / SPACING) + 2;
      const ox = (window.innerWidth % SPACING) / 2;
      const oy = (window.innerHeight % SPACING) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({ hx: ox + c * SPACING, hy: oy + r * SPACING, ox: 0, oy: 0, vx: 0, vy: 0 });
        }
      }
    };

    const paint = (now: number = performance.now()) => {
      ctx.clearRect(0, 0, width, height);
      const mx = mouse?.x ?? -99999;
      const my = mouse?.y ?? -99999;
      let maxDelta = 0;

      // Every dot shares one style, so the whole grid is a single path and a single fill.
      ctx.fillStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${DOT_ALPHA})`;
      ctx.beginPath();
      for (const d of dots) {
        const dx = d.hx + d.ox - mx;
        const dy = d.hy + d.oy - my;
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS && dist > 0.01) {
          const f = (1 - dist / RADIUS) ** 2 * PUSH;
          d.vx += (dx / dist) * f;
          d.vy += (dy / dist) * f;
        }
        // damped spring back to the home position
        const px = d.ox;
        const py = d.oy;
        d.ox = (d.ox + d.vx) * 0.9;
        d.oy = (d.oy + d.vy) * 0.9;
        d.vx *= 0.78;
        d.vy *= 0.78;
        const delta = Math.abs(d.ox - px) + Math.abs(d.oy - py);
        if (delta > maxDelta) maxDelta = delta;
        const x = d.hx + d.ox;
        const y = d.hy + d.oy;
        ctx.moveTo(x + DOT_RADIUS, y);
        ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
      }
      ctx.fill();

      // Keep animating while the pointer is moving or any dot is still travelling; a pointer that
      // has stopped leaves the dots where they settled and the loop sleeps.
      const active = (mouse !== null && now - lastMove < 350) || maxDelta > 0.02;
      frame = active ? requestAnimationFrame(paint) : 0;
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onMove = (e: MouseEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
      lastMove = performance.now();
      wake();
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) {
        mouse = { x: t.clientX, y: t.clientY };
        lastMove = performance.now();
        wake();
      }
    };
    const clear = () => {
      mouse = null;
      wake();
    };
    const observer = new ResizeObserver(() => {
      build();
      wake();
    });
    observer.observe(canvas);

    build();
    paint();
    if (!reduce) {
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('touchmove', onTouch, { passive: true });
      window.addEventListener('touchend', clear, { passive: true });
      window.addEventListener('touchcancel', clear, { passive: true });
      document.addEventListener('mouseleave', clear);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend', clear);
      window.removeEventListener('touchcancel', clear);
      document.removeEventListener('mouseleave', clear);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
