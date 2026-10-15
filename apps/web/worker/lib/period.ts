/** UTC calendar helpers, so every period boundary is the same for everyone and easy to test. */

/** "2026-10-14" */
export function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** "2026-10" */
export function utcMonth(ms: number): string {
  return new Date(ms).toISOString().slice(0, 7);
}

/** The first millisecond of the next UTC day. */
export function nextDayMs(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}

/** The first millisecond of the next UTC month. */
export function nextMonthMs(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
}
