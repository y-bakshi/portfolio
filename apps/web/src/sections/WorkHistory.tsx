import type { Guide } from '../Guide';
import { OrgMark } from './OrgMark';
import { Swipe } from './Swipe';
import { roles } from '../content';

/** The work history list. */
export function WorkHistory({ marked }: Pick<Guide, 'marked'>) {
  return (
    <section className="record" id="record" aria-labelledby="record-title">
      <div className="section-card">
        <h2 id="record-title" className="section-title">
          Work history
        </h2>
      </div>
      <Swipe as="ol" className="record-list" label="Work history">
        {roles.map((r) => (
          <li
            key={r.id}
            id={r.id}
            tabIndex={-1}
            className={`record-item${marked === r.id ? ' is-marked' : ''}`}
          >
            <p className="record-when">{r.when}</p>
            <OrgMark org={r.org} mark={r.mark} logo={r.logo} />
            <div>
              <h3>
                {r.title}, {r.org}
              </h3>
              <p>{r.note}</p>
            </div>
          </li>
        ))}
      </Swipe>
    </section>
  );
}
