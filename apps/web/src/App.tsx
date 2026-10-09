type Project = {
  name: string;
  category: string;
  summary: string;
  stack: string[];
  diagram: number;
};

type DiagramLayout = {
  nodes: [number, number][];
  route: string;
};

const projects: Project[] = [
  {
    name: 'TestPilot',
    category: 'AI applications · Testing',
    summary:
      'A retrieval and critique workflow for AI-assisted test generation and defect prediction.',
    stack: ['FastAPI', 'RAG', 'pgvector', 'Qwen', 'Cloud Run'],
    diagram: 0,
  },
  {
    name: 'GuardianAI',
    category: 'AI applications · Public safety',
    summary:
      'A collaborative safety assistant with database summaries for known incidents and a ReAct path for open questions.',
    stack: ['Next.js', 'FastAPI', 'Claude', 'PostgreSQL', 'Mapbox'],
    diagram: 1,
  },
  {
    name: 'CityWatch',
    category: 'AI applications · Event response',
    summary:
      'A multimodal pipeline that classifies incoming signals and routes alerts toward relevant departments.',
    stack: ['Kinesis', 'Lambda', 'Rekognition', 'Bedrock', 'EventBridge'],
    diagram: 2,
  },
  {
    name: 'Serverless Face Recognition',
    category: 'Cloud systems · Computer vision',
    summary: 'A two-stage detection and recognition pipeline connected through a message queue.',
    stack: ['PyTorch', 'MTCNN', 'FaceNet', 'Lambda', 'SQS'],
    diagram: 3,
  },
  {
    name: 'CatScript',
    category: 'Languages · Compilers',
    summary:
      'A C++ implementation of a small language, from lexical analysis through a tree-walking interpreter.',
    stack: ['C++17', 'Flex', 'Bison', 'AST', 'Interpreter'],
    diagram: 4,
  },
  {
    name: 'Streaming Data Pipeline',
    category: 'Data systems · Streaming',
    summary:
      'A taxi-event pipeline that carries streaming records into a graph database for later analysis.',
    stack: ['Kafka', 'Kubernetes', 'Neo4j', 'Docker'],
    diagram: 5,
  },
];

const skillGroups = [
  {
    group: 'AI applications',
    tools: 'Python · FastAPI · RAG · ReAct · retrieval evaluation · model serving',
    evidence: 'TestPilot, GuardianAI, CityWatch',
  },
  {
    group: 'Data & services',
    tools: 'PostgreSQL · pgvector · REST APIs · WebSockets · Kafka · Kinesis',
    evidence: 'Project systems and production services',
  },
  {
    group: 'Cloud & delivery',
    tools: 'AWS · GCP · Docker · Kubernetes · CI/CD · Linux',
    evidence: 'Cloud projects and service releases',
  },
  {
    group: 'Languages & platforms',
    tools: 'Python · Java · C++ · Rust · ServiceNow · RHEL',
    evidence: 'Professional record and systems projects',
  },
];

const roles = [
  {
    title: 'Software Engineering Intern',
    organization: 'Thryv',
    dates: 'May — Aug 2026',
    note: 'Service releases, performance tests, API compatibility, and production-readiness work.',
  },
  {
    title: 'Technical Team Lead',
    organization: 'InfoCenter, an Insight Company',
    dates: 'Jun — Dec 2024',
    note: 'ServiceNow delivery, mentoring, reviews, testing, and stakeholder coordination.',
  },
  {
    title: 'ServiceNow Developer',
    organization: 'Tata Consultancy Services',
    dates: 'Sep 2022 — May 2024',
    note: 'Discovery automation, CMDB workflows, portals, monitoring integrations, and runbooks.',
  },
  {
    title: 'Assistant Systems Engineer',
    organization: 'Tata Consultancy Services',
    dates: 'Nov 2021 — Sep 2022',
    note: 'Linux, containers, HPC operations, monitoring, and deployment validation.',
  },
];

const supportingWork = [
  {
    name: 'Procwatch',
    summary: 'Rust process and resource monitor with a live dashboard.',
  },
  {
    name: 'RocksDB key-value store',
    summary: 'C++ batch ingestion and key-value operations over a Reddit dataset.',
  },
  {
    name: 'Distributed graph processing',
    summary: 'Graph ranking and shortest-path experiments with Neo4j GDS.',
  },
  {
    name: 'Edge inference',
    summary: 'Hybrid face inference workflow using simulated edge hardware.',
  },
];

const diagramLayouts: DiagramLayout[] = [
  {
    nodes: [
      [18, 48],
      [116, 23],
      [220, 48],
    ],
    route: 'M18 91 H73 V66 H116 M180 66 H220 V91',
  },
  {
    nodes: [
      [20, 22],
      [20, 88],
      [125, 54],
      [228, 22],
      [228, 88],
    ],
    route: 'M48 37 H84 V69 H125 M48 103 H84 V69 M181 69 H203 V37 H228 M181 69 H203 V103 H228',
  },
  {
    nodes: [
      [20, 54],
      [112, 23],
      [112, 87],
      [220, 54],
    ],
    route: 'M48 69 H79 V40 H112 M79 69 V104 H112 M176 40 H198 V69 H220 M176 104 H198 V69',
  },
  {
    nodes: [
      [24, 51],
      [108, 51],
      [192, 51],
    ],
    route: 'M52 67 H108 M136 67 H192',
  },
  {
    nodes: [
      [18, 53],
      [76, 53],
      [134, 53],
      [192, 53],
      [250, 53],
    ],
    route: 'M46 69 H76 M104 69 H134 M162 69 H192 M220 69 H250',
  },
  {
    nodes: [
      [20, 20],
      [20, 88],
      [110, 54],
      [220, 20],
      [220, 88],
    ],
    route: 'M48 35 H78 V69 H110 M48 103 H78 V69 M166 69 H192 V35 H220 M166 69 H192 V103 H220',
  },
];

function ExhibitDiagram({ variant }: { variant: number }) {
  const layout = diagramLayouts[variant % diagramLayouts.length];

  return (
    <svg className="exhibit-diagram" viewBox="0 0 286 132" aria-hidden="true">
      <defs>
        <pattern id={`draft-grid-${variant}`} width="13" height="13" patternUnits="userSpaceOnUse">
          <path d="M 13 0 L 0 0 0 13" className="diagram-grid" />
        </pattern>
      </defs>
      <rect x="0.5" y="0.5" width="285" height="131" fill={`url(#draft-grid-${variant})`} />
      <path d={layout.route} className="diagram-route" />
      <path d={layout.route} className="diagram-route-accent" />
      {layout.nodes.map(([x, y], index) => (
        <g className="diagram-node" key={`${x}-${y}`} transform={`translate(${x}, ${y})`}>
          <rect width="48" height="35" />
          <path d="M7 10h18M7 16h31M7 23h21" />
          {index % 2 === 0 ? <circle cx="39" cy="10" r="3" className="diagram-dot" /> : null}
        </g>
      ))}
      <path d="M8 10h8M270 119h8M8 119h8M270 10h8" className="diagram-corner" />
      <text x="10" y="127" className="diagram-code">
        STUDY / 0{variant + 1}
      </text>
    </svg>
  );
}

function HeroIllustration() {
  return (
    <svg className="hero-illustration" viewBox="0 0 280 250" aria-hidden="true">
      <defs>
        <pattern
          id="hero-hatch"
          width="7"
          height="7"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 0v7" className="hero-hatch-line" />
        </pattern>
      </defs>
      <rect x="17" y="17" width="246" height="216" fill="url(#hero-hatch)" opacity="0.32" />
      <path d="M43 170h51V95h45m0 0v82h45m0-82h49" className="hero-wire" />
      <path d="M43 170h51V95h45m0 0v82h45m0-82h49" className="hero-wire-red" />
      <g className="hero-module">
        <rect x="26" y="151" width="35" height="38" />
        <path d="M33 160h20M33 167h13M33 175h18" />
      </g>
      <g className="hero-module hero-module-large">
        <rect x="115" y="68" width="54" height="54" />
        <circle cx="142" cy="89" r="10" />
        <path d="M126 107h32" />
      </g>
      <g className="hero-module">
        <rect x="115" y="158" width="54" height="39" />
        <path d="M123 168h37M123 176h24M123 185h31" />
      </g>
      <g className="hero-module">
        <rect x="220" y="76" width="35" height="38" />
        <path d="M227 85h20M227 92h13M227 100h18" />
      </g>
      <g className="hero-module">
        <rect x="220" y="151" width="35" height="38" />
        <path d="M227 160h20M227 167h13M227 175h18" />
      </g>
      <circle cx="96" cy="170" r="4" className="hero-signal" />
      <circle cx="214" cy="95" r="4" className="hero-signal" />
      <path
        d="M19 32h18M19 32v18M261 32h-18M261 32v18M19 218h18M19 218v-18M261 218h-18M261 218v-18"
        className="hero-corner"
      />
    </svg>
  );
}

function App() {
  return (
    <div className="paper-frame">
      <div className="page-shell">
        <header className="masthead" id="top">
          <div className="masthead-meta">
            <span>Independent engineering journal</span>
            <span>AI · systems · software</span>
            <span>Vol. 01 / 2026</span>
          </div>
          <a className="wordmark" href="#top" aria-label="Yash Bakshi, home">
            Yash Bakshi
          </a>
          <p className="journal-title">A Technical Journal of Systems Built and Problems Solved.</p>
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#about">About</a>
            <a href="#projects">Selected works</a>
            <a href="#lab-report">Lab report</a>
            <a href="#experience">Experience</a>
            <a href="#contact">Contact</a>
            <span className="nav-stamp">Issue 01</span>
          </nav>
        </header>

        <main>
          <section className="hero" id="about" aria-labelledby="hero-title">
            <div className="hero-heading">
              <p className="eyebrow">Field notes · AI application engineering</p>
              <h1 id="hero-title">
                AI becomes useful when engineering carries it beyond the demo.
              </h1>
              <p className="hero-deck">
                I’m a software engineer focused on AI applications, supported by experience in
                backend services, cloud delivery, and production systems.
              </p>
              <a className="text-link" href="#projects">
                Turn to selected works <span aria-hidden="true">↘</span>
              </a>
            </div>
            <figure className="hero-plate">
              <HeroIllustration />
              <figcaption>
                <span>Fig. 01</span> Systems are made of connections.
              </figcaption>
            </figure>
            <div className="hero-aside">
              <p className="aside-kicker">An engineer’s notebook</p>
              <p>
                My work crosses AI applications, backend services, cloud delivery, and systems
                engineering. I care about the practical decisions that make software dependable
                after the prototype.
              </p>
              <p className="aside-small">
                Currently collecting project records, implementation notes, and evidence.
              </p>
              <div className="guide-card">
                <span className="guide-orbit" aria-hidden="true">
                  YB
                </span>
                <div>
                  <span className="micro-label">Portfolio guide</span>
                  <strong>In the works</strong>
                </div>
                <span className="status-dot" aria-hidden="true" />
              </div>
            </div>
          </section>

          <section className="fact-strip" aria-label="Portfolio focus areas">
            <div>
              <strong>01</strong>
              <span>AI applications</span>
            </div>
            <div>
              <strong>02</strong>
              <span>Backend systems</span>
            </div>
            <div>
              <strong>03</strong>
              <span>Cloud delivery</span>
            </div>
            <div>
              <strong>04</strong>
              <span>Languages & tools</span>
            </div>
          </section>

          <section
            className="publication-section works-section"
            id="projects"
            aria-labelledby="works-title"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Selected projects</p>
                <h2 id="works-title">Selected Works</h2>
              </div>
              <p className="section-caption">
                Exhibits A01–A06 <span>·</span> Draft catalogue
              </p>
            </div>
            <p className="section-standfirst">
              A collection of experiments and systems at the intersection of intelligent software
              and production engineering.
            </p>

            <div className="exhibit-list">
              {projects.map((project, index) => (
                <article className="exhibit-card" key={project.name}>
                  <div className="exhibit-art-wrap">
                    <ExhibitDiagram variant={project.diagram} />
                    <span className="exhibit-art-caption">
                      Exhibit {String(index + 1).padStart(2, '0')} <span>— visual study</span>
                    </span>
                  </div>
                  <div className="exhibit-copy">
                    <div className="exhibit-meta">
                      <span>Exhibit {String(index + 1).padStart(2, '0')}</span>
                      <span>{project.category}</span>
                    </div>
                    <span className="case-stamp">
                      Case file
                      <br />
                      in preparation
                    </span>
                    <h3>{project.name}</h3>
                    <p>{project.summary}</p>
                    <ul className="tag-list" aria-label={`${project.name} technologies`}>
                      {project.stack.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="exhibit-footer">
                      <span>Project notes · source review pending</span>
                      <span aria-hidden="true">↗</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="disclaimer">
              Project abstracts are based on owner-provided résumé notes. Contributions, links, and
              technical details will be checked before full case files are published. The diagrams
              are editorial abstractions, not architecture evidence.
            </p>
          </section>

          <section className="support-grid" aria-label="Additional project areas">
            <article className="support-column">
              <p className="eyebrow">Beyond the exhibits</p>
              <h2>Systems & experiments</h2>
              <p className="support-intro">
                A broader notebook of tools, languages, and data work.
              </p>
              <ul className="support-list">
                {supportingWork.slice(0, 2).map(({ name, summary }) => (
                  <li key={name}>
                    <strong>{name}</strong>
                    <span>{summary}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="support-column">
              <p className="eyebrow">Also in the archive</p>
              <h2>Data & platforms</h2>
              <p className="support-intro">Smaller investigations and infrastructure studies.</p>
              <ul className="support-list">
                {supportingWork.slice(2).map(({ name, summary }) => (
                  <li key={name}>
                    <strong>{name}</strong>
                    <span>{summary}</span>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section
            className="publication-section lab-section"
            id="lab-report"
            aria-labelledby="lab-title"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Methods & instruments</p>
                <h2 id="lab-title">The Lab Report</h2>
              </div>
              <p className="section-caption">Tools shown with context, never scores</p>
            </div>
            <p className="section-standfirst">
              A working index of the methods and technologies that appear in the project and
              professional record.
            </p>
            <div className="lab-table-wrap">
              <table className="lab-table">
                <thead>
                  <tr>
                    <th scope="col">Discipline</th>
                    <th scope="col">Selected tools</th>
                    <th scope="col">Where they appear</th>
                  </tr>
                </thead>
                <tbody>
                  {skillGroups.map((skill) => (
                    <tr key={skill.group}>
                      <th scope="row">{skill.group}</th>
                      <td>{skill.tools}</td>
                      <td>{skill.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="table-note">
              This list is selective and will be refined as project evidence and source links are
              reviewed.
            </p>
          </section>

          <section
            className="publication-section experience-section"
            id="experience"
            aria-labelledby="experience-title"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Professional record</p>
                <h2 id="experience-title">The Case Log</h2>
              </div>
              <p className="section-caption">Selected roles · résumé-derived draft</p>
            </div>
            <p className="section-standfirst">
              Production work across software delivery, technical leadership, service platforms, and
              Linux systems.
            </p>
            <div className="role-grid">
              {roles.map((role, index) => (
                <article className="role-card" key={role.title + role.organization}>
                  <div className="role-topline">
                    <span>Record 0{index + 1}</span>
                    <span>{role.dates}</span>
                  </div>
                  <h3>{role.title}</h3>
                  <p className="role-org">{role.organization}</p>
                  <p className="role-note">{role.note}</p>
                </article>
              ))}
            </div>
            <p className="disclaimer">
              Role dates and descriptions are transcribed from the supplied résumé summary and
              should be confirmed before launch.
            </p>
          </section>

          <section
            className="publication-section contact-section"
            id="contact"
            aria-labelledby="contact-title"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Correspondence</p>
                <h2 id="contact-title">Letters & Collaborations</h2>
              </div>
              <p className="section-caption">A place to begin a conversation</p>
            </div>
            <div className="contact-layout">
              <div className="contact-note">
                <p className="contact-lead">Have a problem worth working through?</p>
                <p>
                  I’m interested in thoughtful conversations about AI applications, backend systems,
                  and the work that brings them into use.
                </p>
                <p className="contact-pending">Public contact links are being prepared.</p>
              </div>
              <aside className="correspondence-card">
                <p className="eyebrow">Contact desk</p>
                <h3>Letters welcome.</h3>
                <p>
                  Email, LinkedIn, GitHub, and scheduling links will be added when their public
                  destinations are confirmed.
                </p>
                <span className="desk-rule" />
                <span className="micro-label">Yash Bakshi · Engineering journal</span>
              </aside>
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <div className="footer-name">
            <strong>Yash Bakshi</strong>
            <span>A technical journal of systems built and problems solved.</span>
          </div>
          <div className="footer-col">
            <span className="micro-label">On these pages</span>
            <a href="#projects">Selected works</a>
            <a href="#lab-report">The lab report</a>
            <a href="#experience">The case log</a>
          </div>
          <div className="footer-col">
            <span className="micro-label">This edition</span>
            <span>Vol. 01 · 2026</span>
            <a href="#top">Back to masthead ↑</a>
          </div>
          <div className="footer-bottom">
            <span>Built as a work in progress.</span>
            <span>© 2026 Yash Bakshi</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
