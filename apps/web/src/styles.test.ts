import indexHtml from '../index.html?raw';
import tailwind from './tailwind.css?raw';

const sources = import.meta.glob(['./**/*.{ts,tsx}', '!./**/*.test.*'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('source files', () => {
  it('keep page copy in the content modules, not in arrays inside components', () => {
    for (const [file, text] of Object.entries(sources)) {
      if (!file.endsWith('.tsx') || file.includes('/components/ui/')) continue;
      // a component file may hold small config, but not a long array of objects with text in it
      const objects = text.match(/^\s{2}\{\s*$/gm) ?? [];
      expect(objects.length, file).toBeLessThan(8);
    }
  });
});

describe('palette', () => {
  const tokens = Object.fromEntries(
    [...tailwind.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]),
  );

  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (a: string, b: string) => {
    const [hi, lo] = [luminance(tokens[a]), luminance(tokens[b])].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  it('defines the colours the design language names', () => {
    for (const name of [
      'ground',
      'panel',
      'ink',
      'muted',
      'line',
      'action',
      'action-ink',
      'mark',
    ]) {
      expect(tokens[name], name).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it.each([
    ['ink', 'ground'],
    ['ink', 'panel'],
    ['muted', 'ground'],
    ['muted', 'panel'],
    ['ink', 'mark'],
    ['action-ink', 'action'],
    ['action', 'ground'],
    ['action', 'panel'],
  ])('keeps %s text readable on %s (at least 4.5:1)', (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('selects text in a colour that shows on the gold highlight', () => {
    const rule = /::selection\s*\{([^}]*)\}/.exec(tailwind)?.[1] ?? '';
    expect(rule).toMatch(/background:\s*var\(--ink\)/);
    expect(rule).toMatch(/color:\s*var\(--panel\)/);
    expect(contrast('panel', 'ink')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('index.html', () => {
  it('asks no third party for fonts', () => {
    expect(indexHtml).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
  });

  it('has a language, a description and a social preview', () => {
    expect(indexHtml).toMatch(/<html lang="en"/);
    expect(indexHtml).toMatch(/name="description"/);
    // the site address is filled in at build time, so the preview image is an absolute URL
    expect(indexHtml).toMatch(/property="og:image" content="%SITE%\/og\.png"/);
    expect(indexHtml).toMatch(/<title>Yash Bakshi \| Software engineer<\/title>/);
  });
});
