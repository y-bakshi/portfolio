export type Project = {
  id: string;
  name: string;
  line: string;
  detail: string;
  role: string;
  stack: string[];
  /** Pipeline stages in order. `depth` indents a stage under the one before it. */
  trace: { label: string; depth: number }[];
  topics: string[];
};

export const projects: Project[] = [
  {
    id: 'testpilot',
    name: 'TestPilot',
    line: 'Writes tests, then argues with them.',
    detail:
      'Generates tests and predicts defects. It retrieves your coding standards first, drafts the tests against them, and an LLM critique loop decides which ones survive.',
    role: 'Built every non-frontend part of a four-person team project.',
    stack: [
      'FastAPI',
      'Qwen via Ollama',
      'RAG',
      'pgvector',
      'Random Forest',
      'Docker',
      'Cloud Run',
    ],
    trace: [
      { label: 'Read repository', depth: 0 },
      { label: 'Retrieve coding standards', depth: 1 },
      { label: 'Draft tests', depth: 2 },
      { label: 'Critique gate', depth: 3 },
      { label: 'Keep or redraft', depth: 4 },
    ],
    topics: [
      'rag',
      'retrieval',
      'testing',
      'tests',
      'vector',
      'pgvector',
      'llm',
      'defect',
      'ollama',
    ],
  },
  {
    id: 'guardianai',
    name: 'GuardianAI',
    line: 'Two ways to answer a safety question.',
    detail:
      'A neighborhood safety assistant. Questions about known incidents take a cheap path through database summaries. Open-ended ones go to a ReAct agent that can look things up.',
    role: 'Contributed within a four-person team.',
    stack: ['Next.js', 'TypeScript', 'FastAPI', 'Claude', 'PostgreSQL', 'Mapbox', 'WebSockets'],
    trace: [
      { label: 'Incident map and feeds', depth: 0 },
      { label: 'Route the question', depth: 1 },
      { label: 'Summary path', depth: 2 },
      { label: 'ReAct path', depth: 2 },
      { label: 'Safety response', depth: 3 },
    ],
    topics: ['agent', 'react', 'claude', 'safety', 'maps', 'geospatial', 'websocket', 'frontend'],
  },
  {
    id: 'citywatch',
    name: 'CityWatch',
    line: 'Turns noisy public signals into alerts for the right department.',
    detail:
      'A multimodal pipeline on AWS. Social posts come in through a stream, vision and language models classify them, and the result is routed to the department that should see it.',
    role: 'Team project. Contribution details to be confirmed.',
    stack: ['Kinesis', 'Lambda', 'Rekognition', 'Bedrock', 'EventBridge'],
    trace: [
      { label: 'Social signals', depth: 0 },
      { label: 'Kinesis and Lambda', depth: 1 },
      { label: 'Vision and LLM classification', depth: 2 },
      { label: 'Department alerts', depth: 3 },
    ],
    topics: ['aws', 'cloud', 'serverless', 'multimodal', 'bedrock', 'lambda', 'alerts'],
  },
  {
    id: 'face-recognition',
    name: 'Serverless face recognition',
    line: 'Detection and recognition as separate stages with a queue between them.',
    detail:
      'Detection and recognition run as independent inference stages on Lambda, joined by an SQS queue, packaged as containers.',
    role: 'Course project.',
    stack: ['PyTorch', 'MTCNN', 'FaceNet', 'Lambda', 'SQS', 'ECR', 'Docker'],
    trace: [
      { label: 'Detect faces', depth: 0 },
      { label: 'SQS queue', depth: 1 },
      { label: 'Recognize', depth: 2 },
    ],
    topics: ['aws', 'cloud', 'serverless', 'vision', 'pytorch', 'queue', 'sqs', 'docker'],
  },
  {
    id: 'catscript',
    name: 'CatScript',
    line: 'A small programming language, lexer to interpreter.',
    detail:
      'A C++17 implementation with a lexer and parser, an AST, a type checker with scoping, and a tree-walking interpreter.',
    role: 'Led a four-person team.',
    stack: ['C++17', 'Flex', 'Bison', 'Make'],
    trace: [
      { label: 'Source text', depth: 0 },
      { label: 'Lexer and parser', depth: 1 },
      { label: 'AST', depth: 2 },
      { label: 'Type check', depth: 3 },
      { label: 'Interpret', depth: 4 },
    ],
    topics: ['compiler', 'language', 'parser', 'c++', 'cpp', 'interpreter', 'systems', 'lead'],
  },
  {
    id: 'streaming-pipeline',
    name: 'Streaming data pipeline',
    line: 'NYC taxi events flowing into a graph database.',
    detail:
      'A producer and consumer on Kafka write taxi trip events into Neo4j, coordinated on Kubernetes.',
    role: 'Course project.',
    stack: ['Kafka', 'Zookeeper', 'Neo4j', 'Kubernetes', 'Docker'],
    trace: [
      { label: 'Taxi events', depth: 0 },
      { label: 'Kafka consumer', depth: 1 },
      { label: 'Neo4j graph', depth: 2 },
    ],
    topics: ['streaming', 'kafka', 'graph', 'neo4j', 'kubernetes', 'data'],
  },
];

export const roles = [
  {
    id: 'thryv',
    title: 'Software engineering intern',
    org: 'Thryv',
    when: 'May to Aug 2026',
    note: 'Java and Micronaut service releases, gated CircleCI promotion, hermetic performance tests, API compatibility and schema checks, production-readiness docs.',
  },
  {
    id: 'insight',
    title: 'Technical team lead',
    org: 'InfoCenter, an Insight Company',
    when: 'Jun to Dec 2024',
    note: 'Led ServiceNow delivery: mentoring, code review, testing and stakeholder coordination.',
  },
  {
    id: 'tcs-dev',
    title: 'ServiceNow developer',
    org: 'Tata Consultancy Services',
    when: 'Sep 2022 to May 2024',
    note: 'Python and LLDP discovery, CMDB automation, portals, monitoring integrations, runbooks.',
  },
  {
    id: 'tcs-ase',
    title: 'Assistant systems engineer',
    org: 'Tata Consultancy Services',
    when: 'Nov 2021 to Sep 2022',
    note: 'RHEL, Docker, HPC and LSF operations, monitoring, deployment validation.',
  },
];

export const stackGroups = [
  {
    group: 'AI applications',
    items: 'Python, FastAPI, RAG, ReAct, retrieval evaluation, model serving',
  },
  { group: 'Data and services', items: 'PostgreSQL, pgvector, REST, WebSockets, Kafka, Kinesis' },
  { group: 'Cloud and delivery', items: 'AWS, GCP, Docker, Kubernetes, CI/CD, Linux' },
  { group: 'Languages', items: 'Python, Java, C++, Rust, plus ServiceNow and RHEL at work' },
];

export type Answer = { text: string; cites: string[] };

export const suggestions = [
  'What has Yash built with RAG?',
  'Show me his backend experience',
  'Has he worked with agents?',
  'What cloud work has he done?',
];

const find = (ids: string[]) =>
  ids.filter((id) => projects.some((p) => p.id === id) || roles.some((r) => r.id === id));

/** Answers are written from the owner-provided notes only. Anything else gets an honest miss. */
export function answerFor(question: string): Answer {
  const q = question.toLowerCase();
  const has = (...words: string[]) => words.some((w) => q.includes(w));

  if (has('rag', 'retriev', 'vector', 'embedding'))
    return {
      text: 'TestPilot is the RAG project. It retrieves a team’s coding standards before drafting tests, stores them in pgvector, and runs a critique loop over the output. Yash built all of its non-frontend parts.',
      cites: find(['testpilot']),
    };
  if (has('agent', 'react', 'tool use', 'tool-use'))
    return {
      text: 'GuardianAI has a ReAct path for open-ended questions, next to a cheaper database-summary path for known incidents. It was a four-person team project.',
      cites: find(['guardianai']),
    };
  if (has('backend', 'service', 'api', 'java', 'micronaut', 'ci', 'production'))
    return {
      text: 'Most recently at Thryv: Java and Micronaut service releases, gated CircleCI promotion, hermetic performance tests and API compatibility checks. TestPilot’s FastAPI backend is the project-side example.',
      cites: find(['thryv', 'testpilot']),
    };
  if (has('cloud', 'aws', 'gcp', 'serverless', 'lambda'))
    return {
      text: 'CityWatch and the face recognition pipeline are both AWS: Kinesis, Lambda, Bedrock and SQS. TestPilot deploys to Cloud Run on GCP.',
      cites: find(['citywatch', 'face-recognition', 'testpilot']),
    };
  if (has('compiler', 'language', 'parser', 'c++', 'systems'))
    return {
      text: 'CatScript is a language implementation in C++17, from lexer to tree-walking interpreter. Yash led the four-person team.',
      cites: find(['catscript']),
    };
  if (has('stream', 'kafka', 'graph', 'data'))
    return {
      text: 'The streaming pipeline moves NYC taxi events through Kafka into Neo4j on Kubernetes.',
      cites: find(['streaming-pipeline']),
    };
  if (has('experience', 'work', 'job', 'role', 'lead', 'career'))
    return {
      text: 'Four roles, newest first: engineering intern at Thryv, technical team lead at InfoCenter, ServiceNow developer and systems engineer at Tata Consultancy Services.',
      cites: find(['thryv', 'insight']),
    };
  if (has('contact', 'hire', 'email', 'reach', 'talk'))
    return {
      text: 'The contact links are still placeholders on this draft. They are at the bottom of the page.',
      cites: ['contact'],
    };
  return {
    text: 'That is not in the notes this page draws on yet. Try one of the questions above, or browse the projects below.',
    cites: [],
  };
}
