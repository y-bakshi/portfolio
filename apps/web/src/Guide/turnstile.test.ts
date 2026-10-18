import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTurnstileToken } from './turnstile';

type Options = {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback': () => void;
};

/** A fake of Cloudflare's widget, put on the window so no script is loaded. */
function fakeWidget(behave: (options: Options) => void) {
  const removed: string[] = [];
  window.turnstile = {
    render: (_host, options) => {
      queueMicrotask(() => behave(options as unknown as Options));
      return 'widget-1';
    },
    execute: () => {},
    remove: (id) => void removed.push(id),
  };
  return removed;
}

afterEach(() => {
  delete window.turnstile;
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('getTurnstileToken', () => {
  it('gives no token, and loads nothing, when the site has no key', async () => {
    expect(await getTurnstileToken('')).toBeNull();
    expect(await getTurnstileToken(undefined)).toBeNull();
    expect(document.querySelector('script')).toBeNull();
  });

  it('returns the token the widget produces, and cleans the widget away', async () => {
    const removed = fakeWidget((o) => o.callback('token-123'));
    expect(await getTurnstileToken('site-key')).toBe('token-123');
    expect(removed).toEqual(['widget-1']);
    expect(document.body.children).toHaveLength(0);
  });

  it('gives no token when the check reports an error', async () => {
    fakeWidget((o) => o['error-callback']());
    expect(await getTurnstileToken('site-key')).toBeNull();
  });

  it('gives no token when the widget never answers, after a timeout', async () => {
    vi.useFakeTimers();
    fakeWidget(() => {});
    const pending = getTurnstileToken('site-key');
    await vi.advanceTimersByTimeAsync(10_001);
    expect(await pending).toBeNull();
  });

  it('gives no token when rendering throws', async () => {
    window.turnstile = {
      render: () => {
        throw new Error('blocked');
      },
      execute: () => {},
      remove: () => {},
    };
    expect(await getTurnstileToken('site-key')).toBeNull();
  });
});
