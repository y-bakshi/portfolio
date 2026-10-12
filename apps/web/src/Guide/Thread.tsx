import { education, projects, roles, suggestions, type Answer } from '../content';
import type { Status } from './shared';

/** A finished question and its answer. */
export type Exchange = { q: string; text: string; cites: string[] };

const nameFor = (id: string) =>
  projects.find((p) => p.id === id)?.name ??
  roles.find((r) => r.id === id)?.org ??
  education.find((e) => e.id === id)?.org ??
  (id === 'contact' ? 'Contact' : id === 'tools' ? 'What I work with' : id);

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
  answer: Answer | null;
  onShow: (id: string) => void;
};

/** The whole conversation: earlier exchanges, then the question being answered. */
export function Thread({ history, asked, status, shown, answer, onShow }: ThreadProps) {
  return (
    <>
      {history.map((h, i) => (
        <div className="exchange" key={i}>
          <p className="msg msg-user">{h.q}</p>
          <p className="ask-lede msg-answer">{h.text}</p>
          <CiteList ids={h.cites} onShow={onShow} />
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
