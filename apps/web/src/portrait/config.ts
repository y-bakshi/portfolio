import { PUSH_RADIUS } from '../pointerPush';

export type RGB = [number, number, number];

export const SAMPLE_WIDTH = 420;
// How far the canvas reaches past the picture on every side, so particles and specks pushed off the
// edge keep going instead of being cut off in a straight line.
export const BLEED = 48;
// where the face sits in the portrait, so it gets more particles and stays recognisable
export const FACE = { cx: 0.35, cy: 0.31, rx: 0.15, ry: 0.16 };
export const FORM_MS = 3200;
export const STAGGER = 0.38;
export const REPEL_RADIUS = PUSH_RADIUS; // shared with the background dots
// Where the pointer pushes the finished engraving it comes apart into small round specks of the
// picture's own tone, which spring back into place. Only tiles near the pointer are ever active.
export const TILE = 4;
export const TILE_PUSH = 5.5;
// Particles are drawn in a few alpha buckets, one path each, instead of one style change per particle.
export const BUCKETS = 16;
export const SPECK_BUCKETS = 8;

export const token = (name: string, fallback: RGB): RGB => {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// ease-out: the mist starts moving at once instead of lingering at the start
export const ease = (t: number) => 1 - (1 - t) ** 3;

export type P = {
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
