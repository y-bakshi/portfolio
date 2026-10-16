import type { Params } from './engine';

/** What the guide is up to. */
export type Mood = 'idle' | 'listening' | 'thinking' | 'answering';

/** How each mood looks. The engine eases from one set of numbers to the next, so moods run into each other. */
export const moods: Record<Mood, Params> = {
  /** At rest: a slow breath, a faint wobble, eyes open and drifting. */
  idle: {
    breathe: 0.018,
    rate: 0.28,
    lobe2: 0.012,
    lobe3: 0.01,
    lobe4: 0,
    spin: 0.03,
    squash: 0,
    eyes: 1,
    gazeX: 0,
    gazeY: 0,
  },
  /** Someone is typing: the eyes widen and turn to the side the keyboard is. */
  listening: {
    breathe: 0.022,
    rate: 0.35,
    lobe2: 0.012,
    lobe3: 0.008,
    lobe4: 0,
    spin: 0.03,
    squash: 0,
    eyes: 1.15,
    gazeX: 0.3,
    gazeY: 0.55,
  },
  /** Working it out: a turning, lumpy body and eyes glancing up. */
  thinking: {
    breathe: 0.03,
    rate: 0.9,
    lobe2: 0.02,
    lobe3: 0.075,
    lobe4: 0.035,
    spin: 0.22,
    squash: 0.02,
    eyes: 0.8,
    gazeX: -0.5,
    gazeY: -0.7,
  },
  /** Speaking: a quick, even pulse and bright eyes. */
  answering: {
    breathe: 0.06,
    rate: 2.6,
    lobe2: 0.02,
    lobe3: 0,
    lobe4: 0,
    spin: 0.05,
    squash: 0,
    eyes: 1.05,
    gazeX: 0,
    gazeY: 0.1,
  },
};

/** Closes the eyes now and then: the share of the way shut, from the time in seconds. */
export function blink(t: number): number {
  const period = 4.6;
  const into = (t % period) / period;
  if (into < 0.94) return 0;
  const half = (into - 0.94) / 0.06;
  return Math.sin(half * Math.PI);
}

/** Where the eyes wander at rest, from the time in seconds. A slow loop that never quite repeats. */
export function drift(t: number): { x: number; y: number } {
  return {
    x: 0.35 * Math.sin(t * 0.37) + 0.15 * Math.sin(t * 0.91 + 1),
    y: 0.2 * Math.sin(t * 0.29 + 2),
  };
}
