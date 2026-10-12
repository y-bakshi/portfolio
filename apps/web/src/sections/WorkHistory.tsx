import type { Guide } from '../Guide';
import { roles } from '../content';

export function WorkHistory({ marked }: Pick<Guide, 'marked'>) {
  return (
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
  );
}
