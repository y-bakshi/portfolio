import { education, projects, roles, suggestions } from '../content';
import { Feedback } from './Feedback';
import type { Status } from './shared';
import type { Current } from './useChat';
import type { Rating } from './storage';

/** A finished question and its answer. Only an answer the server stored has an id and can be rated. */
export type Exchange = {
  q: string;
  text: string;
  cites: string[];
  id?: string;
  rating?: Rating | null;
};

const nameFor = (id: string) =>
  projects.find((p) => p.id === id)?.name ??
  roles.find((r) => r.id === id)?.org ??
  education.find((e) => e.id === id)?.org ??
  (id === 'contact' ? 'Contact' : id);

const question =
  'ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[0.95rem] text-panel';
const answer = 'max-w-[94%] text-[0.95rem] leading-relaxed text-ink';

/** The buttons under an answer that jump to the sections it draws on. */
function CiteList({ ids, onShow }: { ids: string[]; onShow: (id: string) => void }) {
  if (ids.length === 0) return null;
  return (
    <ul aria-label="Sources on this page" className="mt-2 flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <li key={id}>
          <button
            type="button"
            aria-label={`Show ${nameFor(id)} on the page`}
            onClick={() => onShow(id)}
            className="rounded-full border border-line bg-panel px-3 py-1 text-sm font-medium text-ink transition hover:border-action hover:text-action"
          >
            {nameFor(id)}
          </button>
        </li>
      ))}
    </ul>
  );
}

type ThreadProps = {
  history: Exchange[];
  asked: string;
  status: Status;
  shown: string;
  answer: Current | null;
  onShow: (id: string) => void;
  onRate: (id: string, value: Rating) => void;
};

/** The whole conversation: earlier exchanges, then the question being answered. */
export function Thread({
  history,
  asked,
  status,
  shown,
  answer: current,
  onShow,
  onRate,
}: ThreadProps) {
  return (
    <div className="flex flex-col gap-4">
      {history.map((h, i) => (
        <div className="flex flex-col gap-2" key={i} data-exchange>
          <p data-question className={question}>
            {h.q}
          </p>
          <div>
            <p data-answer className={answer}>
              {h.text}
            </p>
            <CiteList ids={h.cites} onShow={onShow} />
            {h.id && <Feedback id={h.id} rating={h.rating} onRate={onRate} />}
          </div>
        </div>
      ))}
      {asked && (
        <p data-question className={question}>
          {asked}
        </p>
      )}
      {status === 'thinking' && (
        <p data-answer className={`${answer} animate-pulse text-muted`} aria-hidden="true">
          Looking through the notes…
        </p>
      )}
      {shown && (
        <p data-answer className={answer} aria-hidden={status !== 'ready'}>
          {shown}
        </p>
      )}
      {current && status === 'ready' && <CiteList ids={current.cites} onShow={onShow} />}
      {current?.id && status === 'ready' && (
        <Feedback id={current.id} rating={current.rating} onRate={onRate} />
      )}
    </div>
  );
}

/** The suggested questions. */
export function Chips({ status, onAsk }: { status: Status; onAsk: (q: string) => void }) {
  return (
    <ul aria-label="Suggested questions" className="flex flex-col gap-2">
      {suggestions.map((sug) => (
        <li key={sug}>
          <button
            type="button"
            onClick={() => onAsk(sug)}
            disabled={status !== 'ready'}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-panel px-4 py-3 text-left text-[0.95rem] font-medium text-ink shadow-soft transition hover:-translate-y-px hover:border-action hover:shadow-lift disabled:opacity-50"
          >
            {sug}
          </button>
        </li>
      ))}
    </ul>
  );
}
