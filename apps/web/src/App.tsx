import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Answer, answerFor, projects, roles, stackGroups, suggestions } from './content';
import { DotGrid } from './DotGrid';
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
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [shown, setShown] = useState('');
  const [announce, setAnnounce] = useState('');
  const [status, setStatus] = useState<Status>('ready');
  const [marked, setMarked] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || status !== 'ready') return;
    clearTimers();
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
    // Scroll behavior comes from the stylesheet, so this matches every other jump on the page.
    el.scrollIntoView({ block: 'start' });
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

  return (
    <>
      <DotGrid />
      <SiteHeader />
      <main id="main">
        <section className="ask" aria-labelledby="ask-title">
          <h1 id="ask-title" className="ask-headline">
            <span>AI becomes useful when</span>
            <span>engineering carries it</span>
            <span>beyond the demo.</span>
          </h1>
          <p className="ask-lede">
            I’m Yash Bakshi, a software engineer who builds AI applications and the backend, cloud
            and delivery work around them. The guide below is an assistant that answers questions
            about my projects from my own notes.
          </p>

          <div className="ask-body">
            <div className="console">
              <form className="console-form" onSubmit={onSubmit}>
                <label htmlFor="ask-input" className="console-label">
                  Ask the guide about Yash’s work
                </label>
                <div className="console-row">
                  <input
                    id="ask-input"
                    ref={inputRef}
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What has Yash built with RAG?"
                    autoComplete="off"
                  />
                  <button type="submit" disabled={status !== 'ready'}>
                    Ask
                  </button>
                </div>
              </form>

              <ul className="chips" aria-label="Suggested questions">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => ask(s)} disabled={status !== 'ready'}>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="console-out">
                <p className="console-status" aria-live="polite">
                  <span className={`light light-${status}`} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  {statusLabel[status]}
                </p>
                {asked && <p className="console-q">{asked}</p>}
                {shown && (
                  <p className="console-a" aria-hidden={status !== 'ready'}>
                    {shown}
                  </p>
                )}
                <p className="sr-only" role="status">
                  {announce}
                </p>
                {answer && status === 'ready' && answer.cites.length > 0 && (
                  <ul className="cites" aria-label="Sources on this page">
                    {answer.cites.map((id) => (
                      <li key={id}>
                        <button type="button" onClick={() => show(id)}>
                          Show {nameFor(id)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!asked && (
                  <p className="console-note">
                    The guide is an assistant that answers from Yash’s project notes. The full
                    version is still in development.
                  </p>
                )}
              </div>
            </div>
            <figure className="portrait">
              <img
                src="/portrait.webp"
                width="1100"
                height="1075"
                alt="Illustrated portrait of Yash Bakshi in a beanie and sunglasses, looking down"
              />
            </figure>
          </div>
        </section>

        <section className="work" id="work" aria-labelledby="work-title">
          <h2 id="work-title" className="section-title">
            Projects
          </h2>
          <p className="section-lede">
            Each trace shows the stages in the order the system runs them, drawn from my project
            notes. Timings are not measured, so none are shown.
          </p>
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
          <h2 id="record-title" className="section-title">
            Work history
          </h2>
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
          <h2 id="tools-title" className="section-title">
            What I work with
          </h2>
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
