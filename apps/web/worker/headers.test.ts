// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const headers = readFileSync(join(import.meta.dirname, '..', 'public', '_headers'), 'utf8');
const csp = headers.match(/Content-Security-Policy: (.*)/)![1];
const directive = (name: string) => csp.split(';').find((d) => d.trim().startsWith(`${name} `));

describe('Content-Security-Policy', () => {
  it('lets Cloudflare Turnstile load, run and talk', () => {
    const turnstile = 'https://challenges.cloudflare.com';
    for (const name of ['script-src', 'frame-src', 'connect-src']) {
      expect(directive(name)).toContain(turnstile);
    }
  });

  it('stays strict everywhere else', () => {
    expect(directive('script-src')).not.toContain('unsafe');
    expect(directive('default-src')).toBe("default-src 'self'");
    expect(directive('frame-ancestors')).toContain("'none'");
    expect(csp).not.toContain('*');
  });
});
