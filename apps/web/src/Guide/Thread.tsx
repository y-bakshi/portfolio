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

/** The buttons under an answer that jump to the sections it draws on. */
function CiteList({ ids, onShow }: { ids: string[]; onShow: (id: string) => void }) {
  if (ids.length === 0) return null;
  return (
    <ul className="cites" aria-label="Sources on this page">
      {ids.map((id) => (
        <li key={id}>
          <button
            type="button"
            aria-label={`Show ${nameFor(id)} on the page`}
            onClick={() => onShow(id)}
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
export function Thread({ history, asked, status, shown, answer, onShow, onRate }: ThreadProps) {
  return (
    <>
      {history.map((h, i) => (
        <div className="exchange" key={i}>
          <p className="msg msg-user">{h.q}</p>
          <p className="ask-lede msg-answer">{h.text}</p>
          <CiteList ids={h.cites} onShow={onShow} />
          {h.id && <Feedback id={h.id} rating={h.rating} onRate={onRate} />}
        </div>
      ))}
      {asked && <p className="msg msg-user">{asked}</p>}
      {status === 'thinking' && (
        <p className="ask-lede msg-answer msg-wait" aria-hidden="true">
          Looking through the notes…
        </p>
      )}
      {shown && (
        <p className="ask-lede msg-answer" aria-hidden={status !== 'ready'}>
          {shown}
        </p>
      )}
      {answer && status === 'ready' && <CiteList ids={answer.cites} onShow={onShow} />}
      {answer?.id && status === 'ready' && (
        <Feedback id={answer.id} rating={answer.rating} onRate={onRate} />
      )}
    </>
  );
}

/** The suggested questions. */
export function Chips({ status, onAsk }: { status: Status; onAsk: (q: string) => void }) {
  return (
    <ul className="chips" aria-label="Suggested questions">
      {suggestions.map((sug) => (
        <li key={sug}>
          <button type="button" onClick={() => onAsk(sug)} disabled={status !== 'ready'}>
            {sug}
          </button>
        </li>
      ))}
    </ul>
  );
}
