import { FACE, SAMPLE_WIDTH, STAGGER, type P } from './config';

// Sampling is cut into small slices that yield to the browser, so the page never blocks on it.
const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export async function sampleParticles(
  img: HTMLImageElement,
  count: number,
  isDead: () => boolean,
): Promise<P[] | null> {
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
    await yieldToBrowser();
    if (isDead()) return null;
  }
  return out;
}
