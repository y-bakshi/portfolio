import type { Params } from './engine';

/** What the guide is up to. */
export type Mood =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'answering'
  | 'sleeping'
  // the three ways it answers being poked, one after another
  | 'wink'
  | 'dizzy'
  | 'burst';

/** What a poke makes it do, in turn. */
export const pokes = ['wink', 'dizzy', 'burst'] as const satisfies readonly Mood[];

const still = { sweepX: 0, sweepRate: 0, sway: 0, mouth: 0, mouthRate: 0, wink: 0 };

/**
 * How each mood looks. The engine eases from one set of numbers to the next, so moods run into each other.
 * The face is drawn about 36 pixels wide, so the differences are large on purpose: a change of a few
 * per cent in the outline cannot be seen at that size.
 */
export const moods: Record<Mood, Params> = {
  /** At rest: a slow breath, a faint wobble, eyes open and drifting. */
  idle: {
    breathe: 0.03,
    rate: 0.28,
    lobe2: 0.02,
    lobe3: 0.015,
    lobe4: 0,
    spin: 0.03,
    squash: 0,
    eyes: 1,
    gazeX: 0,
    gazeY: 0,
    ...still,
  },
  /** Someone is typing: the eyes go wide and lean toward the keyboard, and the body perks up. */
  listening: {
    breathe: 0.04,
    rate: 0.45,
    lobe2: 0.015,
    lobe3: 0.01,
    lobe4: 0,
    spin: 0.03,
    squash: 0,
    eyes: 1.35,
    gazeX: 0.5,
    gazeY: 0.85,
    ...still,
    sway: 0.03,
  },
  /** Working it out: a squat, turning, lumpy body, eyes narrowed and darting up and across, a small "hm". */
  thinking: {
    breathe: 0.04,
    rate: 0.9,
    lobe2: 0.02,
    lobe3: 0.08,
    lobe4: 0.04,
    spin: 0.32,
    squash: 0.1,
    eyes: 0.7,
    gazeX: -0.2,
    gazeY: -1,
    sweepX: 0.9,
    sweepRate: 0.55,
    sway: 0.05,
    mouth: 0.2,
    mouthRate: 0,
    wink: 0,
  },
  /** Asleep: eyes shut, settled low, a slow deep breath. Nothing else moves. */
  sleeping: {
    breathe: 0.055,
    rate: 0.17,
    lobe2: 0.01,
    lobe3: 0,
    lobe4: 0,
    spin: 0,
    squash: 0.09,
    eyes: 0,
    gazeX: 0,
    gazeY: 0.3,
    ...still,
  },
  /** Poked, a wink: one eye shuts, a small pleased smile, a little lean to the side. */
  wink: {
    breathe: 0.04,
    rate: 0.9,
    lobe2: 0.02,
    lobe3: 0.01,
    lobe4: 0,
    spin: 0.03,
    squash: 0,
    eyes: 1.1,
    gazeX: 0.25,
    gazeY: 0.1,
    sweepX: 0,
    sweepRate: 0,
    sway: 0.05,
    mouth: 0.32,
    mouthRate: 0,
    wink: 1,
  },
  /** Poked, spun round: a fast-turning lumpy body and eyes darting side to side. */
  dizzy: {
    breathe: 0.05,
    rate: 1.2,
    lobe2: 0.04,
    lobe3: 0.09,
    lobe4: 0.05,
    spin: 0.95,
    squash: 0.05,
    eyes: 0.85,
    gazeX: 0,
    gazeY: 0,
    sweepX: 1.4,
    sweepRate: 2.4,
    sway: 0.06,
    mouth: 0.25,
    mouthRate: 0,
    wink: 0,
  },
  /** Poked, a burst: a big pop, a wide grin and eyes open wide while sparks fly off it. */
  burst: {
    breathe: 0.12,
    rate: 3.4,
    lobe2: 0.02,
    lobe3: 0,
    lobe4: 0,
    spin: 0.05,
    squash: 0,
    eyes: 1.35,
    gazeX: 0,
    gazeY: -0.1,
    sweepX: 0,
    sweepRate: 0,
    sway: 0,
    mouth: 0.95,
    mouthRate: 0,
    wink: 0,
  },
  /** Speaking: a quick, even pulse, bright eyes and a mouth that opens and shuts. */
  answering: {
    breathe: 0.07,
    rate: 2.6,
    lobe2: 0.02,
    lobe3: 0,
    lobe4: 0,
    spin: 0.05,
    squash: 0,
    eyes: 1.1,
    gazeX: 0,
    gazeY: 0.2,
    sweepX: 0,
    sweepRate: 0,
    sway: 0,
    mouth: 1,
    mouthRate: 3.4,
    wink: 0,
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
