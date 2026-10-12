import { useEffect, type RefObject } from 'react';

type Follow = {
  feedRef: RefObject<HTMLDivElement | null>;
  logRef: RefObject<HTMLDivElement | null>;
  isMobile: boolean;
  asked: string;
  shown: string;
  status: string;
  count: number;
};

/** Keeps the newest text in view, in the hero feed on wide screens and in the chat log on phones. */
export function useFollowNewest({
  feedRef,
  logRef,
  isMobile,
  asked,
  shown,
  status,
  count,
}: Follow) {
  useEffect(() => {
    // the wide-screen feed scrolls inside its own column to follow the newest text; the page never moves
    if (isMobile) return;
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [feedRef, asked, shown, status, count, isMobile]);
  useEffect(() => {
    // on phones the newest question sits at the top of the log so its answer reads from the first word.
    // Re-pin as the answer grows and when its buttons appear; a pin made only when the question is sent
    // would be clamped, because nothing exists below the question yet.
    const log = logRef.current;
    const qs = log?.querySelectorAll<HTMLElement>('.msg-user');
    const q = qs && qs[qs.length - 1];
    if (log && q) log.scrollTop = Math.max(0, q.offsetTop - 14);
  }, [logRef, asked, shown, status, count, isMobile]);
}
