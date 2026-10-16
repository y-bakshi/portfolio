import { GuideAvatar } from './Avatar/GuideAvatar';
import { statusLabel } from './shared';
import { useGuideContext } from './GuideContext';

/** The floating "Ask the guide" button at the bottom right. It hides while the panel is open. */
export function GuideLauncher() {
  const { status, open, setOpen, refs } = useGuideContext();
  return (
    <button
      type="button"
      ref={refs.toggleRef}
      aria-expanded={open}
      aria-controls="guide-panel"
      aria-label={`Ask the guide, ${statusLabel[status].toLowerCase()}`}
      onClick={() => setOpen(true)}
      tabIndex={open ? -1 : 0}
      className={
        'fixed right-4 bottom-4 z-40 flex items-center gap-2.5 rounded-full border border-line bg-panel py-2 pr-5 pl-2 font-medium text-ink shadow-lift transition duration-300 ease-out hover:-translate-y-0.5 hover:border-action sm:right-6 sm:bottom-6 ' +
        (open ? 'pointer-events-none translate-y-3 opacity-0' : '')
      }
    >
      <GuideAvatar status={status} />
      <span>Ask the guide</span>
    </button>
  );
}
