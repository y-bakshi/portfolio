import { projects } from './content';
import { testpilotCase as study } from './content/testpilot-case';
import { DotGrid } from './DotGrid';
import { SiteHeader, Trace, WipBanner } from './parts';

const project = projects.find((p) => p.id === 'testpilot')!;

/** The TestPilot case study page. */
export function CaseStudy() {
  return (
    <>
      <DotGrid />
      <WipBanner />
      <SiteHeader />
      <main id="main" className="case">
        <p className="case-back">
          <a href="/projects/">All projects</a>
        </p>
        <div className="case-head">
          <h1 className="case-title">{project.name}</h1>
          <p className="case-lede">{project.line}</p>
        </div>

        <div className="case-grid">
          <article className="case-text">
            <h2>The problem</h2>
            {study.problem.map((t) => (
              <p key={t}>{t}</p>
            ))}

            <h2>How it works</h2>
            <p>{project.detail}</p>
            <Trace steps={project.trace} label="TestPilot pipeline" />

            <h2>What I built</h2>
            {study.built.map((t) => (
              <p key={t}>{t}</p>
            ))}

            <h2>Results</h2>
            {study.results.map((r) => (
              <p key={r.lead}>
                <strong>{r.lead}</strong> {r.text}
              </p>
            ))}
          </article>

          <aside className="case-facts" aria-label="Project facts">
            <dl>
              <div>
                <dt>My part</dt>
                <dd>{project.role}</dd>
              </div>
              <div>
                <dt>Team</dt>
                <dd>{study.team}</dd>
              </div>
              <div>
                <dt>Built with</dt>
                <dd>{project.stack.join(', ')}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{study.source}</dd>
              </div>
              <div>
                <dt>Demo</dt>
                <dd>
                  <a
                    className="row-link"
                    href={study.demo.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Live demo of TestPilot (opens in a new tab)"
                  >
                    Live demo
                  </a>
                  {study.demo.after}
                </dd>
              </div>
            </dl>
            <a className="solid-link" href="/#contact">
              Contact Yash
            </a>
          </aside>
        </div>
      </main>
    </>
  );
}

export default CaseStudy;
