import { useEffect, type RefObject } from 'react';

type Follow = {
  logRef: RefObject<HTMLDivElement | null>;
  asked: string;
  shown: string;
  status: string;
  count: number;
  /** Changes when the chat opens or the conversation first appears, so a restored chat is placed too. */
  appeared: string;
};

/**
 * Keeps the newest question at the top of the chat log, so its answer reads from the first word.
 * It re-pins as the answer grows and when its buttons appear: a pin made only when the question is
 * sent would be clamped, because nothing exists below the question yet.
 */
export function useFollowNewest({ logRef, asked, shown, status, count, appeared }: Follow) {
  useEffect(() => {
    const log = logRef.current;
    const qs = log?.querySelectorAll<HTMLElement>('[data-question]');
    const q = qs && qs[qs.length - 1];
    if (log && q) log.scrollTop = Math.max(0, q.offsetTop - 14);
  }, [logRef, asked, shown, status, count, appeared]);
}
