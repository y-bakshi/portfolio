import { useEffect, useRef } from 'react';

// tune: lower the divisor to add more dots
const DENSITY = 1 / 120;
// tune: raise to permit more dots on large screens
const MAX_DOTS = 3000;
// tune: raise to widen pointer influence
const RADIUS = 200;
// tune: raise to connect dots across larger gaps
const NEIGHBOUR_D = 35;
const BASE_ALPHA = 0.28;
const PEAK_ALPHA = 0.14;

type Dot = { x: number; y: number; b: number };
type Pair = [Dot, Dot];
type RGB = [number, number, number];

/** Reads a hex colour token such as --ink from the stylesheet, so the field follows the design tokens. */
const token = (name: string, fallback: RGB): RGB => {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/**
 * A page-wide field of granular dots fixed behind the content. Dots near the pointer change
 * brightness and faint lines join the lit neighbours. Static under reduced motion.
 */
export function NoiseBg() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const INK = token('--ink', [20, 33, 27]);
    const rgb = `${INK[0]},${INK[1]},${INK[2]}`;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dots: Dot[] = [];
    let pairs: Pair[] = [];
    let width = 0;
    let height = 0;
    let mouse: { x: number; y: number } | null = null;
    let frame = 0;

    const build = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(Math.round(width * height * DENSITY), MAX_DOTS);
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        b: 0,
      }));

      const nd2 = NEIGHBOUR_D * NEIGHBOUR_D;
      pairs = [];
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          if (dx * dx + dy * dy < nd2) pairs.push([dots[i], dots[j]]);
        }
      }
    };

    const paint = () => {
      ctx.clearRect(0, 0, width, height);
      const mx = mouse?.x ?? -99999;
      const my = mouse?.y ?? -99999;
      const r2 = RADIUS * RADIUS;
      let busy = false;

      for (const d of dots) {
        const dx = d.x - mx;
        const dy = d.y - my;
        const dist2 = dx * dx + dy * dy;
        const target = dist2 < r2 ? Math.exp(-dist2 / (r2 * 0.25)) : 0;
        d.b += (target > d.b ? 0.16 : 0.07) * (target - d.b);
        if (d.b < 0.004) d.b = 0;
        else busy = true;

        const alpha = BASE_ALPHA + (PEAK_ALPHA - BASE_ALPHA) * d.b;
        const size = 0.8 + d.b * 0.6;
        ctx.fillStyle = `rgba(${rgb},${alpha.toFixed(2)})`;
        ctx.fillRect(d.x - size / 2, d.y - size / 2, size, size);
      }

      if (busy) {
        ctx.lineWidth = 0.5;
        for (const [a, b] of pairs) {
          if (a.b < 0.05 || b.b < 0.05) continue;
          ctx.strokeStyle = `rgba(${rgb},${(Math.min(a.b, b.b) * 0.1).toFixed(2)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      frame = mouse || busy ? requestAnimationFrame(paint) : 0;
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onMove = (e: MouseEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
      wake();
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) {
        mouse = { x: t.clientX, y: t.clientY };
        wake();
      }
    };
    const clear = () => {
      mouse = null;
      wake();
    };
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        build();
        wake();
      }, 120);
    };

    build();
    paint();
    window.addEventListener('resize', onResize);
    if (!reduce) {
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('touchmove', onTouch, { passive: true });
      window.addEventListener('touchend', clear, { passive: true });
      window.addEventListener('touchcancel', clear, { passive: true });
      document.addEventListener('mouseleave', clear);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend', clear);
      window.removeEventListener('touchcancel', clear);
      document.removeEventListener('mouseleave', clear);
    };
  }, []);

  return <canvas ref={ref} className="dotgrid" aria-hidden="true" />;
}
