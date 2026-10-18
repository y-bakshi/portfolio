import type { Fact } from './facts';

/**
 * Longer notes the guide can draw on for follow-up questions. Written at a general level: no ticket
 * numbers, hostnames, reviewer names or pay. Yash approved this list; add to it only with his say-so.
 */
export const notes: Fact[] = [
  {
    id: 'note:thryv-scope',
    sourceId: 'thryv',
    title: 'Thryv: scope',
    text: 'Yash was a software engineering intern at Thryv from May to August 2026, working on Java and Micronaut backend services. The main assignment was to let services release independently instead of together on a shared, schedule-based release train, with quality gates in each service’s own pipeline. This note and the ones that follow stay at the level of his résumé and do not describe Thryv’s internal systems.',
  },
  {
    id: 'note:thryv-independent-releases',
    sourceId: 'thryv',
    title: 'Thryv: independent releases',
    text: 'Yash decoupled five Java services so each could release on its own, using approval gates in CircleCI. A service builds once and the same artifact moves through each environment, and promotion needs an approval, so release authority is enforced by the pipeline rather than by convention.',
  },
  {
    id: 'note:thryv-api-and-performance-gates',
    sourceId: 'thryv',
    title: 'Thryv: API and performance gates',
    text: 'Yash gated more than 100 API operations with OpenAPI checks plus JMH and k6 performance checks, closing a gap where compatibility and performance were not tested before release. He calibrated limits against measured baselines, and where he did not yet trust the baseline data a gate started in report-only mode so noisy results would not teach people to ignore it.',
  },
  {
    id: 'note:thryv-offline-schema-validation',
    sourceId: 'thryv',
    title: 'Thryv: offline schema validation',
    text: 'Yash validated Pub/Sub message payloads offline against Avro schemas managed in Terraform. That removed live service calls from the tests and the need for a new credential. His lesson from it: sometimes the fix for needing a permission is to not need it.',
  },
  {
    id: 'note:thryv-slos-and-release-playbooks',
    sourceId: 'thryv',
    title: 'Thryv: SLOs and release playbooks',
    text: 'Yash defined service level objectives and dependency-based release playbooks for four services, which set out what a service needs before it is considered ready for production.',
  },
  {
    id: 'note:thryv-how-he-works',
    sourceId: 'thryv',
    title: 'Thryv: how he works',
    text: 'Three habits Yash took from the internship: verify behaviour instead of assuming it, make tests self-contained before gating a build on them, and introduce a strict gate gradually so it earns trust.',
  },
  {
    id: 'note:thryv-technologies-used',
    sourceId: 'thryv',
    title: 'Thryv: technologies used',
    text: 'At Thryv Yash worked with Java, Micronaut, Gradle, JUnit 5, JMH, k6, OpenAPI, Google Cloud Pub/Sub, Apache Avro, Terraform and CircleCI.',
  },
  {
    id: 'note:infocenter-team-lead-role',
    sourceId: 'insight',
    title: 'InfoCenter: team lead role',
    text: 'At InfoCenter, an Insight Company, Yash led an eight-person ServiceNow delivery team across five concurrent client projects and mentored 12 developers in total, including four from other teams. He provided hands-on help when people were blocked and personally owned a separate client engagement end to end, covering ITSM workflows, CMDB and Discovery configuration, HRSD features, integrations, support and release management. Dates on the site are June to December 2024.',
  },
  {
    id: 'note:infocenter-quality-controls-and-coaching-effect',
    sourceId: 'insight',
    title: 'InfoCenter: quality controls and coaching effect',
    text: 'Yash set up peer review, implementation checklists, unit and regression testing, ServiceNow update-set validation and approval gates, and reports zero critical post-deployment defects across the five projects. His structured coaching and knowledge sharing reduced escalations by 30 percent, tracked through defect records and manager reporting. The escalations counted include technical blockers raised to senior engineers, client complaints, production incidents and delivery slips.',
  },
  {
    id: 'note:tcs-servicenow-developer-discovery-across-restricted-dmzs',
    sourceId: 'tcs-dev',
    title: 'TCS ServiceNow developer: discovery across restricted DMZs',
    text: "Yash wrote a Python discovery tool for about 20 closed DMZ zones where ITOM Discovery could not reach. Starting from expected Cisco and other vendor device lists, it used command-line access and LLDP neighbour data from switches and routers to find connected devices. Each zone's data was collected on its own private server, and scheduled API jobs refreshed the ServiceNow CMDB every one to two hours, rotating across zones round-robin on separate threads so one zone could not block the others.",
  },
  {
    id: 'note:tcs-servicenow-developer-portals-integrations-and-runbooks',
    sourceId: 'tcs-dev',
    title: 'TCS ServiceNow developer: portals, integrations and runbooks',
    text: 'Yash built or customised more than 100 Angular-based ServiceNow portals and request forms that prefilled and limited choices to the locations and devices each requester could access. Integrations included Azure IoT Hub device credentials feeding ITOM Discovery, a bidirectional ServiceNow and SolarWinds incident sync, and Amazon CloudWatch alerts that created or updated incidents (but did not discover AWS resources). His runbooks cut onboarding for new developers and support engineers from two weeks to five days.',
  },
  {
    id: 'note:tcs-assistant-systems-engineer-scope-as-an-early-career-engi',
    sourceId: 'tcs-ase',
    title: 'TCS assistant systems engineer: scope as an early-career engineer',
    text: 'In his first role Yash supported RHEL, Docker and HPC operations around IBM Spectrum LSF job scheduling. He monitored CPU, memory, disk, node availability, queue and container health with Red Hat Satellite, Grafana, Prometheus and custom scripts, and the 99.9 percent uptime comes from formal SLA reports. He ran established deployment scripts, validated containers, checked logs and triaged emergency tickets under senior-engineer guidance; he did not own CI/CD, and a 25 percent deployment-time claim was withdrawn.',
  },
  {
    id: 'note:asu-coursework-that-maps-to-projects',
    sourceId: 'asu',
    title: 'ASU: coursework that maps to projects',
    text: 'Several ASU courses produced projects on the site. SER 502 gave CatScript and a Prolog semantic evaluator; CSE 546 gave the serverless face recognition and edge inference work on AWS; CSE 511 gave the Kafka to Neo4j pipeline, a Neo4j graph analysis and a RocksDB key-value store (the RocksDB assignment scored 100/100, the graph assignment 60/60); SER 594 produced TestPilot; SER 541 produced the supply-chain traceability proposal and a signal-processing assignment. Course terms are not listed in the sources.',
  },
  {
    id: 'note:manipal-nothing-beyond-the-site',
    sourceId: 'manipal',
    title: 'Manipal: nothing beyond the site',
    text: "The sources add nothing to the site's entry for the Bachelor of Information Technology at Manipal University Jaipur (August 2017 to August 2021) beyond its coursework: data structures and algorithms, web technology, data science and programming. No project, grade or thesis material was found.",
  },
  {
    id: 'note:testpilot-deployment-path-and-why-it-changed',
    sourceId: 'testpilot',
    title: 'TestPilot: deployment path and why it changed',
    text: "TestPilot's final deployment is a React frontend on Vercel, a managed Postgres with pgvector and JWT auth, and a FastAPI plus Ollama backend in one container on Google Cloud Run with an NVIDIA L4 GPU. The April 2026 plan had named Modal as the primary compute option and Cloud Run as backup; the repository's commit on 11 April 2026 switched the backend to Cloud Run. The Cloud Run service can be kept warm with a minimum-instance setting to avoid cold starts before a demo.",
  },
  {
    id: 'note:guardianai-how-the-two-lane-chat-works-team-design',
    sourceId: 'guardianai',
    title: 'GuardianAI: how the two-lane chat and its ReAct agent work (team design)',
    text: "The team's chat module routes each question with a rule-based Python classifier that makes no model call. Location questions take a fast lane that geocodes, queries the incident database and has Claude summarise in one streaming call, in about 1 to 2 seconds. People and group questions take a ReAct agent lane in which Claude, acting as an agent, calls tools in a loop capped at five iterations, in about 3 to 4 seconds. Incident cards are built server-side from database rows so the model cannot invent incidents.",
  },
  {
    id: 'note:cv-studio-compile-pipeline-and-security-choices',
    sourceId: 'cv-studio',
    title: 'CV Studio: compile pipeline and security choices',
    text: 'CV Studio serialises a structured résumé into an approved LaTeX template, then compiles it asynchronously on the server: it snapshots the revision, writes TeX into an isolated temporary directory, runs pdflatex twice with shell escape disabled and a timeout, stores the log and PDF, and serves the PDF through an authenticated endpoint. Other safeguards are salted scrypt password hashing, HTTP-only same-site cookies, per-user query scoping and type- and size-limited uploads. Compilation does not yet run in a locked-down container.',
  },
  {
    id: 'note:cv-studio-deliberately-separating-ai-from-the-write-path',
    sourceId: 'cv-studio',
    title: 'CV Studio: deliberately separating AI from the write path',
    text: 'The README states that AI is kept out of the document write path: a future provider adapter for Ollama or hosted models would return reviewable change proposals, and the user would approve a structured diff before anything changes a CV. No model output writes directly to a document. The AI layer is not implemented yet; the code carries TODO markers for it, for a Redis-backed compile worker, Alembic migrations and SSRF-safe job-link ingestion.',
  },
  {
    id: 'note:cv-studio-engineering-facts',
    sourceId: 'cv-studio',
    title: 'CV Studio: engineering facts',
    text: 'The repository has six commits, all on 21 September 2026 by Yash, and a CI workflow. The API is layered into routers, services, schemas, serializers and models; tests cover registration and sessions, user data isolation, CV editing, optimistic-concurrency conflicts, revisions, annotations and job-description persistence. The default database is SQLite, with PostgreSQL via Docker Compose. The web client uses React, Vite, Tiptap, shadcn/ui and Tailwind v4. No open-source licence has been chosen.',
  },
  {
    id: 'note:catscript-yash-s-documented-contribution',
    sourceId: 'catscript',
    title: "CatScript: Yash's documented contribution",
    text: 'The team contribution log credits Yash with the language grammar and its PDF in EBNF, operator precedence, the AST and type hierarchy, and then the runtime value system with five types, arithmetic, comparison and logical operators with short-circuit evaluation, array operations, and the Environment class with nested scopes. About 18 hours were logged for each of milestones 2 and 3. He also wrote an RAII scope helper that fixed variables leaking out of nested blocks. The log does not name a team lead.',
  },
  {
    id: 'note:catscript-how-the-pipeline-is-structured',
    sourceId: 'catscript',
    title: 'CatScript: how the pipeline is structured',
    text: 'CatScript runs in three phases: Flex tokenises, Bison parses into an AST with a symbol table and type checker, and a visitor-based interpreter executes it. The language has int, float, bool, string and array types, if-else used as an expression, blocks that return values, ternary, while, C-style and for-in loops, and short-circuit logic. Functions, enums, match expressions and array indexing are specified in the grammar but not implemented; the README lists them as known limitations.',
  },
  {
    id: 'note:serverless-face-recognition-pipeline-design-and-tuning',
    sourceId: 'face-recognition',
    title: 'Serverless face recognition: pipeline design and tuning',
    text: "A detection Lambda behind a function URL receives base64 frames, runs MTCNN, and sends detected faces to an SQS request queue; a recognition Lambda triggered by that queue runs FaceNet's InceptionResnetV1 and writes results to a response queue. Tuning notes record: response-queue visibility timeout reduced to zero (the key fix for 100 concurrent polling clients), batch size 1, long polling, memory at the 3,000 MB account limit, and pre-warmed instances. A Dockerfile bug where an ARG defined before FROM sent model weights to the wrong path was also found and fixed.",
  },
  {
    id: 'note:edge-inference-architecture',
    sourceId: 'edge-inference',
    title: 'Edge inference: architecture',
    text: 'The edge project places a Greengrass core device (one EC2 instance simulating edge hardware) that subscribes over MQTT to frames published by a client device, runs MTCNN face detection locally, and sends only detected faces to an SQS request queue. A cloud Lambda runs FaceNet recognition and writes to a response queue. A bonus path answers frames with no face entirely at the edge. Setup, deployment and verification are scripted for the core and client devices.',
  },
  {
    id: 'note:streaming-pipeline-how-the-connector-works',
    sourceId: 'streaming-pipeline',
    title: 'Streaming pipeline: how the connector works',
    text: 'A Python producer reads the March 2022 NYC yellow-taxi parquet file and publishes records to a Kafka topic; a custom consumer (not Kafka Connect) writes each trip into Neo4j using Bolt, merging pickup and dropoff Location nodes and creating a Trip node linked by PICKUP_AT and DROPOFF_AT relationships. Zookeeper, Kafka and Neo4j run on Kubernetes (Minikube for local work), with Neo4j installed from a Helm chart. A guide in the folder explains each manifest.',
  },
  {
    id: 'note:rocksdb-key-value-store-small-project',
    sourceId: 'general',
    title: 'RocksDB key-value store (small project)',
    text: 'The CSE 511 NoSQL assignment loads about 50,000 Reddit subreddit rows (a 255 MB CSV with 15 columns) into RocksDB 7.10.2 as roughly 750,000 key-value pairs keyed by row id and column name. It implements bulk load with WriteBatch, MultiGet, a range scan filtered to display-name keys, and delete. The notes report 100 of 100 on the automated tester, with a load time of about 30 seconds. Getting RocksDB 7.10.2 to build under GCC 13 needed two header edits.',
  },
  {
    id: 'note:general-how-the-owner-frames-his-profile',
    sourceId: 'general',
    title: 'General: how the owner frames his profile',
    text: "The owner's portfolio brief positions Yash as a software engineer and former technical team lead with experience in production backend services, AI applications, enterprise platforms, cloud delivery and Linux infrastructure. It says to lead with AI application engineering and support it with backend reliability and delivery work, and warns that project metrics and award claims are owner-provided and unaudited. It also says not to promote the CV project's future plans to completed experience.",
  },
];
