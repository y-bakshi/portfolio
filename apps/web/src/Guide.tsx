import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Answer, answerFor, education, projects, roles, suggestions } from './content';
import { Icon } from './Icon';

type Status = 'ready' | 'thinking' | 'answering';

const statusLabel: Record<Status, string> = {
  ready: 'Ready for your question',
  thinking: 'Looking through the notes',
  answering: 'Answering, one moment',
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The guide's state and behaviour. On wide screens the conversation shows in the hero; on phones it
 * shows inside the chat itself.
 */
export function useGuide() {
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState('');
  /** Finished exchanges, oldest first. The one in progress lives in asked, answer and shown. */
  const [history, setHistory] = useState<{ q: string; text: string; cites: string[] }[]>([]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [shown, setShown] = useState('');
  const [announce, setAnnounce] = useState('');
  const [status, setStatus] = useState<Status>('ready');
  const [marked, setMarked] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const on = () => setIsMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  /** Phones show the conversation inside the chat; wide screens show it in the hero. */
  const showLog = isMobile;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 400);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  useEffect(() => {
    // On phones the on-screen keyboard shrinks the visual viewport but not the layout viewport, so a
    // fixed chat would sit behind it. Publish the visible area's top and height as CSS variables.
    const vv = window.visualViewport;
    if (!vv || !open || !isMobile) return;
    const root = document.documentElement.style;
    const update = () => {
      root.setProperty('--vvt', `${vv.offsetTop}px`);
      root.setProperty('--vvh', `${vv.height}px`);
    };
    update();
    // the full-screen chat owns the screen, so the page behind it must not scroll
    document.documentElement.classList.add('chat-open');
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      root.removeProperty('--vvt');
      root.removeProperty('--vvh');
      document.documentElement.classList.remove('chat-open');
    };
  }, [open, isMobile]);
  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    // the wide-screen feed scrolls inside its own column to follow the newest text; the page never moves
    if (isMobile) return;
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [asked, shown, status, history.length, isMobile]);
  useEffect(() => {
    // on phones the newest question sits at the top of the log so its answer reads from the first word.
    // Re-pin as the answer grows and when its buttons appear; a pin made only when the question is sent
    // would be clamped, because nothing exists below the question yet.
    const log = logRef.current;
    const qs = log?.querySelectorAll<HTMLElement>('.msg-user');
    const q = qs && qs[qs.length - 1];
    if (log && q) log.scrollTop = Math.max(0, q.offsetTop - 14);
  }, [asked, shown, status, history.length, isMobile]);

  const [closing, setClosing] = useState(false);
  // The bar is hidden while the chat is open, so focus can only go back to it once it is showing again.
  const returnFocus = useRef(false);
  useEffect(() => {
    if (!open && returnFocus.current) {
      returnFocus.current = false;
      toggleRef.current?.focus();
    }
  }, [open]);
  const closeDock = () => {
    returnFocus.current = true;
    if (showLog || prefersReducedMotion()) {
      setOpen(false);
      return;
    }
    // let the open bar fade out (120 ms) before it collapses to the pill
    setClosing(true);
    timers.current.push(
      window.setTimeout(() => {
        setOpen(false);
        setClosing(false);
      }, 130),
    );
  };
  const onDockKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && open) closeDock();
  };

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || status !== 'ready') return;
    setOpen(true);
    if (!showLog && window.scrollY > 0) window.scrollTo({ top: 0 });
    clearTimers();
    if (asked && answer)
      setHistory((h) => [...h, { q: asked, text: answer.text, cites: answer.cites }]);
    setAsked(q);
    setQuestion('');
    setAnswer(null);
    setShown('');
    setAnnounce('');
    setMarked(null);
    setStatus('thinking');

    const result = answerFor(q);
    const reduce = prefersReducedMotion();
    timers.current.push(
      window.setTimeout(
        () => {
          setAnswer(result);
          setStatus('answering');
          if (reduce) {
            setShown(result.text);
            setAnnounce(result.text);
            setStatus('ready');
            return;
          }
          const words = result.text.split(' ');
          let i = 0;
          const tick = () => {
            i += 1;
            setShown(words.slice(0, i).join(' '));
            if (i < words.length) timers.current.push(window.setTimeout(tick, 28));
            else {
              setStatus('ready');
              setAnnounce(result.text);
            }
          };
          tick();
        },
        reduce ? 0 : 450,
      ),
    );
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      inputRef.current?.focus();
      return;
    }
    ask(question);
  };

  const show = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (isMobile) setOpen(false);
    // Scroll behavior comes from the stylesheet, so this matches every other jump on the page.
    // a jump of more than a screen and a half is instant; a long smooth scroll just makes people wait
    const far = Math.abs(el.getBoundingClientRect().top) > window.innerHeight * 1.5;
    el.scrollIntoView({ block: 'start', behavior: far ? ('instant' as ScrollBehavior) : 'auto' });
    // Move keyboard and screen reader focus to the target as well.
    el.focus({ preventScroll: true });
    const wait = prefersReducedMotion() ? 0 : 500;
    timers.current.push(window.setTimeout(() => setMarked(id), wait));
    timers.current.push(window.setTimeout(() => setMarked(null), wait + 4000));
  };

  const nameFor = (id: string) =>
    projects.find((p) => p.id === id)?.name ??
    roles.find((r) => r.id === id)?.org ??
    education.find((e) => e.id === id)?.org ??
    (id === 'contact' ? 'Contact' : id === 'tools' ? 'What I work with' : id);

  /** The buttons under an answer that jump to the sections it draws on. */
  const citeList = (ids: string[]) =>
    ids.length > 0 && (
      <ul className="cites" aria-label="Sources on this page">
        {ids.map((id) => (
          <li key={id}>
            <button
              type="button"
              aria-label={`Show ${nameFor(id)} on the page`}
              onClick={() => show(id)}
            >
              {nameFor(id)}
            </button>
          </li>
        ))}
      </ul>
    );

  const thread = (
    <>
      {history.map((h, i) => (
        <div className="exchange" key={i}>
          <p className="msg msg-user">{h.q}</p>
          <p className="ask-lede msg-answer">{h.text}</p>
          {citeList(h.cites)}
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
      {answer && status === 'ready' && citeList(answer.cites)}
    </>
  );

  const chipList = (
    <ul className="chips" aria-label="Suggested questions">
      {suggestions.map((sug) => (
        <li key={sug}>
          <button type="button" onClick={() => ask(sug)} disabled={status !== 'ready'}>
            {sug}
          </button>
        </li>
      ))}
    </ul>
  );

  return {
    question,
    setQuestion,
    asked,
    history,
    answer,
    shown,
    announce,
    status,
    marked,
    open,
    setOpen,
    closing,
    closeDock,
    onDockKey,
    scrolled,
    isMobile,
    showLog,
    ask,
    onSubmit,
    show,
    thread,
    chipList,
    refs: { inputRef, toggleRef, feedRef, logRef },
  };
}

export type Guide = ReturnType<typeof useGuide>;

/** The red, yellow and green light; the words beside it say the same thing. */
function StatusLight({ status }: { status: Status }) {
  return (
    <span className={`light light-${status}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

/** The bar at the bottom right and the chat it opens. */
export function GuideDock({ g }: { g: Guide }) {
  const {
    question,
    setQuestion,
    asked,
    status,
    announce,
    open,
    setOpen,
    closing,
    closeDock,
    onDockKey,
    scrolled,
    showLog,
    onSubmit,
    thread,
    chipList,
    refs,
  } = g;

  const showTop = !showLog && scrolled;

  return (
    <>
      <button
        type="button"
        className={`to-top${showTop ? ' is-shown' : ''}`}
        tabIndex={showTop ? 0 : -1}
        aria-hidden={!showTop}
        onClick={() => window.scrollTo({ top: 0 })}
      >
        <Icon name="angleUp" />
        Back to top
      </button>
      <div
        className={`dock-scrim${open ? ' is-open' : ''}`}
        onClick={closeDock}
        aria-hidden="true"
      />
      <aside
        className={`dock${open ? ' is-open' : ''}${closing ? ' is-closing' : ''}`}
        aria-label="Guide chat"
        onKeyDown={onDockKey}
      >
        <p className="sr-only" aria-live="polite">
          {statusLabel[status]}
        </p>
        <p className="sr-only" role="status">
          {announce}
        </p>
        <button
          type="button"
          ref={refs.toggleRef}
          className="dock-bar"
          aria-expanded={open}
          aria-controls="dock-open"
          aria-label={`Ask the guide, ${statusLabel[status].toLowerCase()}`}
          onClick={() => setOpen(true)}
          tabIndex={open ? -1 : 0}
        >
          <StatusLight status={status} />
          <Icon name="comment" className="dock-chevron" />
          <span className="dock-title">
            Ask the guide
            <span className="dock-state">{statusLabel[status]}</span>
          </span>
        </button>
        <div id="dock-open" className="dock-open" {...(open ? {} : ({ inert: '' } as object))}>
          {showLog && (
            <>
              <span className="dock-handle" aria-hidden="true" />
              <div className="dock-head">
                <StatusLight status={status} />
                <h2>
                  Ask the guide
                  <span className="dock-state">{statusLabel[status]}</span>
                </h2>
                <button
                  type="button"
                  className="dock-close"
                  aria-label="Close the guide"
                  onClick={closeDock}
                >
                  <Icon name="cross" />
                </button>
              </div>
              <div className="dock-log" ref={refs.logRef}>
                {!asked && (
                  <>
                    <p className="chat-note">
                      I answer from Yash’s project notes. The full version is still in development.
                    </p>
                    {chipList}
                  </>
                )}
                {thread}
              </div>
              {asked && <div className="chips-strip">{chipList}</div>}
            </>
          )}
          {!showLog && chipList}
          <form className="dock-form" onSubmit={onSubmit}>
            <StatusLight status={status} />
            <label htmlFor="ask-input" className="sr-only">
              Ask the guide about Yash’s work
            </label>
            <input
              id="ask-input"
              ref={refs.inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={statusLabel[status]}
              autoComplete="off"
            />
            <button type="submit" className="dock-ask" disabled={status !== 'ready'}>
              Ask
            </button>
            {!showLog && (
              <button
                type="button"
                className="dock-close"
                aria-label="Close the guide"
                onClick={closeDock}
              >
                <Icon name="cross" />
              </button>
            )}
          </form>
        </div>
      </aside>
    </>
  );
}
