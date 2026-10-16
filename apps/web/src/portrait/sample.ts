import { FACE, SAMPLE_WIDTH, STAGGER, type P } from './config';

// Sampling is cut into small slices that yield to the browser, so the page never blocks on it.
const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const smalls = new WeakMap<HTMLImageElement, HTMLCanvasElement>();

/** The portrait scaled down to the sampling size, drawn once and shared by the sampling and the tile tones. */
export function smallCanvas(img: HTMLImageElement) {
  let c = smalls.get(img);
  if (!c) {
    const w = SAMPLE_WIDTH;
    c = document.createElement('canvas');
    c.width = w;
    c.height = Math.round((w * img.naturalHeight) / img.naturalWidth);
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(img, 0, 0, c.width, c.height);
    smalls.set(img, c);
  }
  return c;
}

export async function sampleParticles(
  img: HTMLImageElement,
  count: number,
  isDead: () => boolean,
): Promise<P[] | null> {
  const small = smallCanvas(img);
  const w = small.width;
  const h = small.height;
  const data = small.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, w, h).data;

  // the pixels that can hold a particle, kept in typed arrays so no object is made for each
  const candX = new Uint16Array(w * h);
  const candY = new Uint16Array(w * h);
  const candD = new Float32Array(w * h);
  let n = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3] / 255;
      if (a < 0.05) continue;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // soft, feathered edges in the image carry through as fewer particles near them
      const d = Math.min(1, Math.max(0, (232 - lum) / 200)) * a;
      if (d > 0.1) {
        candX[n] = x;
        candY[n] = y;
        candD[n++] = d;
      }
    }
    if (y % 48 === 47) {
      await yieldToBrowser();
      if (isDead()) return null;
    }
  }

  const out: P[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  let guard = 0;
  while (out.length < count && guard < count * 60) {
    for (let tries = 0; tries < 12000 && out.length < count; tries++, guard++) {
      const ci = (Math.random() * n) | 0;
      const cx = candX[ci];
      const cy = candY[ci];
      const cd = candD[ci];
      const fx = (cx / w - FACE.cx) / FACE.rx;
      const fy = (cy / h - FACE.cy) / FACE.ry;
      const face = Math.exp(-(fx * fx + fy * fy));
      if (Math.random() > cd ** 0.7 * (0.22 + 0.78 * face)) continue;
      const k = out.length;
      const yy = 1 - (k / (count - 1)) * 2;
      const rr = Math.sqrt(1 - yy * yy);
      const th = golden * k;
      out.push({
        sx: Math.cos(th) * rr,
        sy: yy,
        sz: Math.sin(th) * rr,
        tx: (cx + Math.random()) / w,
        ty: (cy + Math.random()) / h,
        dark: cd,
        delay: Math.random() * STAGGER,
        seed: Math.random() * 1000,
        ox: 0,
        oy: 0,
        vx: 0,
        vy: 0,
      });
    }
    await yieldToBrowser();
    if (isDead()) return null;
  }
  return out;
}
