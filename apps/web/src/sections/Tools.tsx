import type { Guide } from '../Guide';
import { stackGroups } from '../content';

export function Tools({ marked }: Pick<Guide, 'marked'>) {
  return (
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
  );
}
