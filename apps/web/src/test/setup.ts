import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

/** Set to true in a test to make the page behave as if the visitor asked for reduced motion. */
export const motion = { reduce: true };

beforeEach(() => {
  // the Worker's tests run in plain Node, where there is no window to prepare
  if (typeof window === 'undefined') return;
  motion.reduce = true;
  window.matchMedia = ((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? motion.reduce : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;

  // jsdom does not lay anything out or scroll
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn() as typeof window.scrollTo;
});

afterEach(() => {
  vi.useRealTimers();
  if (typeof document === 'undefined') return;
  cleanup();
  document.documentElement.className = '';
});
