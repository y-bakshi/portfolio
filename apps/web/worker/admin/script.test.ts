import { describe, expect, it } from 'vitest';
import { ADMIN_HTML } from './page';
import { ADMIN_JS } from './script';

// runs the owner page script against a fake summary, to catch mistakes the type checker cannot see
describe('owner page script', () => {
  it('runs in its own scope, so its variables cannot collide with the window', () => {
    // a top-level `var status` is the window's own status property in a real browser, and assigning
    // to it makes a string, which jsdom does not reproduce; a function scope avoids the whole class
    expect(ADMIN_JS.trimStart().startsWith('(function () {')).toBe(true);
    expect(ADMIN_JS.trimEnd().endsWith('})();')).toBe(true);
  });

  it('renders a summary as text, never as markup', async () => {
    document.documentElement.innerHTML = ADMIN_HTML.replace(/<script[^>]*><\/script>/, '');
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
      lowConfidence: [
        { text: '<b>hi</b>', score: 0.3, refused: false, at: '2026-10-14T01:00:00Z' },
      ],
    };
    globalThis.fetch = (() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(summary),
      })) as unknown as typeof fetch;
    // an indirect eval runs it as a global script, the way the browser loads /admin/app.js: a variable
    // such as `status` then collides with the window's own properties, which a function scope hides
    (0, eval)(ADMIN_JS);
    await new Promise((r) => setTimeout(r, 10));
    expect(document.getElementById('status')!.textContent).toBe('Last 30 days');
    expect(document.querySelectorAll('#totals .stat')).toHaveLength(9);
    expect(document.querySelectorAll('#chart-questions rect')).toHaveLength(2);
    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('#weak b')).toBeNull();
    expect(document.getElementById('top')!.textContent).toContain('<img src=x');
  });
});
