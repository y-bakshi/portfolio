import { useEffect, useRef, useState } from 'react';

type RGB = [number, number, number];

const PARTICLES = 17000;
const SAMPLE_WIDTH = 260;
const FORM_MS = 3600;
const STAGGER = 0.38;
const REPEL_RADIUS = 80;

const token = (name: string, fallback: RGB): RGB => {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

type P = {
  // sphere position on the unit sphere
  sx: number;
  sy: number;
  sz: number;
  // target in image space, 0..1
  tx: number;
  ty: number;
  dark: number;
  delay: number;
  seed: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
};

/**
 * The portrait condenses out of a rotating sphere of suspended particles when it scrolls into view.
 * The pointer pushes particles aside and they drift back. With reduced motion the finished image is
 * shown as a plain picture instead.
 */
export function MistPortrait({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [still, setStill] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (still) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const INK = token('--ink', [20, 33, 27]);
    let particles: P[] = [];
    let cw = 0;
    let ch = 0;
    let frame = 0;
    let started = 0; // timestamp when formation began, 0 = not yet
    let visible = false;
    let mouse: { x: number; y: number } | null = null;
    let dead = false;

    const sampleImage = (img: HTMLImageElement) => {
      const w = SAMPLE_WIDTH;
      const h = Math.round((SAMPLE_WIDTH * img.naturalHeight) / img.naturalWidth);
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const octx = off.getContext('2d', { willReadFrequently: true })!;
      octx.drawImage(img, 0, 0, w, h);
      const data = octx.getImageData(0, 0, w, h).data;

      // darkness 0..1 per pixel, only where the portrait has pixels
      const cand: { x: number; y: number; d: number }[] = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          if (data[i + 3] < 128) continue;
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const d = Math.min(1, Math.max(0, (232 - lum) / 200));
          if (d > 0.1) cand.push({ x, y, d });
        }
      }

      const out: P[] = [];
      const golden = Math.PI * (3 - Math.sqrt(5));
      let guard = 0;
      while (out.length < PARTICLES && guard++ < PARTICLES * 60) {
        const c = cand[(Math.random() * cand.length) | 0];
        if (Math.random() > c.d ** 0.7) continue;
        const k = out.length;
        const yy = 1 - (k / (PARTICLES - 1)) * 2;
        const rr = Math.sqrt(1 - yy * yy);
        const th = golden * k;
        out.push({
          sx: Math.cos(th) * rr,
          sy: yy,
          sz: Math.sin(th) * rr,
          tx: (c.x + Math.random()) / w,
          ty: (c.y + Math.random()) / h,
          dark: c.d,
          delay: Math.random() * STAGGER,
          seed: Math.random() * 1000,
          ox: 0,
          oy: 0,
          vx: 0,
          vy: 0,
        });
      }
      particles = out;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      cw = rect.width;
      ch = rect.height;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = (now: number) => {
      frame = 0;
      if (dead) return;
      ctx.clearRect(0, 0, cw, ch);
      const t = started ? Math.min(1, (now - started) / FORM_MS) : 0;
      const spin = now * 0.00035;
      const cos = Math.cos(spin);
      const sin = Math.sin(spin);
      const R = Math.min(cw, ch) * 0.36;
      const cx = cw / 2;
      const cy = ch / 2;
      const mx = mouse?.x ?? -9999;
      const my = mouse?.y ?? -9999;

      for (const p of particles) {
        const local = Math.min(1, Math.max(0, (t - p.delay) / (1 - STAGGER)));
        const e = ease(local);

        // rotating sphere with a slow suspended drift
        const mist = 7 * (1 - e) + 0.5;
        const rx = p.sx * cos + p.sz * sin;
        const rz = -p.sx * sin + p.sz * cos;
        const persp = 1 / (1 - rz * 0.28);
        const spx = cx + rx * R * persp + Math.sin(now * 0.0011 + p.seed) * mist;
        const spy = cy + p.sy * R * persp + Math.cos(now * 0.0013 + p.seed * 1.7) * mist;

        const tx = p.tx * cw;
        const ty = p.ty * ch;
        let x = spx + (tx - spx) * e;
        let y = spy + (ty - spy) * e;

        // pointer pushes nearby particles aside; they spring back
        const dx = x + p.ox - mx;
        const dy = y + p.oy - my;
        const dist = Math.hypot(dx, dy);
        if (dist < REPEL_RADIUS && dist > 0.01) {
          const f = (1 - dist / REPEL_RADIUS) ** 2 * 3.2;
          p.vx += (dx / dist) * f;
          p.vy += (dy / dist) * f;
        }
        p.ox += p.vx;
        p.oy += p.vy;
        p.vx *= 0.8;
        p.vy *= 0.8;
        p.ox *= 0.92;
        p.oy *= 0.92;
        x += p.ox;
        y += p.oy;

        // depth fades the far side of the sphere; the finished portrait uses tone as opacity
        const depth = 0.5 + 0.5 * rz;
        const mistAlpha = 0.18 + 0.5 * depth;
        const portraitAlpha = 0.45 + 0.5 * p.dark;
        const alpha = mistAlpha + (portraitAlpha - mistAlpha) * e;
        const size = (1 + depth * 0.7) * (1 - e) + (1.3 + p.dark * 0.9) * e;
        ctx.fillStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${alpha.toFixed(2)})`;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }

      if (visible) frame = requestAnimationFrame(paint);
    };

    const wake = () => {
      if (!frame && !dead) frame = requestAnimationFrame(paint);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          if (!started) started = performance.now() + 250;
          wake();
        }
      },
      { threshold: 0.35 },
    );

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => {
      mouse = null;
    };

    const ro = new ResizeObserver(() => {
      resize();
      wake();
    });

    const img = new Image();
    img.onload = () => {
      if (dead) return;
      sampleImage(img);
      resize();
      ro.observe(canvas);
      observer.observe(canvas);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerleave', onLeave);
      wake();
    };
    img.onerror = () => setStill(true);
    img.src = src;

    return () => {
      dead = true;
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [src, still]);

  if (still) {
    return <img className="mist-fallback" src={src} width={width} height={height} alt={alt} />;
  }

  return (
    <canvas
      ref={canvasRef}
      className="mist"
      role="img"
      aria-label={alt}
      style={{ aspectRatio: `${width} / ${height}` }}
    />
  );
}
