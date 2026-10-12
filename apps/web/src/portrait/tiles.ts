import { REPEL_RADIUS, SPECK_BUCKETS, TILE, TILE_PUSH, type RGB } from './config';

/**
 * The finished engraving is cut into small square tiles. Only tiles near the pointer are ever
 * active; they spring away from it and back, and are drawn as round specks while they move.
 */
export type TileField = {
  tilesX: number;
  tilesY: number;
  /** ox, oy, vx, vy for each tile */
  state: Float32Array;
  active: Uint8Array;
  /** indexes of the tiles that are awake */
  list: number[];
  /** tone of each tile, 0 = ground, 1 = full ink */
  dark: Float32Array;
};

export type Specks = { x: number[]; y: number[] }[];

export const makeSpecks = (): Specks =>
  Array.from({ length: SPECK_BUCKETS }, () => ({ x: [], y: [] }));

/** The tone of every tile, read from the portrait scaled down to one pixel per tile. */
export function tileTones(portrait: HTMLImageElement, tilesX: number, tilesY: number) {
  const dark = new Float32Array(tilesX * tilesY);
  const off = document.createElement('canvas');
  off.width = tilesX;
  off.height = tilesY;
  const octx = off.getContext('2d', { willReadFrequently: true })!;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(portrait, 0, 0, tilesX, tilesY);
  const data = octx.getImageData(0, 0, tilesX, tilesY).data;
  for (let k = 0; k < dark.length; k++) {
    const lum = 0.299 * data[k * 4] + 0.587 * data[k * 4 + 1] + 0.114 * data[k * 4 + 2];
    const tone = Math.min(1, Math.max(0, (232 - lum) / 200));
    dark[k] = tone * (data[k * 4 + 3] / 255);
  }
  return dark;
}

/** Wake the tiles under the pointer. */
export function wakeTiles(f: TileField, mx: number, my: number) {
  const reach = REPEL_RADIUS;
  const i0 = Math.max(0, Math.floor((mx - reach) / TILE));
  const i1 = Math.min(f.tilesX - 1, Math.ceil((mx + reach) / TILE));
  const j0 = Math.max(0, Math.floor((my - reach) / TILE));
  const j1 = Math.min(f.tilesY - 1, Math.ceil((my + reach) / TILE));
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const k = j * f.tilesX + i;
      if (f.active[k]) continue;
      if (((i + 0.5) * TILE - mx) ** 2 + ((j + 0.5) * TILE - my) ** 2 < reach * reach) {
        f.active[k] = 1;
        f.list.push(k);
      }
    }
  }
}

/** Spring the active tiles; tiles that have come to rest go back to sleep. */
export function springTiles(f: TileField, mx: number, my: number) {
  const { state, active, list, tilesX } = f;
  for (let n = list.length - 1; n >= 0; n--) {
    const k = list[n];
    const b = k * 4;
    const i = k % tilesX;
    const j = (k / tilesX) | 0;
    const dx = (i + 0.5) * TILE + state[b] - mx;
    const dy = (j + 0.5) * TILE + state[b + 1] - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < REPEL_RADIUS && dist > 0.01) {
      const force = (1 - dist / REPEL_RADIUS) ** 2 * TILE_PUSH;
      state[b + 2] += (dx / dist) * force;
      state[b + 3] += (dy / dist) * force;
    }
    state[b] = (state[b] + state[b + 2]) * 0.93;
    state[b + 1] = (state[b + 1] + state[b + 3]) * 0.93;
    state[b + 2] *= 0.8;
    state[b + 3] *= 0.8;
    if (
      Math.abs(state[b]) < 0.25 &&
      Math.abs(state[b + 1]) < 0.25 &&
      Math.abs(state[b + 2]) < 0.1 &&
      Math.abs(state[b + 3]) < 0.1
    ) {
      state[b] = state[b + 1] = state[b + 2] = state[b + 3] = 0;
      active[k] = 0;
      list[n] = list[list.length - 1];
      list.pop();
    }
  }
}

/** Cut the awake tiles out of the picture and draw them again as round specks of the picture's tone. */
export function drawSpecks(
  ctx: CanvasRenderingContext2D,
  f: TileField,
  specks: Specks,
  ink: RGB,
  alpha: number,
) {
  const { state, list, dark, tilesX } = f;
  ctx.globalAlpha = 1;
  for (const k of list) {
    const i = k % tilesX;
    const j = (k / tilesX) | 0;
    ctx.clearRect(i * TILE - 0.3, j * TILE - 0.3, TILE + 0.6, TILE + 0.6);
  }
  // grouped by tone so each group is one path and one fill
  for (const sb of specks) {
    sb.x.length = 0;
    sb.y.length = 0;
  }
  for (const k of list) {
    const tone = dark[k];
    if (tone < 0.06) continue;
    const i = k % tilesX;
    const j = (k / tilesX) | 0;
    const sb = specks[Math.min(SPECK_BUCKETS - 1, (tone * SPECK_BUCKETS) | 0)];
    sb.x.push((i + 0.5) * TILE + state[k * 4]);
    sb.y.push((j + 0.5) * TILE + state[k * 4 + 1]);
  }
  const r = TILE * 0.6;
  for (let b = 0; b < SPECK_BUCKETS; b++) {
    const sb = specks[b];
    if (!sb.x.length) continue;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${Math.min(1, ((b + 0.5) / SPECK_BUCKETS) * 1.25).toFixed(3)})`;
    ctx.beginPath();
    for (let n = 0; n < sb.x.length; n++) {
      ctx.moveTo(sb.x[n] + r, sb.y[n]);
      ctx.arc(sb.x[n], sb.y[n], r, 0, Math.PI * 2);
    }
    ctx.fill();
  }
}
