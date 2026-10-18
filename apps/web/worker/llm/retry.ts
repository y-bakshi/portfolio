import type { FetchLike } from './types';

/** Statuses worth one more try. Google sometimes answers a good key with a one-off 403. */
const RETRY = new Set([403, 429, 500, 502, 503, 504]);

/** Wraps a fetch so a request that got one of those statuses is sent once more after a short wait. */
export function retryOnce(doFetch: FetchLike, waitMs = 300): FetchLike {
  return async (input, init) => {
    const first = await doFetch(input, init);
    if (!RETRY.has(first.status)) return first;
    await first.body?.cancel().catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return doFetch(input, init);
  };
}
