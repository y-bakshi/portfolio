import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, SentIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { GuideAvatar } from './Avatar/GuideAvatar';
import { GUIDE_INTRO, SAVED_NOTICE } from './copy';
import { useGuideContext } from './GuideContext';
import { statusLabel } from './shared';

/**
 * The chat panel: a right-hand column on wide screens and a sheet over the page on phones. The page
 * behind it stays usable so a "Show on the page" button can scroll to what an answer cites.
 */
export function GuidePanel() {
  const g = useGuideContext();
  const { open, status, asked, thread, chipList, question, setQuestion, refs } = g;

  return (
    <aside
      id="guide-panel"
      aria-label="Guide chat"
      onKeyDown={g.onDockKey}
      inert={!open}
      className={cn(
        'fixed z-50 flex flex-col bg-ground shadow-lift transition duration-300 ease-out',
        'inset-x-0 top-(--vvt,0px) h-(--vvh,100dvh)',
        'md:inset-y-0 md:right-0 md:left-auto md:top-0 md:h-auto md:w-[26rem] md:border-l md:border-line',
        open
          ? 'translate-y-0 opacity-100 md:translate-x-0'
          : 'pointer-events-none translate-y-8 opacity-0 md:translate-x-8 md:translate-y-0',
      )}
    >
      <p className="sr-only" aria-live="polite">
        {statusLabel[status]}
      </p>
      <p className="sr-only" role="status">
        {g.announce}
      </p>
      <div className="flex items-start gap-3 border-b border-line/60 px-5 py-4">
        <GuideAvatar status={status} />
        <div className="min-w-0 flex-1">
          <h2 className="display text-2xl">Ask the guide</h2>
          <p className="text-sm text-muted">{statusLabel[status]}</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close the guide" onClick={g.closeDock}>
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </Button>
      </div>
      <div ref={refs.logRef} className="relative flex-1 overflow-y-auto px-5 py-5">
        {!asked && (
          <div className="mb-5 space-y-1">
            <h3 className="display text-3xl">What would you like to know?</h3>
            <p className="text-muted">{GUIDE_INTRO}</p>
          </div>
        )}
        {thread}
        <div className={asked ? 'mt-5' : ''}>{chipList}</div>
      </div>
      <div className="border-t border-line/60 px-5 pt-3 pb-4">
        <p className="mb-3 flex items-start justify-between gap-3 text-xs text-muted">
          <span>{SAVED_NOTICE}</span>
          <button
            type="button"
            onClick={() => void g.clear()}
            className="shrink-0 underline underline-offset-4 hover:text-ink"
          >
            Clear this chat
          </button>
        </p>
        <form onSubmit={g.onSubmit} className="flex gap-2">
          <label htmlFor="ask-input" className="sr-only">
            Ask the guide about Yash’s work
          </label>
          <input
            id="ask-input"
            ref={refs.inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about projects or experience"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border border-line bg-field px-3.5 py-2.5 text-ink shadow-soft placeholder:text-muted/80 focus-visible:border-action"
          />
          <Button type="submit" size="lg" disabled={status !== 'ready'} aria-label="Ask">
            <HugeiconsIcon icon={SentIcon} size={20} />
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted">Answers include source links.</p>
      </div>
    </aside>
  );
}
