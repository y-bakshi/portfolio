import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Answer, answerFor, projects, roles, stackGroups, suggestions } from './content';
import { DotGrid } from './DotGrid';
import { MistPortrait } from './MistPortrait';
import { SiteHeader, Trace } from './parts';

const contactLinks = [
  { label: 'ybakshi@asu.edu', href: 'mailto:ybakshi@asu.edu', icon: 'fi fi-sr-envelope' },
  {
    label: 'bakshi.yash@outlook.com',
    href: 'mailto:bakshi.yash@outlook.com',
    icon: 'fi fi-sr-envelope',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/yash-bakshi-56615a62/',
    icon: 'fi fi-brands-linkedin',
    external: true,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/y-bakshi',
    icon: 'fi fi-brands-github',
    external: true,
  },
  {
    label: 'Book a 30 minute call',
    href: 'https://calendar.app.google/GNW9xhXdiq7Mv9bU9',
    icon: 'fi fi-sr-calendar',
    external: true,
  },
];

type Status = 'ready' | 'thinking' | 'answering';

const statusLabel: Record<Status, string> = {
  ready: 'Ready for your question',
  thinking: 'Looking through the notes',
  answering: 'Answering, one moment',
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Home() {
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
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  useEffect(() => {
    // On phones the on-screen keyboard shrinks the visual viewport but not the layout viewport, so a
    // fixed drawer would sit behind it. Publish the keyboard height and visible height as CSS variables.
    const vv = window.visualViewport;
    if (!vv || !open || !isMobile) return;
    const root = document.documentElement.style;
    const update = () => {
      root.setProperty('--kb', `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`);
      root.setProperty('--vvh', `${vv.height}px`);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      root.removeProperty('--kb');
      root.removeProperty('--vvh');
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
    // in the phone drawer the newest question sits at the top of the log so its answer reads from the first word
    const log = logRef.current;
    const qs = log?.querySelectorAll<HTMLElement>('.msg-user');
    const q = qs && qs[qs.length - 1];
    if (log && q) log.scrollTop = q.offsetTop;
  }, [asked, isMobile]);

  const [closing, setClosing] = useState(false);
  const closeDock = () => {
    toggleRef.current?.focus();
    if (isMobile || prefersReducedMotion()) {
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
    if (!isMobile && window.scrollY > 0) window.scrollTo({ top: 0 });
    clearTimers();
    if (asked && answer) setHistory((h) => [...h, { q: asked, text: answer.text, cites: answer.cites }]);
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
    (id === 'contact' ? 'Contact' : id);

  const thread = (
    <>
      {history.map((h, i) => (
        <div className="exchange" key={i}>
          <p className="msg msg-user">{h.q}</p>
          <p className="ask-lede msg-answer">{h.text}</p>
          {h.cites.length > 0 && (
            <ul className="cites" aria-label="Sources on this page">
              {h.cites.map((id) => (
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
          )}
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
      {answer && status === 'ready' && answer.cites.length > 0 && (
        <ul className="cites" aria-label="Sources on this page">
          {answer.cites.map((id) => (
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
      )}
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

  return (
    <>
      <DotGrid />
      <SiteHeader />
      <main id="main">
        <section className="ask" aria-labelledby="ask-title">
          <h1 id="ask-title" className="sr-only">
            Yash Bakshi, software engineer
          </h1>
          <figure className="portrait">
            <MistPortrait
              src="/portrait.webp"
              width={1100}
              height={1075}
              alt="Illustrated portrait of Yash Bakshi in a beanie and sunglasses, looking down"
            />
          </figure>
          <div className="feed" ref={feedRef} aria-label="Conversation with the guide">
            <p className="ask-lede">
              I’m Yash Bakshi, a software engineer working across AI applications, backend services
              and cloud delivery. The guide in the corner is an assistant that answers questions
              about my projects from my own notes.
            </p>
            {!isMobile && thread}
          </div>
        </section>

        <section className="work" id="work" aria-labelledby="work-title">
          <div className="section-card">
            <h2 id="work-title" className="section-title">
              Projects
            </h2>
            <p className="section-lede">
              Each trace shows the stages in the order the system runs them, drawn from my project
              notes. Timings are not measured, so none are shown.
            </p>
          </div>
          <div className="rows">
            {projects.map((p) => (
              <article
                key={p.id}
                id={p.id}
                tabIndex={-1}
                className={`row${marked === p.id ? ' is-marked' : ''}`}
                aria-labelledby={`${p.id}-name`}
              >
                <div className="row-head">
                  <h3 id={`${p.id}-name`}>{p.name}</h3>
                  <p className="row-line">{p.line}</p>
                </div>
                <div className="row-body">
                  <p>{p.detail}</p>
                  <p className="row-role">{p.role}</p>
                  <Trace steps={p.trace} label={`${p.name} pipeline`} />
                  <ul className="stack-list" aria-label={`${p.name} technologies`}>
                    {p.stack.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  {p.id === 'testpilot' ? (
                    <Link className="row-link" to="/projects/testpilot">
                      Read the TestPilot case study
                    </Link>
                  ) : (
                    <p className="row-pending">Case study in preparation.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="record" id="record" aria-labelledby="record-title">
          <div className="section-card">
            <h2 id="record-title" className="section-title">
              Work history
            </h2>
          </div>
          <ol className="record-list">
            {roles.map((r) => (
              <li
                key={r.id}
                id={r.id}
                tabIndex={-1}
                className={`record-item${marked === r.id ? ' is-marked' : ''}`}
              >
                <p className="record-when">{r.when}</p>
                <div>
                  <h3>
                    {r.title}, {r.org}
                  </h3>
                  <p>{r.note}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="fineprint">
            Dates and descriptions come from my résumé and will be confirmed before launch.
          </p>
        </section>

        <section className="tools" aria-labelledby="tools-title">
          <div className="section-card">
            <h2 id="tools-title" className="section-title">
              What I work with
            </h2>
          </div>
          <dl className="tools-list">
            {stackGroups.map((g) => (
              <div key={g.group}>
                <dt>{g.group}</dt>
                <dd>{g.items}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          className={`contact${marked === 'contact' ? ' is-marked' : ''}`}
          id="contact"
          tabIndex={-1}
          aria-labelledby="contact-title"
        >
          <h2 id="contact-title" className="contact-title">
            Have a problem worth working through?
          </h2>
          <ul className="contact-links">
            {contactLinks.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <i className={`${c.icon} contact-icon`} aria-hidden="true" />
                  <span>{c.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <div className={`dock-scrim${open ? ' is-open' : ''}`} onClick={closeDock} aria-hidden="true" />
      <aside className={`dock${open ? ' is-open' : ''}${closing ? ' is-closing' : ''}`} aria-label="Guide chat" onKeyDown={onDockKey}>
        <p className="sr-only" aria-live="polite">
          {statusLabel[status]}
        </p>
        <p className="sr-only" role="status">
          {announce}
        </p>
        <button
          type="button"
          ref={toggleRef}
          className="dock-bar"
          aria-expanded={open}
          aria-controls="dock-open"
          aria-label={`Ask the guide, ${statusLabel[status].toLowerCase()}`}
          onClick={() => setOpen(true)}
          tabIndex={open ? -1 : 0}
        >
          <span className="dock-title">
            Ask the guide
            <span className="dock-state">{statusLabel[status]}</span>
          </span>
          <span className={`light light-${status}`} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <i className="fi fi-sr-comment-alt-dots dock-chevron" aria-hidden="true" />
        </button>
        <div id="dock-open" className="dock-open" {...(open ? {} : ({ inert: '' } as object))}>
          {isMobile && (
            <>
              <span className="dock-handle" aria-hidden="true" />
              <div className="dock-head">
                <span className={`light light-${status}`} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
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
                  <i className="fi fi-sr-cross-small" aria-hidden="true" />
                </button>
              </div>
              <div className="dock-log" ref={logRef}>
                {!asked && (
                  <>
                    <p className="console-note">
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
          {!isMobile && chipList}
          <form className="dock-form" onSubmit={onSubmit}>
            <span className={`light light-${status}`} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <label htmlFor="ask-input" className="sr-only">
              Ask the guide about Yash’s work
            </label>
            <input
              id="ask-input"
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={statusLabel[status]}
              autoComplete="off"
            />
            <button type="submit" className="dock-ask" disabled={status !== 'ready'}>
              Ask
            </button>
            {!isMobile && scrolled && (
              <button type="button" className="dock-top" onClick={() => window.scrollTo({ top: 0 })}>
                <i className="fi fi-sr-angle-small-up" aria-hidden="true" />
                Back to top
              </button>
            )}
            {!isMobile && (
              <button
                type="button"
                className="dock-close"
                aria-label="Close the guide"
                onClick={closeDock}
              >
                <i className="fi fi-sr-cross-small" aria-hidden="true" />
              </button>
            )}
          </form>
        </div>
      </aside>
      <footer className="site-footer">
        <p>Yash Bakshi</p>
        <p>
          © 2026. Work in progress. Icons by{' '}
          <a href="https://www.flaticon.com" target="_blank" rel="noopener noreferrer">
            Flaticon
          </a>
          .
        </p>
      </footer>
    </>
  );
}

export default Home;
