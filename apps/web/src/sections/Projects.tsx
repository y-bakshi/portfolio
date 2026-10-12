import type { Guide } from '../Guide';
import { projects } from '../content';
import { ProjectTile } from './ProjectTile';

const featured = projects.filter((p) => p.featured);

/** The projects screen: the four strongest projects, all in view at once on a wide screen. */
export function Projects({ marked }: Pick<Guide, 'marked'>) {
  return (
    <section className="work" id="work" aria-labelledby="work-title">
      <div className="section-card">
        <h2 id="work-title" className="section-title">
          Projects
        </h2>
      </div>
      <div className="tiles">
        {featured.map((p) => (
          <ProjectTile key={p.id} p={p} marked={marked} />
        ))}
      </div>
    </section>
  );
}
