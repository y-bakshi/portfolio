import type { Env } from './env';
import { unavailableAnswer } from '../src/content';
import { openAdmission, type Admission } from './lib/admission';
import type { Answerer } from './lib/answerer';
import { systemClock, type Clock } from './lib/clock';

/**
 * Everything the routes need from outside, so a phase can swap one in and a test can fake one.
 * The default of each is the simplest thing that works.
 */
export type Deps = {
  /** Rate limits and the spend cap. */
  admission: Admission;
  /** Writes the answers. */
  answerer: Answerer;
  clock: Clock;
  /** A fresh unique id for each stored message. */
  newId: () => string;
  /** Checks the visitor is not a bot. True means go ahead. */
  verifyHuman: (request: Request, env: Env) => Promise<boolean>;
};

/** Used when no model is set up: every question gets the plain "cannot answer just now" reply. */
export const unavailableAnswerer: Answerer = {
  answer: async () => ({ ...unavailableAnswer, meta: { model: 'unavailable' } }),
};

export const defaultDeps: Deps = {
  admission: openAdmission,
  answerer: unavailableAnswerer,
  clock: systemClock,
  newId: () => crypto.randomUUID(),
  verifyHuman: async () => true,
};
