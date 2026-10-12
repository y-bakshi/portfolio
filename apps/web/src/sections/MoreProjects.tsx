import type { Guide } from '../Guide';
import { projects, smallProjects } from '../content';
import { ProjectLinks } from './ProjectTile';

const others = projects.filter((p) => !p.featured);

/** The projects that are not among the four featured, and the shared card for coursework. */
export function MoreProjects({ marked }: Pick<Guide, 'marked'>) {
  return (
    <section className="more" id="more" aria-labelledby="more-title">
      <div className="section-card">
        <h2 id="more-title" className="section-title">
          More projects
        </h2>
      </div>
      <div className="more-grid">
        <article className="row more-card" aria-labelledby="others-name">
          <h3 id="others-name" className="more-title">
            Other work
          </h3>
          <ul className="more-list">
            {others.map((p) => (
              <li
                key={p.id}
                id={p.id}
                tabIndex={-1}
                className={marked === p.id ? 'is-marked' : undefined}
              >
                <strong>{p.name}.</strong> {p.line} <span className="row-role">{p.role}</span>
                <ProjectLinks p={p} />
              </li>
            ))}
          </ul>
        </article>
        <article className="row more-card" aria-labelledby="small-name">
          <h3 id="small-name" className="more-title">
            Smaller projects
          </h3>
          <ul className="small-list">
            {smallProjects.map((sp) => (
              <li key={sp.name}>
                <strong>{sp.name}.</strong> {sp.line}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
