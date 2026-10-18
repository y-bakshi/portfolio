/** True when the visitor has asked for less motion. Safe to call with no window. */
export const asksForStillness = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
