import indexHtml from '../../index.html?raw';

const css = import.meta.glob('./*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const sources = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const allCss = Object.entries(css)
  .filter(([file]) => !file.endsWith('index.css'))
  .map(([, text]) => strip(text))
  .join('\n');
const nonTest = Object.entries(sources).filter(([file]) => !file.includes('.test.'));
const allSource = nonTest.map(([, text]) => text).join('\n');
// shadcn components style themselves with Tailwind utilities, not with rules in these files
const ownSource = nonTest
  .filter(([file]) => !file.startsWith('../components/'))
  .map(([, text]) => text)
  .join('\n');

describe('stylesheet files', () => {
  it('are all imported, in a fixed order, by index.css', () => {
    const index = css['./index.css'];
    const imported = [...index.matchAll(/@import '\.\/([\w-]+)\.css';/g)].map((m) => m[1]);
    const files = Object.keys(css)
      .map((f) => f.replace('./', '').replace('.css', ''))
      .filter((f) => f !== 'index');
    const order = [...imported];
    expect(imported.sort()).toEqual(files.sort());
    expect(new Set(imported).size).toBe(imported.length);
    // the reset comes first so every other file can override it
    expect(order[0]).toBe('reset');
    expect(index.indexOf("'./tokens.css'")).toBeLessThan(index.indexOf("'./base.css'"));
  });

  it('keeps each file a manageable size', () => {
    for (const [file, text] of Object.entries(css)) {
      expect(text.split('\n').length, file).toBeLessThan(600);
    }
  });

  it('keeps each source file small enough to do one job', () => {
    for (const [file, text] of nonTest) {
      expect(text.split('\n').length, file).toBeLessThan(600);
    }
  });

  it('has no rule for a class that no component uses', () => {
    const dynamic = new Set(['light-answering', 'light-thinking', 'light-ready']);
    const classes = new Set([...allCss.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
    const unused = [...classes].filter(
      (c) => !dynamic.has(c) && !/^\d/.test(c) && !allSource.includes(c) && !indexHtml.includes(c),
    );
    expect(unused).toEqual([]);
  });

  it('defines every class a component names in a plain className string', () => {
    const wanted = new Set<string>();
    for (const m of ownSource.matchAll(/className="([^"{}$]+)"/g)) {
      for (const c of m[1].split(/\s+/)) if (c && !/^fi(-|$)/.test(c)) wanted.add(c);
    }
    const missing = [...wanted].filter((c) => !new RegExp(`\\.${c}(?![\\w-])`).test(allCss));
    expect(missing).toEqual([]);
  });

  it('keeps the removed console and halo vocabulary out', () => {
    expect(allCss).not.toMatch(/\.console\b|\.ask-body|halo/);
  });
});

describe('palette', () => {
  const tokens = Object.fromEntries(
    [...css['./tokens.css'].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]),
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
      'shadow',
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

  it('selects text in a colour that shows on the gold hover and highlight', () => {
    const rule = /::selection\s*\{([^}]*)\}/.exec(allCss)?.[1] ?? '';
    expect(rule).toMatch(/background:\s*var\(--ink\)/);
    expect(rule).toMatch(/color:\s*var\(--panel\)/);
    expect(rule).not.toMatch(/--mark/);
    expect(contrast('panel', 'ink')).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps hard shadows darker than the ink so they separate from navy fills', () => {
    expect(luminance(tokens.shadow)).toBeLessThan(luminance(tokens.ink));
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
