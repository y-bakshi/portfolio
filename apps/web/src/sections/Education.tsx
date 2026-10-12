import type { Guide } from '../Guide';
import { OrgMark } from './OrgMark';
import { education } from '../content';

/** The education list. */
export function Education({ marked }: Pick<Guide, 'marked'>) {
  return (
    <section className="record" id="education" aria-labelledby="education-title">
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
            <div className="record-side">
              <p className="record-when">{e.when}</p>
              <OrgMark org={e.org} mark={e.mark} logo={e.logo} />
            </div>
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
  );
}
