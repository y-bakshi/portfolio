import { useCallback, useEffect, useRef, useState } from 'react';
import { pokes, type Mood } from './Avatar/moods';

/** How long the face keeps its reaction after a poke. */
export const POKE_MS = 1500;

/**
 * Each poke makes the face react a different way, in turn (a wink, then dizzy, then a burst of sparks), for a
 * moment. Nothing happens while it is busy answering.
 */
export function usePoke(allowed: boolean): [Mood | null, () => void] {
  const [reaction, setReaction] = useState<Mood | null>(null);
  const count = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  const poke = useCallback(() => {
    if (!allowed) return;
    setReaction(pokes[count.current++ % pokes.length]);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setReaction(null), POKE_MS);
  }, [allowed]);

  // a busy face drops the reaction, and leaving clears the timer
  useEffect(() => {
    if (!allowed) setReaction(null);
  }, [allowed]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return [reaction, poke];
}
