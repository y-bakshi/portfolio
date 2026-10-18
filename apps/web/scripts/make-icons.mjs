// Draws the icon files browsers and phones ask for from public/favicon.svg, so the mark has one source.
//   node scripts/make-icons.mjs
// Writes favicon.ico (16, 32 and 48 px), apple-touch-icon.png (180 px) and icon-192.png and
// icon-512.png (for the web manifest) into public/. The corners are filled with the ground colour,
// because iPhones round the corners themselves and a transparent corner would turn black.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = join(import.meta.dirname, '..', 'public');
const svg = readFileSync(join(root, 'favicon.svg'));
const GROUND = '#e8e0d2';

const png = (size) =>
  sharp(svg, { density: Math.ceil((72 * size) / 64) * 2 })
    .resize(size, size)
    .flatten({ background: GROUND })
    .png()
    .toBuffer();

/** An .ico file that holds PNG images, which every current browser reads. */
function ico(images) {
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i;
    head.writeUInt8(size, at);
    head.writeUInt8(size, at + 1);
    head.writeUInt16LE(1, at + 4);
    head.writeUInt16LE(32, at + 6);
    head.writeUInt32LE(data.length, at + 8);
    head.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([head, ...images.map((i) => i.data)]);
}

const sizes = [16, 32, 48];
const small = await Promise.all(sizes.map(async (size) => ({ size, data: await png(size) })));
writeFileSync(join(root, 'favicon.ico'), ico(small));
writeFileSync(join(root, 'apple-touch-icon.png'), await png(180));
writeFileSync(join(root, 'icon-192.png'), await png(192));
writeFileSync(join(root, 'icon-512.png'), await png(512));
console.log('Wrote favicon.ico, apple-touch-icon.png, icon-192.png and icon-512.png');
