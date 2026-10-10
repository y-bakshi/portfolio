import { Link } from 'react-router-dom';
import { projects } from './content';
import { DotGrid } from './DotGrid';
import { SiteHeader, Trace } from './parts';

const project = projects.find((p) => p.id === 'testpilot')!;

export function CaseStudy() {
  return (
    <>
      <DotGrid />
      <SiteHeader />
      <main id="main" className="case">
        <p className="case-back">
          <Link to="/#work">All projects</Link>
        </p>
        <div className="case-head">
          <h1 className="case-title">{project.name}</h1>
          <p className="case-lede">{project.line}</p>
        </div>

        <div className="case-grid">
          <article className="case-text">
            <h2>The problem</h2>
            <p>[Owner to write: the testing gap this project addresses, in your own words.]</p>

            <h2>How it works</h2>
            <p>{project.detail}</p>
            <Trace steps={project.trace} label="TestPilot pipeline" />
            <p className="fineprint">
              Stage order comes from project notes and will be checked against the repository before
              this diagram is final.
            </p>

            <h2>Results</h2>
            <p className="case-pending">
              No measured results yet. Numbers will appear here once they are verified, with how
              they were measured.
            </p>
          </article>

          <aside className="case-facts" aria-label="Project facts">
            <dl>
              <div>
                <dt>My part</dt>
                <dd>{project.role}</dd>
              </div>
              <div>
                <dt>Built with</dt>
                <dd>{project.stack.join(', ')}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>[Repository link to come]</dd>
              </div>
              <div>
                <dt>Demo</dt>
                <dd>[Demo link to come]</dd>
              </div>
            </dl>
            <Link className="solid-link" to="/#contact">
              Contact Yash
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}

export default CaseStudy;
