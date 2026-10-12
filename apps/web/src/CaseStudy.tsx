import { projects } from './content';
import { DotGrid } from './DotGrid';
import { SiteHeader, Trace } from './parts';

const project = projects.find((p) => p.id === 'testpilot')!;

/** The TestPilot case study page. */
export function CaseStudy() {
  return (
    <>
      <DotGrid />
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
            <p>
              Writing unit tests is slow, and teams rarely know which files deserve tests first.
              General code assistants write tests that ignore a team’s own conventions, and nothing
              tells you where defects are most likely. TestPilot was our SER 594 course project at
              Arizona State University: generate tests that follow a team’s coding standards, and
              point at the files most worth testing.
            </p>

            <h2>How it works</h2>
            <p>{project.detail}</p>
            <Trace steps={project.trace} label="TestPilot pipeline" />

            <h2>What I built</h2>
            <p>
              I led the AI pipeline, the model integration and the backend. Coding standards are
              split into chunks, embedded with all-MiniLM-L6-v2 and stored in pgvector. For each
              request the five closest chunks go into a structured prompt, and a local Qwen Coder 7B
              model, served by Ollama on a Cloud Run GPU, streams the tests back as they are
              written.
            </p>
            <p>
              A second pass scores each result for correctness, assertion quality, edge-case
              coverage and readability. Anything below 0.6 is regenerated with the critique as
              feedback.
            </p>
            <p>
              The defect heatmap scans a public GitHub repository with PyDriller and Radon and ranks
              files with a Random Forest. A teammate trained that model, and the team fine-tuned the
              generator with QLoRA on 10,000 Methods2Test pairs, keeping the training, validation
              and test splits separate.
            </p>

            <h2>Results</h2>
            <p>
              <strong>Defect prediction.</strong> A Random Forest trained on 6,052 Java files with
              21 code metrics, split 70/30, reached precision 0.39, recall 0.29, F1 0.34 and ROC-AUC
              0.66. That beats chance but is not good enough to trust alone, so the heatmap is for
              ranking where to look first, not for deciding.
            </p>
            <p>
              <strong>Retrieval.</strong> Over 8 labelled queries against 10 standards documents,
              precision at 5 was 0.375 and recall at 5 was 0.94: nearly every relevant standard
              reaches the top five, alongside some that are not. This was measured with TF-IDF as a
              stand-in for pgvector.
            </p>
          </article>

          <aside className="case-facts" aria-label="Project facts">
            <dl>
              <div>
                <dt>My part</dt>
                <dd>{project.role}</dd>
              </div>
              <div>
                <dt>Team</dt>
                <dd>Four people, SER 594 at Arizona State University.</dd>
              </div>
              <div>
                <dt>Built with</dt>
                <dd>{project.stack.join(', ')}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>Private course repository. Code walkthrough on request.</dd>
              </div>
              <div>
                <dt>Demo</dt>
                <dd>
                  <a
                    className="row-link"
                    href="https://ser-594-team14-test-pilot.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Live demo of TestPilot (opens in a new tab)"
                  >
                    Live demo
                  </a>
                  . Sign up with an email and a one-time code; the AI engine takes about 30 seconds
                  to wake on a first visit.
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
