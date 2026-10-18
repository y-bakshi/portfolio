import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft02Icon, Cancel01Icon, SentIcon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { GuideAvatar } from './Avatar/GuideAvatar';
import { GUIDE_INTRO, SAVED_NOTICE } from './copy';
import { useGuideContext } from './GuideContext';
import { statusLabel } from './shared';
import { usePoke } from './usePoke';
import { SLEEP_AFTER_MS, useIdle } from './useIdle';

/**
 * Everything inside the chat: the face and its status, the conversation, and the box to type in. The
 * panel on wide screens and the chat page on phones both show it; they differ only in how it is left
 * (a close button, or a back arrow).
 */
export function GuideChat({
  variant,
  onLeave,
}: {
  variant: 'panel' | 'page';
  onLeave: () => void;
}) {
  const g = useGuideContext();
  const { open, status, asked, thread, chipList, question, setQuestion, refs } = g;
  // left open and untouched for a while, the face falls asleep; any movement, key or touch wakes it
  const [poke, onPoke] = usePoke(status === 'ready');
  const asleep = useIdle(open && status === 'ready' && question.trim() === '', SLEEP_AFTER_MS);
  const page = variant === 'page';

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {statusLabel[status]}
      </p>
      <p className="sr-only" role="status">
        {g.announce}
      </p>
      <div className="relative flex flex-col items-center gap-1 px-5 pt-9 pb-2 max-md:pt-[max(3rem,calc(env(safe-area-inset-top)*0.3+2rem))]">
        <h2 className="sr-only">Ask the guide</h2>
        <button
          type="button"
          onClick={onPoke}
          aria-label="Poke the guide"
          className="cursor-pointer rounded-full transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <GuideAvatar
            status={status}
            listening={question.trim() !== ''}
            asleep={asleep}
            poke={poke}
            className="size-16 md:size-[4.5rem]"
          />
        </button>
        <p data-status={status} className="text-sm text-muted">
          {statusLabel[status]}
        </p>
        <Button
          variant="ghost"
          size="icon"
          aria-label={page ? 'Back' : 'Close the guide'}
          onClick={onLeave}
          className={
            (page ? 'left-3 ' : 'right-3 ') +
            'absolute top-3 max-md:top-[max(2.75rem,calc(env(safe-area-inset-top)*0.3+1.75rem))]'
          }
        >
          <HugeiconsIcon icon={page ? ArrowLeft02Icon : Cancel01Icon} size={22} />
        </Button>
      </div>
      <div
        ref={refs.logRef}
        className="relative flex-1 overflow-y-auto px-5 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {!asked && (
          <div className="mb-5 space-y-1">
            <h3 className="display text-3xl">What would you like to know?</h3>
            <p className="text-muted">{GUIDE_INTRO}</p>
          </div>
        )}
        {thread}
        {chipList && (
          <div key={String(open)} className={asked ? 'mt-5' : ''}>
            {chipList}
          </div>
        )}
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
        <p className="mt-2 text-xs text-muted">Answers can be inaccurate or outdated.</p>
      </div>
    </>
  );
}
