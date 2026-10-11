import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { education, projects, roles, smallProjects, stackGroups } from './content';
import { DotGrid } from './DotGrid';
import { MistPortrait } from './MistPortrait';
import { GuideDock, useGuide } from './Guide';
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

export function Home() {
  const g = useGuide();
  const { isMobile, thread, marked } = g;
  const feedRef = g.refs.feedRef;

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

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
                  ) : p.links ? (
                    <ul className="row-links" aria-label={`${p.name} links`}>
                      {p.links.map((l) => (
                        <li key={l.href}>
                          <a
                            className="row-link"
                            href={l.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${l.label}, ${p.name} (opens in a new tab)`}
                          >
                            {l.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            ))}
            <article className="row" aria-labelledby="small-name">
              <div className="row-head">
                <h3 id="small-name">Smaller projects</h3>
                <p className="row-line">Coursework and experiments.</p>
              </div>
              <div className="row-body">
                <ul className="small-list">
                  {smallProjects.map((sp) => (
                    <li key={sp.name}>
                      <strong>{sp.name}.</strong> {sp.line}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
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

        <section className="record" aria-labelledby="education-title">
          <div className="section-card">
            <h2 id="education-title" className="section-title">
              Education
            </h2>
          </div>
          <ol className="record-list">
            {education.map((e) => (
              <li
                key={e.id}
                id={e.id}
                tabIndex={-1}
                className={`record-item${marked === e.id ? ' is-marked' : ''}`}
              >
                <p className="record-when">{e.when}</p>
                <div>
                  <h3>
                    {e.title}, {e.org}
                  </h3>
                  <p>{e.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="tools" aria-labelledby="tools-title">
          <div className="section-card">
            <h2 id="tools-title" className="section-title">
              What I work with
            </h2>
          </div>
          <dl
            className={`tools-list${marked === 'tools' ? ' is-marked' : ''}`}
            id="tools"
            tabIndex={-1}
          >
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
      <GuideDock g={g} />
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
