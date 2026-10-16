import type { Params } from './engine';

/** Moves every number of `from` toward `to`, the way things settle: fast at first, then slowly, and never past. */
export function blend(from: Params, to: Params, dt: number, seconds: number): Params {
  const k = 1 - Math.exp(-dt / seconds);
  const out = { ...from };
  for (const key of Object.keys(to) as (keyof Params)[]) {
    const next = from[key] + (to[key] - from[key]) * k;
    out[key] = Math.abs(to[key] - next) < 1e-4 ? to[key] : next;
  }
  return out;
}
