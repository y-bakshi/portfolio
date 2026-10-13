import type { Guide } from '../Guide';
import { projects } from '../content';
import { ProjectTile } from './ProjectTile';
import { Swipe } from './Swipe';

const featured = projects.filter((p) => p.featured);

/** The projects screen: the four strongest projects, all in view at once on a wide screen, and a link to all of them. */
export function Projects({ marked }: Pick<Guide, 'marked'>) {
  return (
    <section className="work" id="work" aria-labelledby="work-title">
      <div className="work-head">
        <div className="section-card">
          <h2 id="work-title" className="section-title">
            Projects
          </h2>
        </div>
        <a className="work-all" href="/projects/">
          See all projects
        </a>
      </div>
      <Swipe as="div" className="tiles" label="Projects">
        {featured.map((p) => (
          <ProjectTile key={p.id} p={p} marked={marked} />
        ))}
      </Swipe>
    </section>
  );
}
