import { useEffect, useRef, useState } from 'react';
import { BLEED, FORM_MS, TILE, token, type P } from './portrait/config';
import { makePacer } from './portrait/pace';
import { PortraitCanvas } from './portrait/PortraitCanvas';
import { drawBuckets, makeBuckets, stepParticles } from './portrait/particles';
import { sampleParticles, smallCanvas } from './portrait/sample';
import {
  drawSpecks,
  springTiles,
  tileTones,
  wakeTiles,
  makeSpecks,
  type TileField,
} from './portrait/tiles';

/**
 * The portrait condenses out of a rotating sphere of particles when it scrolls into view. The pointer
 * pushes particles and the picture aside and they spring back. Once formed and at rest the loop stops.
 * With reduced motion the finished image is shown as a plain picture.
 */
export function MistPortrait({
  src,
  alt,
  width,
  height,
  onFormed,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Called once, when the portrait is finished or is shown as a plain picture. */
  onFormed?: () => void;
}) {
  const formedRef = useRef(onFormed);
  formedRef.current = onFormed;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [still, setStill] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (still || !canvas || !ctx) {
      formedRef.current?.(); // a plain picture is finished at once
      return;
    }

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
    let announced = false;
    let portrait: HTMLImageElement | null = null;
    let tilesX = 0;
    let tilesY = 0;
    let tileState = new Float32Array(0); // ox, oy, vx, vy per tile
    let tileActive = new Uint8Array(0);
    let tileDark = new Float32Array(0); // tone of each tile, 0 = ground, 1 = full ink
    let activeTiles: number[] = [];
    let ready = false; // particles sampled
    const pace = makePacer();
    const specks = makeSpecks();
    const buckets = makeBuckets();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // the canvas reaches BLEED past the picture on every side, so specks pushed off the edge keep going
      cw = rect.width - 2 * BLEED;
      ch = rect.height - 2 * BLEED;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, BLEED * dpr, BLEED * dpr);
      tilesX = Math.ceil(cw / TILE);
      tilesY = Math.ceil(ch / TILE);
      tileState = new Float32Array(tilesX * tilesY * 4);
      tileActive = new Uint8Array(tilesX * tilesY);
      activeTiles = [];
      tileDark = new Float32Array(tilesX * tilesY);
      // a hidden canvas has no size, and reading pixels from nothing throws
      if (portrait && tilesX > 0 && tilesY > 0)
        tileDark = tileTones(smallCanvas(portrait), tilesX, tilesY);
    };

    const paint = (now: number) => {
      frame = 0;
      if (dead) return;

      // if frames are running long, draw every other particle so slower devices stay smooth
      const stride = pace(now);
      ctx.clearRect(-BLEED, -BLEED, cw + 2 * BLEED, ch + 2 * BLEED);
      const t = started ? Math.min(1, Math.max(0, (now - started) / FORM_MS)) : 0;
      const formed = t >= 1;
      if (formed && !announced) {
        announced = true;
        formedRef.current?.();
      }
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
      mouse = { x: e.clientX - r.left - BLEED, y: e.clientY - r.top - BLEED };
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

  return <PortraitCanvas canvasRef={canvasRef} width={width} height={height} alt={alt} />;
}
