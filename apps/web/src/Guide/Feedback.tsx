import { HugeiconsIcon } from '@hugeicons/react';
import { ThumbsDownIcon, ThumbsUpIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/cn';
import type { Rating } from './storage';

type FeedbackProps = {
  id: string;
  rating?: Rating | null;
  onRate: (id: string, value: Rating) => void;
};

const button =
  'rounded-md p-2 text-muted transition-colors hover:bg-ink/5 hover:text-ink aria-pressed:bg-ink aria-pressed:text-panel';

/** Thumbs up and down under a stored answer. The chosen one stays filled in. */
export function Feedback({ id, rating, onRate }: FeedbackProps) {
  return (
    <div role="group" aria-label="Was this answer helpful?" className="mt-2 flex gap-1">
      <button
        type="button"
        aria-label="Good answer"
        aria-pressed={rating === 1}
        onClick={() => onRate(id, 1)}
        className={button}
      >
        <HugeiconsIcon icon={ThumbsUpIcon} size={16} />
      </button>
      <button
        type="button"
        aria-label="Poor answer"
        aria-pressed={rating === -1}
        onClick={() => onRate(id, -1)}
        className={cn(button)}
      >
        <HugeiconsIcon icon={ThumbsDownIcon} size={16} />
      </button>
    </div>
  );
}
