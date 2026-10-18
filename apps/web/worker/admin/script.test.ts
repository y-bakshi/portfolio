import { describe, expect, it } from 'vitest';
import { ADMIN_HTML } from './page';
import { ADMIN_JS } from './script';

const summary = {
  range: { days: 30 },
  totals: { chats: 2, questions: 3, answers: 3 },
  daily: [
    { day: '2026-10-13', questions: 2, answers: 2, costMicroUsd: 2400 },
    { day: '2026-10-14', questions: 1, answers: 1, costMicroUsd: 1000 },
  ],
  costMicroUsd: 3400,
  latencyMs: { p50: 900, p95: null },
  thumbs: { up: 1, down: 0, upRatio: 1 },
  fallbackRate: 0.25,
  rateLimited: 1,
  topQuestions: [{ text: '<img src=x onerror=alert(1)>', count: 2 }],
  lowConfidence: [{ text: '<b>hi</b>', score: 0.3, refused: false, at: '2026-10-14T01:00:00Z' }],
  breakdowns: {
    sources: [{ key: 'testpilot', count: 4 }],
    rateLimits: [{ key: 'minute', count: 1 }],
    fallbacks: [],
    errors: [],
  },
};

const traffic = {
  ok: true,
  days: 30,
  daily: [
    { day: '2026-10-13', requests: 90, pageViews: 20, visitors: 8 },
    { day: '2026-10-14', requests: 60, pageViews: 10, visitors: 5 },
  ],
  totals: { requests: 150, pageViews: 30, visitors: 13 },
  countries: [{ name: 'United States', count: 120 }],
  browsers: [{ name: 'Chrome', count: 20 }],
  pages: [{ name: '/projects/', count: 9 }],
  referrers: null,
};

const evals = {
  runs: [
    {
      id: 'eval-1',
      at: '2026-10-17T10:00:00.000Z',
      kind: 'live',
      model: '<i>model</i>',
      questions: 65,
      current: false,
      rows: [
        { metric: 'faithfulness', score: '92.0%', threshold: '>= 90.0%', pass: true },
        { metric: 'contextRecall', score: '70.0%', threshold: '>= 85.0%', pass: false },
      ],
      failures: ['claim sentence not backed'],
    },
  ],
};

/** Runs the page script against fake endpoints, the way the browser loads /admin/app.js. */
async function open(routes: Record<string, unknown>) {
  document.documentElement.innerHTML = ADMIN_HTML.replace(/<script[^>]*><\/script>/, '');
  globalThis.fetch = ((url: string) => {
    const key = Object.keys(routes).find((k) => url.startsWith(k));
    return Promise.resolve({
      ok: Boolean(key),
      json: () => Promise.resolve(key ? routes[key] : {}),
    });
  }) as unknown as typeof fetch;
  // an indirect eval runs it as a global script, so a variable such as `status` collides with the
  // window's own properties exactly as it would in the page, which a function scope hides
  (0, eval)(ADMIN_JS);
  await new Promise((r) => setTimeout(r, 10));
}

const all = {
  '/api/admin/summary': summary,
  '/api/admin/traffic': traffic,
  '/api/admin/evals': evals,
};

describe('owner page script', () => {
  it('runs in its own scope, so its variables cannot collide with the window', () => {
    expect(ADMIN_JS.trimStart().startsWith('(function () {')).toBe(true);
    expect(ADMIN_JS.trimEnd().endsWith('})();')).toBe(true);
  });

  it('has no markup-writing calls and no template strings', () => {
    expect(ADMIN_JS).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
  });

  it('renders the guide numbers as text, never as markup', async () => {
    await open(all);
    expect(document.getElementById('status')!.textContent).toBe('Last 30 days');
    expect(document.querySelectorAll('#totals .stat')).toHaveLength(9);
    expect(document.querySelectorAll('#chart-questions rect')).toHaveLength(2);
    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('#weak b')).toBeNull();
    expect(document.getElementById('top')!.textContent).toContain('<img src=x');
    expect(document.getElementById('sources')!.textContent).toContain('testpilot');
    expect(document.getElementById('limits')!.textContent).toContain('minute');
  });

  it('shows the traffic, and says when a breakdown is not available', async () => {
    await open(all);
    expect(document.querySelectorAll('#traffic-stats .stat')).toHaveLength(3);
    expect(document.getElementById('traffic-pages')!.textContent).toContain('/projects/');
    expect(document.getElementById('traffic-referrers')!.textContent).toContain('Not available');
  });

  it('says traffic is not set up instead of failing', async () => {
    await open({ ...all, '/api/admin/traffic': { ok: false, reason: 'not_set_up' } });
    expect(document.getElementById('traffic-note')!.textContent).toContain('not set up');
    expect(document.getElementById('ov-notes')!.textContent).toContain('Traffic is not set up');
  });

  it('shows the latest evaluation, marks it out of date, and flags what misses its target', async () => {
    await open(all);
    expect(document.getElementById('quality-note')!.textContent).toContain('may not describe');
    expect(document.getElementById('quality-table')!.textContent).toContain('FAIL');
    expect(document.querySelector('#quality-note i')).toBeNull();
    const overview = document.getElementById('ov-notes')!.textContent!;
    expect(overview).toContain('older than the current notes');
    expect(overview).toContain('below target');
  });

  it('switches tabs and keeps only the chosen panel visible', async () => {
    await open(all);
    document.getElementById('tab-pages')!.click();
    expect(document.getElementById('panel-pages')!.hidden).toBe(false);
    expect(document.getElementById('panel-overview')!.hidden).toBe(true);
    expect(document.getElementById('tab-pages')!.getAttribute('aria-selected')).toBe('true');
    expect(document.getElementById('range')!.hidden).toBe(false);
    document.getElementById('tab-quality')!.click();
    expect(document.getElementById('range')!.hidden).toBe(true);
  });
});
