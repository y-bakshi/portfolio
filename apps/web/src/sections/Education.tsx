import type { Guide } from '../Guide';
import { education } from '../content';

export function Education({ marked }: Pick<Guide, 'marked'>) {
  return (
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
  );
}
