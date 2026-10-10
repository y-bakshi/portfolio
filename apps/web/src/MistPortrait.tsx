import { useEffect, useRef, useState } from 'react';

type RGB = [number, number, number];

const SAMPLE_WIDTH = 420;
// where the face sits in the portrait, so it gets more particles and stays recognisable
const FACE = { cx: 0.35, cy: 0.31, rx: 0.15, ry: 0.16 };
const FORM_MS = 3600;
const STAGGER = 0.38;
const REPEL_RADIUS = 80;
// The finished engraving is drawn as small tiles so the pointer can push the picture itself aside.
const TILE = 5;
const TILE_PUSH = 5.5;
// Particles are drawn in a few alpha buckets, one path each, instead of one style change per particle.
const BUCKETS = 16;

const token = (name: string, fallback: RGB): RGB => {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

type P = {
  sx: number; // position on the unit sphere
  sy: number;
  sz: number;
  tx: number; // target in image space, 0..1
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
 * The pointer pushes particles and the picture itself aside and they spring back. Once the portrait
 * is formed and nothing is moving the animation loop stops, so it costs nothing while idle. With
 * reduced motion the finished image is shown as a plain picture instead.
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
    const small = window.innerWidth < 700;
    const count = small ? 9000 : 24000;

    let particles: P[] = [];
    let cw = 0;
    let ch = 0;
    let frame = 0;
    let started = 0; // timestamp when formation began, 0 = not yet
    let visible = false;
    let mouse: { x: number; y: number } | null = null;
    let dead = false;
    let portrait: HTMLImageElement | null = null;
    let tilesX = 0;
    let tilesY = 0;
    let tileState = new Float32Array(0); // ox, oy, vx, vy per tile
    const buckets = Array.from({ length: BUCKETS }, () => ({
      x: [] as number[],
      y: [] as number[],
      s: [] as number[],
    }));

    const sampleImage = (img: HTMLImageElement) => {
      const w = SAMPLE_WIDTH;
      const h = Math.round((SAMPLE_WIDTH * img.naturalHeight) / img.naturalWidth);
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const octx = off.getContext('2d', { willReadFrequently: true })!;
      octx.drawImage(img, 0, 0, w, h);
      const data = octx.getImageData(0, 0, w, h).data;

      const cand: { x: number; y: number; d: number }[] = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const a = data[i + 3] / 255;
          if (a < 0.05) continue;
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // soft, feathered edges in the image carry through as fewer particles near them
          const d = Math.min(1, Math.max(0, (232 - lum) / 200)) * a;
          if (d > 0.1) cand.push({ x, y, d });
        }
      }

      const out: P[] = [];
      const golden = Math.PI * (3 - Math.sqrt(5));
      let guard = 0;
      while (out.length < count && guard++ < count * 60) {
        const c = cand[(Math.random() * cand.length) | 0];
        const fx = (c.x / w - FACE.cx) / FACE.rx;
        const fy = (c.y / h - FACE.cy) / FACE.ry;
        const face = Math.exp(-(fx * fx + fy * fy));
        if (Math.random() > c.d ** 0.7 * (0.22 + 0.78 * face)) continue;
        const k = out.length;
        const yy = 1 - (k / (count - 1)) * 2;
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = rect.width;
      ch = rect.height;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tilesX = Math.ceil(cw / TILE);
      tilesY = Math.ceil(ch / TILE);
      tileState = new Float32Array(tilesX * tilesY * 4);
    };

    const paint = (now: number) => {
      frame = 0;
      if (dead) return;
      ctx.clearRect(0, 0, cw, ch);
      const t = started ? Math.min(1, Math.max(0, (now - started) / FORM_MS)) : 0;
      const formed = t >= 1;
      const spin = now * 0.00035;
      const cos = Math.cos(spin);
      const sin = Math.sin(spin);
      const R = Math.min(cw, ch) * 0.36;
      const cx = cw / 2;
      const cy = ch / 2;
      const mx = mouse?.x ?? -9999;
      const my = mouse?.y ?? -9999;
      let moving = false;

      // 1. the finished engraving fades in under the particles, drawn as tiles the pointer can push
      const resolve = Math.min(1, Math.max(0, (t - 0.68) / 0.32));
      if (portrait && resolve > 0) {
        let tilesMoving = false;
        for (let j = 0; j < tilesY; j++) {
          for (let i = 0; i < tilesX; i++) {
            const k = (j * tilesX + i) * 4;
            const x = (i + 0.5) * TILE + tileState[k];
            const y = (j + 0.5) * TILE + tileState[k + 1];
            const dx = x - mx;
            const dy = y - my;
            const dist = Math.hypot(dx, dy);
            if (dist < REPEL_RADIUS && dist > 0.01) {
              const f = (1 - dist / REPEL_RADIUS) ** 2 * TILE_PUSH;
              tileState[k + 2] += (dx / dist) * f;
              tileState[k + 3] += (dy / dist) * f;
            }
            tileState[k] = (tileState[k] + tileState[k + 2]) * 0.93;
            tileState[k + 1] = (tileState[k + 1] + tileState[k + 3]) * 0.93;
            tileState[k + 2] *= 0.8;
            tileState[k + 3] *= 0.8;
            if (Math.abs(tileState[k]) > 0.25 || Math.abs(tileState[k + 1]) > 0.25) {
              tilesMoving = true;
            }
          }
        }
        if (tilesMoving) moving = true;

        const imageAlpha = resolve * resolve * (3 - 2 * resolve);
        ctx.globalAlpha = imageAlpha;
        // The whole picture goes down in one call; only tiles that have been pushed are cut out and
        // redrawn at their displaced position, so a stir touches hundreds of tiles, not thousands.
        ctx.drawImage(portrait, 0, 0, cw, ch);
        if (tilesMoving) {
          const sx = portrait.naturalWidth / cw;
          const sy = portrait.naturalHeight / ch;
          const pushed: number[] = [];
          ctx.globalAlpha = 1;
          for (let j = 0; j < tilesY; j++) {
            for (let i = 0; i < tilesX; i++) {
              const k = (j * tilesX + i) * 4;
              if (Math.abs(tileState[k]) > 0.25 || Math.abs(tileState[k + 1]) > 0.25) {
                ctx.clearRect(i * TILE - 0.3, j * TILE - 0.3, TILE + 0.6, TILE + 0.6);
                pushed.push(i, j);
              }
            }
          }
          ctx.globalAlpha = imageAlpha;
          for (let n = 0; n < pushed.length; n += 2) {
            const i = pushed[n];
            const j = pushed[n + 1];
            const k = (j * tilesX + i) * 4;
            ctx.drawImage(
              portrait,
              i * TILE * sx,
              j * TILE * sy,
              TILE * sx,
              TILE * sy,
              i * TILE + tileState[k],
              j * TILE + tileState[k + 1],
              TILE + 0.6,
              TILE + 0.6,
            );
          }
        }
        ctx.globalAlpha = 1;
      }

      // 2. particles, sorted into alpha buckets so each bucket is one path and one fill
      const grain = 1 - 0.6 * resolve;
      for (const b of buckets) {
        b.x.length = 0;
        b.y.length = 0;
        b.s.length = 0;
      }
      for (const p of particles) {
        const local = Math.min(1, Math.max(0, (t - p.delay) / (1 - STAGGER)));
        const e = ease(local);

        // a rotating sphere with a slow suspended drift that dies away as the portrait forms
        const mist = 7.5 * (1 - e);
        const rx = p.sx * cos + p.sz * sin;
        const rz = -p.sx * sin + p.sz * cos;
        const persp = 1 / (1 - rz * 0.28);
        const spx = cx + rx * R * persp + Math.sin(now * 0.0011 + p.seed) * mist;
        const spy = cy + p.sy * R * persp + Math.cos(now * 0.0013 + p.seed * 1.7) * mist;

        const tx = p.tx * cw;
        const ty = p.ty * ch;
        let x = spx + (tx - spx) * e;
        let y = spy + (ty - spy) * e;

        // the pointer pushes nearby particles aside; they spring back
        const dx = x + p.ox - mx;
        const dy = y + p.oy - my;
        const dist = Math.hypot(dx, dy);
        if (dist < REPEL_RADIUS && dist > 0.01) {
          const f = (1 - dist / REPEL_RADIUS) ** 2 * 3.2;
          p.vx += (dx / dist) * f;
          p.vy += (dy / dist) * f;
        }
        p.ox = (p.ox + p.vx) * 0.92;
        p.oy = (p.oy + p.vy) * 0.92;
        p.vx *= 0.8;
        p.vy *= 0.8;
        if (Math.abs(p.ox) > 0.05 || Math.abs(p.oy) > 0.05) moving = true;
        x += p.ox;
        y += p.oy;

        // depth fades the far side of the sphere; the finished portrait uses tone as opacity
        const depth = 0.5 + 0.5 * rz;
        const mistAlpha = 0.18 + 0.5 * depth;
        const portraitAlpha = 0.45 + 0.5 * p.dark;
        const alpha = (mistAlpha + (portraitAlpha - mistAlpha) * e) * grain;
        const size = (1 + depth * 0.7) * (1 - e) + (1.1 + p.dark * 0.8) * e;
        const bucket = buckets[Math.min(BUCKETS - 1, Math.max(0, (alpha * BUCKETS) | 0))];
        bucket.x.push(x);
        bucket.y.push(y);
        bucket.s.push(size);
      }
      for (let b = 0; b < BUCKETS; b++) {
        const { x, y, s } = buckets[b];
        if (!x.length) continue;
        ctx.fillStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${((b + 0.5) / BUCKETS).toFixed(3)})`;
        ctx.beginPath();
        for (let i = 0; i < x.length; i++) ctx.rect(x[i] - s[i] / 2, y[i] - s[i] / 2, s[i], s[i]);
        ctx.fill();
      }

      // Keep animating while forming, while the pointer is over the portrait, or while anything is
      // still springing back. Once formed and at rest, stop and draw nothing until the next move.
      if (visible && (!formed || mouse || moving)) frame = requestAnimationFrame(paint);
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
      wake();
    };
    const onLeave = () => {
      mouse = null;
      wake();
    };

    const ro = new ResizeObserver(() => {
      resize();
      wake();
    });

    const img = new Image();
    img.onload = () => {
      if (dead) return;
      portrait = img;
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
