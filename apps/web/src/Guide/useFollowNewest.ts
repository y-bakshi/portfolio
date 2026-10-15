import { useEffect, type RefObject } from 'react';

/** The feed fades out over its top 72px; a pinned question sits just below that. */
const FADE_CLEARANCE = 80;

type Follow = {
  feedRef: RefObject<HTMLDivElement | null>;
  logRef: RefObject<HTMLDivElement | null>;
  isMobile: boolean;
  asked: string;
  shown: string;
  status: string;
  count: number;
  /** Changes when the conversation first appears (after the portrait forms) or the chat opens. */
  appeared: string;
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
  appeared,
}: Follow) {
  useEffect(() => {
    // the wide-screen feed scrolls inside its own column to follow the newest text; the page never moves
    if (isMobile) return;
    const feed = feedRef.current;
    if (!feed) return;
    // an exchange that fits shows its end; one taller than the column pins the question to the top
    // (just under the fade), so a long answer can be read from its first line
    const apply = () => {
      const bottom = feed.scrollHeight - feed.clientHeight;
      const questions = feed.querySelectorAll<HTMLElement>('.msg-user');
      const last = questions[questions.length - 1];
      if (!last) {
        feed.scrollTop = bottom;
        return;
      }
      const top =
        last.getBoundingClientRect().top - feed.getBoundingClientRect().top + feed.scrollTop;
      feed.scrollTop = Math.min(bottom, Math.max(0, top - FADE_CLEARANCE));
    };
    apply();
    // the spacers around a short conversation collapse as it grows, and the source buttons and
    // thumbs arrive after the words, which moves everything: place it again whenever the feed changes
    const observer = new MutationObserver(apply);
    observer.observe(feed, { childList: true, subtree: true, characterData: true });
    const frame = window.requestAnimationFrame(() => window.requestAnimationFrame(apply));
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [feedRef, asked, shown, status, count, isMobile, appeared]);
  useEffect(() => {
    // on phones the newest question sits at the top of the log so its answer reads from the first word.
    // Re-pin as the answer grows and when its buttons appear; a pin made only when the question is sent
    // would be clamped, because nothing exists below the question yet.
    const log = logRef.current;
    const qs = log?.querySelectorAll<HTMLElement>('.msg-user');
    const q = qs && qs[qs.length - 1];
    if (log && q) log.scrollTop = Math.max(0, q.offsetTop - 14);
  }, [logRef, asked, shown, status, count, isMobile, appeared]);
}
