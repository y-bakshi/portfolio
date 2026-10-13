import type { Guide } from '../Guide';
import type { Project } from '../content';

/** The links a project has: the case study for TestPilot, otherwise any public source or demo. */
function ProjectLinks({ p }: { p: Project }) {
  if (p.id === 'testpilot')
    return (
      <a className="row-link" href="/projects/testpilot/">
        Case study
      </a>
    );
  if (!p.links) return null;
  return (
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
  );
}

/** One of the four strongest projects, as a card that fits the projects screen. */
export function ProjectTile({ p, marked }: { p: Project } & Pick<Guide, 'marked'>) {
  return (
    <article
      id={p.id}
      tabIndex={-1}
      className={`row tile${marked === p.id ? ' is-marked' : ''}`}
      aria-labelledby={`${p.id}-name`}
    >
      <div className="row-head">
        <h3 id={`${p.id}-name`}>{p.name}</h3>
        <p className="row-line">{p.line}</p>
      </div>
      <div className="row-body">
        <p>{p.detail}</p>
        <p className="row-role">{p.role}</p>
        <ul className="stack-list" aria-label={`${p.name} technologies`}>
          {p.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <div className="tile-actions">
          <ProjectLinks p={p} />
        </div>
      </div>
    </article>
  );
}

export { ProjectLinks };
