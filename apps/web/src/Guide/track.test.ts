import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackCiteClick } from './track';

afterEach(() => vi.unstubAllGlobals());

describe('trackCiteClick', () => {
  it('sends a beacon to the events route', () => {
    const sendBeacon = vi.fn(() => true);
    const fetchSpy = vi.fn();
    vi.stubGlobal('navigator', { sendBeacon });
    vi.stubGlobal('fetch', fetchSpy);
    trackCiteClick('testpilot');
    expect(sendBeacon).toHaveBeenCalledWith('/api/events', expect.any(Blob));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('falls back to a keepalive fetch when the beacon is refused or missing', () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('navigator', { sendBeacon: () => false });
    trackCiteClick('contact');
    vi.stubGlobal('navigator', {});
    trackCiteClick('contact');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const init = (fetchSpy.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init).toMatchObject({ method: 'POST', keepalive: true });
    expect(JSON.parse(init.body as string)).toEqual({ type: 'cite_clicked', sourceId: 'contact' });
  });

  it('never throws, even when everything fails', async () => {
    vi.stubGlobal('navigator', {
      sendBeacon: () => {
        throw new Error('blocked');
      },
    });
    expect(() => trackCiteClick('x')).not.toThrow();
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    expect(() => trackCiteClick('x')).not.toThrow();
    vi.stubGlobal('fetch', () => {
      throw new Error('sync');
    });
    expect(() => trackCiteClick('x')).not.toThrow();
    await Promise.resolve();
  });
});
