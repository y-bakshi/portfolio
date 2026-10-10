import { useEffect, useRef } from 'react';

const SPACING = 14;
const RADIUS = 130;
const BASE_ALPHA = 0.15;
const PEAK_ALPHA = 0.9;
type RGB = [number, number, number];

/** Reads a hex colour token such as --ink from the stylesheet, so the dots follow the design tokens. */
const token = (name: string, fallback: RGB): RGB => {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

type Dot = { x: number; y: number; b: number };

/**
 * A page-wide dot grid fixed behind the content. The pointer anywhere on the page brightens and
 * enlarges the dots near it, with an eased falloff. Skipped when the visitor prefers reduced motion.
 */
export function DotGrid({ scope = 'page' }: { scope?: 'page' | 'header' }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Dots use --ink, the same colour as the portrait's line work. Lit dots get darker and larger.
    const INK = token('--ink', [20, 33, 27]);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let mouse: { x: number; y: number } | null = null;
    let frame = 0;
    let lastMove = 0;

    const build = () => {
      const dpr = window.devicePixelRatio || 1;
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
        for (let c = 0; c < cols; c++)
          dots.push({ x: ox + c * SPACING, y: oy + r * SPACING, b: 0 });
      }
    };

    const paint = (now: number = performance.now()) => {
      ctx.clearRect(0, 0, width, height);
      const mx = mouse?.x ?? -99999;
      const my = mouse?.y ?? -99999;
      let busy = false;
      const lit: Dot[] = [];

      // Dots at rest share one style, so they go into a single path and a single fill.
      ctx.fillStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${BASE_ALPHA})`;
      ctx.beginPath();
      for (const d of dots) {
        const dx = d.x - mx;
        const dy = d.y - my;
        const dist = Math.hypot(dx, dy);
        const target = dist < RADIUS ? (1 - dist / RADIUS) ** 1.5 : 0;
        d.b += (target > d.b ? 0.16 : 0.07) * (target - d.b);
        if (d.b < 0.004) {
          d.b = 0;
          ctx.rect(d.x - 0.6, d.y - 0.6, 1.2, 1.2);
        } else {
          busy = true;
          lit.push(d);
        }
      }
      ctx.fill();

      // Only the few dots near the pointer need their own size and opacity.
      for (const d of lit) {
        const alpha = BASE_ALPHA + (PEAK_ALPHA - BASE_ALPHA) * d.b;
        const size = 1.2 + d.b * 1.5;
        ctx.fillStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${alpha.toFixed(2)})`;
        ctx.fillRect(d.x - size / 2, d.y - size / 2, size, size);
      }

      // Keep animating while the pointer is moving or dots are still fading; then stop.
      const active = mouse !== null && now - lastMove < 350;
      frame = active || busy ? requestAnimationFrame(paint) : 0;
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
      className={scope === 'header' ? 'dotgrid dotgrid-header' : 'dotgrid'}
      aria-hidden="true"
    />
  );
}
