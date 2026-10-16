// Copies the technology logos the site shows out of the `thesvg` package into public/logos/tech, so
// they are ordinary image files the browser loads only when they are on screen, not JavaScript.
// Run it after changing src/components/tech-logos.json: npm run logos:copy
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const names = JSON.parse(readFileSync(join(root, 'src/components/tech-logos.json'), 'utf8'));
const out = join(root, 'public/logos/tech');
mkdirSync(out, { recursive: true });

for (const slug of new Set(Object.values(names))) {
  const { default: icon } = await import(`thesvg/${slug}`);
  // keep the mark as drawn, but let the page size it
  const svg = icon.svg
    .replace(/<\?xml[^>]*\?>\s*/, '')
    .replace(/(<svg[^>]*?)\s+width="[^"]*"/, '$1')
    .replace(/(<svg[^>]*?)\s+height="[^"]*"/, '$1');
  writeFileSync(join(out, `${slug}.svg`), svg);
  console.log(`${slug} (${icon.license ?? 'no licence given'})`);
}
