import { useEffect } from 'react';
import { projects, smallProjects } from './content';
import { DotGrid } from './DotGrid';
import { SiteHeader } from './parts';
import { ProjectTile } from './sections/ProjectTile';

/** Every project: the four featured, the rest, and the shared card for coursework. */
export function AllProjects() {
  // the page is drawn after load, so a link to one project has to scroll to it by hand
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  return (
    <>
      <DotGrid />
      <SiteHeader />
      <main id="main" className="all">
        <p className="case-back">
          <a href="/#work">Back to projects</a>
        </p>
        <div className="section-card">
          <h1 className="section-title">All projects</h1>
        </div>
        <div className="tiles">
          {projects.map((p) => (
            <ProjectTile key={p.id} p={p} marked={null} />
          ))}
        </div>
        <article className="row more-card" aria-labelledby="small-name">
          <h2 id="small-name" className="more-title">
            Smaller projects
          </h2>
          <ul className="small-list">
            {smallProjects.map((sp) => (
              <li key={sp.name}>
                <strong>{sp.name}.</strong> {sp.line}
              </li>
            ))}
          </ul>
        </article>
      </main>
    </>
  );
}

export default AllProjects;
