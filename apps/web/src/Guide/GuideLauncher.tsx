import { useRef } from 'react';
import { useScrolling } from '@/lib/useScrolling';
import { GuideAvatar } from './Avatar/GuideAvatar';
import { statusLabel } from './shared';
import { useGuideContext } from './GuideContext';

/** The floating "Ask the guide" button at the bottom right. It hides while the panel is open. */
export function GuideLauncher() {
  const { status, open, openChat, refs } = useGuideContext();
  // while the page scrolls the button shrinks to just the face, so it covers less of the page
  const scrolling = useScrolling();
  // A touch on a phone that is still coasting from a scroll only stops the scroll: the browser sends no click.
  // So a press that began while the button was shrunk opens the chat when it lifts, whether or not a click follows.
  const pressedShrunk = useRef(false);
  return (
    <div
      className={
        'fixed right-4 bottom-4 z-40 drop-shadow-[0_8px_18px_rgba(14,29,97,0.2)] transition-[translate,opacity] duration-200 ease-out sm:right-6 sm:bottom-6 ' +
        (open ? 'pointer-events-none translate-y-3 opacity-0' : '')
      }
    >
      <button
        type="button"
        ref={refs.toggleRef}
        aria-expanded={open}
        aria-controls="guide-panel"
        aria-label={`Ask the guide, ${statusLabel[status].toLowerCase()}`}
        onClick={openChat}
        onPointerDown={() => {
          pressedShrunk.current = scrolling;
        }}
        onPointerUp={() => {
          if (!pressedShrunk.current) return;
          pressedShrunk.current = false;
          openChat();
        }}
        onPointerCancel={() => {
          pressedShrunk.current = false;
        }}
        data-scrolling={scrolling || undefined}
        tabIndex={open ? -1 : 0}
        className="group flex items-center gap-2.5 rounded-full border border-line bg-panel py-2 pr-5 pl-2 font-medium text-ink transition-[clip-path,translate,border-color] duration-200 ease-out [clip-path:inset(0_0_0_0_round_9999px)] hover:-translate-y-0.5 hover:border-action data-scrolling:translate-x-[calc(100%-3.375rem)] data-scrolling:[clip-path:inset(0_calc(100%-3.375rem)_0_0_round_9999px)]"
      >
        <GuideAvatar status={status} />
        <span className="whitespace-nowrap transition-opacity duration-150 ease-out group-data-scrolling:opacity-0">
          Ask the guide
        </span>
      </button>
    </div>
  );
}
