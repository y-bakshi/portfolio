import { BUCKETS, REPEL_RADIUS, STAGGER, ease, type P, type RGB } from './config';

export type Buckets = { x: number[]; y: number[]; s: number[] }[];

export const makeBuckets = (): Buckets =>
  Array.from({ length: BUCKETS }, () => ({ x: [], y: [], s: [] }));

type Step = {
  particles: P[];
  buckets: Buckets;
  /** formation progress, 0..1 */
  t: number;
  /** how far the finished engraving has faded in, 0..1 */
  resolve: number;
  now: number;
  cw: number;
  ch: number;
  mx: number;
  my: number;
  /** draw every Nth particle */
  stride: number;
};

/**
 * Moves every particle for one frame and sorts it into an alpha bucket. Returns true while any
 * particle is still springing back from the pointer.
 */
export function stepParticles(a: Step): boolean {
  const { particles, buckets, t, resolve, now, cw, ch, mx, my, stride } = a;
  const spin = now * 0.00035;
  const cos = Math.cos(spin);
  const sin = Math.sin(spin);
  const R = Math.min(cw, ch) * 0.36;
  const cx = cw / 2;
  const cy = ch / 2;
  let moving = false;

  // particles, sorted into alpha buckets so each bucket is one path and one fill
  const grain = 1 - 0.6 * resolve;
  for (const b of buckets) {
    b.x.length = 0;
    b.y.length = 0;
    b.s.length = 0;
  }
  for (let n = 0; n < particles.length; n += stride) {
    const p = particles[n];
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
    const dist = Math.sqrt(dx * dx + dy * dy);
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
    const size =
      ((1 + depth * 0.7) * (1 - e) + (1.1 + p.dark * 0.8) * e) * (1 + (stride - 1) * 0.35);
    const bucket = buckets[Math.min(BUCKETS - 1, Math.max(0, (alpha * BUCKETS) | 0))];
    bucket.x.push(x);
    bucket.y.push(y);
    bucket.s.push(size);
  }
  return moving;
}

/** One path and one fill per alpha bucket. */
export function drawBuckets(ctx: CanvasRenderingContext2D, buckets: Buckets, ink: RGB) {
  for (let b = 0; b < BUCKETS; b++) {
    const { x, y, s } = buckets[b];
    if (!x.length) continue;
    ctx.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${((b + 0.5) / BUCKETS).toFixed(3)})`;
    ctx.beginPath();
    for (let i = 0; i < x.length; i++) ctx.rect(x[i] - s[i] / 2, y[i] - s[i] / 2, s[i], s[i]);
    ctx.fill();
  }
}
