import { Icon } from '../Icon';
import type { Rating } from './storage';

type FeedbackProps = {
  id: string;
  rating?: Rating | null;
  onRate: (id: string, value: Rating) => void;
};

/** Thumbs up and down under a stored answer. The chosen one stays filled in. */
export function Feedback({ id, rating, onRate }: FeedbackProps) {
  return (
    <div className="feedback" role="group" aria-label="Was this answer helpful?">
      <button
        type="button"
        aria-label="Good answer"
        aria-pressed={rating === 1}
        onClick={() => onRate(id, 1)}
      >
        <Icon name="thumb" />
      </button>
      <button
        type="button"
        className="feedback-down"
        aria-label="Poor answer"
        aria-pressed={rating === -1}
        onClick={() => onRate(id, -1)}
      >
        <Icon name="thumb" />
      </button>
    </div>
  );
}
