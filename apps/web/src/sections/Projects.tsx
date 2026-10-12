import type { Guide } from '../Guide';
import { projects, smallProjects } from '../content';
import { Trace } from '../parts';

export function Projects({ marked }: Pick<Guide, 'marked'>) {
  return (
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
                <a className="row-link" href="/projects/testpilot/">
                  Read the TestPilot case study
                </a>
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
  );
}
