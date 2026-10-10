import { useEffect, useRef } from 'react';

const SPACING = 20;
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
export function DotGrid() {
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

    const build = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const cols = Math.floor(width / SPACING) + 2;
      const rows = Math.floor(height / SPACING) + 2;
      const ox = (width % SPACING) / 2;
      const oy = (height % SPACING) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++)
          dots.push({ x: ox + c * SPACING, y: oy + r * SPACING, b: 0 });
      }
    };

    const paint = () => {
      ctx.clearRect(0, 0, width, height);
      const mx = mouse?.x ?? -99999;
      const my = mouse?.y ?? -99999;
      let busy = false;
      for (const d of dots) {
        const dx = d.x - mx;
        const dy = d.y - my;
        const dist = Math.hypot(dx, dy);
        const target = dist < RADIUS ? (1 - dist / RADIUS) ** 1.5 : 0;
        d.b += (target > d.b ? 0.16 : 0.07) * (target - d.b);
        if (d.b < 0.004) d.b = 0;
        else busy = true;
        const alpha = BASE_ALPHA + (PEAK_ALPHA - BASE_ALPHA) * d.b;
        const size = 1.4 + d.b * 1.6;
        ctx.fillStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${alpha.toFixed(2)})`;
        ctx.fillRect(d.x - size / 2, d.y - size / 2, size, size);
      }
      // Keep animating while the pointer is down on the page or dots are still fading.
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
    const onResize = () => {
      build();
      wake();
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
