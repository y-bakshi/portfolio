import { useEffect, useRef, useState } from 'react';
import { FORM_MS, TILE, token, type P } from './portrait/config';
import { drawBuckets, makeBuckets, stepParticles } from './portrait/particles';
import { sampleParticles } from './portrait/sample';
import {
  drawSpecks,
  springTiles,
  tileTones,
  wakeTiles,
  makeSpecks,
  type TileField,
} from './portrait/tiles';

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

    const INK = token('--ink', [14, 29, 97]);
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
    let tileActive = new Uint8Array(0);
    let tileDark = new Float32Array(0); // tone of each tile, 0 = ground, 1 = full ink
    let activeTiles: number[] = [];
    let ready = false; // particles sampled
    let stride = 1; // draw every Nth particle; raised if frames run long
    let lastNow = 0;
    let smoothedDt = 16.7;
    let measured = 0;
    const specks = makeSpecks();
    const buckets = makeBuckets();

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
      tileActive = new Uint8Array(tilesX * tilesY);
      activeTiles = [];
      tileDark = new Float32Array(tilesX * tilesY);
      // a hidden canvas has no size, and reading pixels from nothing throws
      if (portrait && tilesX > 0 && tilesY > 0) tileDark = tileTones(portrait, tilesX, tilesY);
    };

    const paint = (now: number) => {
      frame = 0;
      if (dead) return;

      // If frames are running long, draw every other particle so slower devices stay smooth.
      if (lastNow && now - lastNow < 100) {
        smoothedDt = smoothedDt * 0.9 + (now - lastNow) * 0.1;
        if (++measured > 30 && smoothedDt > 40 && stride === 1) stride = 2; // under about 25 fps
      }
      lastNow = now;
      ctx.clearRect(0, 0, cw, ch);
      const t = started ? Math.min(1, Math.max(0, (now - started) / FORM_MS)) : 0;
      const formed = t >= 1;
      const mx = mouse?.x ?? -9999;
      const my = mouse?.y ?? -9999;
      let moving = false;

      // 1. the finished engraving fades in under the particles; the pointer breaks it into specks
      const resolve = Math.min(1, Math.max(0, (t - 0.68) / 0.32));
      if (portrait && resolve > 0) {
        const imageAlpha = resolve * resolve * (3 - 2 * resolve);

        const field: TileField = {
          tilesX,
          tilesY,
          state: tileState,
          active: tileActive,
          list: activeTiles,
          dark: tileDark,
        };
        if (mouse) wakeTiles(field, mx, my);
        springTiles(field, mx, my);
        if (activeTiles.length) moving = true;

        // the whole picture goes down in one call, then pushed tiles are cut out of it
        ctx.globalAlpha = imageAlpha;
        ctx.drawImage(portrait, 0, 0, cw, ch);
        if (activeTiles.length) drawSpecks(ctx, field, specks, INK, imageAlpha);
        ctx.globalAlpha = 1;
      }

      // 2. particles
      if (stepParticles({ particles, buckets, t, resolve, now, cw, ch, mx, my, stride }))
        moving = true;
      drawBuckets(ctx, buckets, INK);

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
          if (ready && !started) started = performance.now() + 250;
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
      resize();
      ro.observe(canvas);
      observer.observe(canvas);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerleave', onLeave);
      sampleParticles(img, count, () => dead).then((out) => {
        if (!out || dead) return;
        particles = out;
        ready = true;
        if (visible && !started) started = performance.now() + 250;
        wake();
      });
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
    return <img src={src} width={width} height={height} alt={alt} />;
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
