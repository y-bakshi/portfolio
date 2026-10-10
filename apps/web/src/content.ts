export type Project = {
  id: string;
  name: string;
  line: string;
  detail: string;
  role: string;
  stack: string[];
  /** Pipeline stages in order. `depth` indents a stage under the one before it. */
  trace: { label: string; depth: number }[];
};

export const projects: Project[] = [
  {
    id: 'testpilot',
    name: 'TestPilot',
    line: 'Writes tests, then argues with them.',
    detail:
      'Generates pytest, Jest and JUnit tests and ranks defect-prone files in public GitHub repositories. It retrieves the five most relevant coding-standard chunks first, drafts the tests against them, and an LLM critique loop regenerates anything scoring below 0.6.',
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
  },
  {
    id: 'guardianai',
    name: 'GuardianAI',
    line: 'Two ways to answer a safety question.',
    detail:
      'A neighborhood safety assistant. Location questions take a 1 to 2 second path through database summaries. Open-ended ones go to a 3 to 4 second ReAct path, so the expensive agent runs only when it is needed.',
    role: 'Contributed within a four-person team.',
    stack: ['Next.js', 'TypeScript', 'FastAPI', 'Claude', 'PostgreSQL', 'Mapbox', 'WebSockets'],
    trace: [
      { label: 'Incident map and feeds', depth: 0 },
      { label: 'Route the question', depth: 1 },
      { label: 'Summary path', depth: 2 },
      { label: 'ReAct path', depth: 2 },
      { label: 'Safety response', depth: 3 },
    ],
  },
  {
    id: 'citywatch',
    name: 'CityWatch',
    line: 'Turns noisy public signals into alerts for the right department.',
    detail:
      'A serverless pipeline on AWS that turns social-media signals into department alerts within 15 seconds. Kinesis ingests, Lambda and Rekognition analyse, Bedrock classifies, and EventBridge routes each alert. Won the AWS Ideathon 2026.',
    role: 'Designed the pipeline and its scaling model. Won the AWS Ideathon 2026.',
    stack: ['Kinesis', 'Lambda', 'Rekognition', 'Bedrock', 'EventBridge'],
    trace: [
      { label: 'Social signals', depth: 0 },
      { label: 'Kinesis and Lambda', depth: 1 },
      { label: 'Vision and LLM classification', depth: 2 },
      { label: 'Department alerts', depth: 3 },
    ],
  },
  {
    id: 'face-recognition',
    name: 'Serverless face recognition',
    line: 'Detection and recognition as separate stages with a queue between them.',
    detail:
      'MTCNN detection and FaceNet recognition run as separate Lambda functions joined by SQS. Under 100 concurrent requests it reached 99% accuracy at 3.75 seconds average latency, after shrinking a 10 GB container to fit Lambda.',
    role: 'Course project.',
    stack: ['PyTorch', 'MTCNN', 'FaceNet', 'Lambda', 'SQS', 'ECR', 'Docker'],
    trace: [
      { label: 'Detect faces', depth: 0 },
      { label: 'SQS queue', depth: 1 },
      { label: 'Recognize', depth: 2 },
    ],
  },
  {
    id: 'catscript',
    name: 'CatScript',
    line: 'A small programming language, lexer to interpreter.',
    detail:
      'A C++17 language with a lexer, a 400-line grammar, 20+ AST node types, a type checker and a tree-walking interpreter. It passes all 12 end-to-end test programs.',
    role: 'Led a four-person team.',
    stack: ['C++17', 'Flex', 'Bison', 'Make'],
    trace: [
      { label: 'Source text', depth: 0 },
      { label: 'Lexer and parser', depth: 1 },
      { label: 'AST', depth: 2 },
      { label: 'Type check', depth: 3 },
      { label: 'Interpret', depth: 4 },
    ],
  },
  {
    id: 'streaming-pipeline',
    name: 'Streaming data pipeline',
    line: 'NYC taxi events flowing into a graph database.',
    detail:
      'A producer and a custom consumer move NYC taxi records through Kafka into Neo4j as nodes and relationships, with Zookeeper and Kubernetes coordinating the pieces.',
    role: 'Course project.',
    stack: ['Kafka', 'Zookeeper', 'Neo4j', 'Kubernetes', 'Docker'],
    trace: [
      { label: 'Taxi events', depth: 0 },
      { label: 'Kafka consumer', depth: 1 },
      { label: 'Neo4j graph', depth: 2 },
    ],
  },
  {
    id: 'edge-inference',
    name: 'Edge inference',
    line: 'Only faces cross the network.',
    detail:
      'Face detection runs on an AWS IoT Greengrass edge device. Only the detected faces travel to cloud recognition over MQTT and SQS, so empty frames never leave the device. An EC2 instance stood in for the edge hardware.',
    role: 'Course project.',
    stack: ['Python', 'IoT Greengrass', 'MQTT', 'SQS', 'Lambda', 'EC2'],
    trace: [
      { label: 'Camera frame', depth: 0 },
      { label: 'Detect on the edge device', depth: 1 },
      { label: 'MQTT and SQS', depth: 2 },
      { label: 'Cloud recognition', depth: 3 },
    ],
  },
  {
    id: 'procwatch',
    name: 'ProcWatch',
    line: 'A process monitor that streams to a browser.',
    detail:
      'A modular Rust tool that reads process and system metrics with sysinfo, takes commands through clap, and streams CPU and memory updates to a live web dashboard over WebSockets.',
    role: 'Contribution details to be confirmed.',
    stack: ['Rust', 'sysinfo', 'clap', 'WebSockets'],
    trace: [
      { label: 'Collect metrics', depth: 0 },
      { label: 'Filter', depth: 1 },
      { label: 'WebSocket stream', depth: 2 },
      { label: 'Live dashboard', depth: 3 },
    ],
  },
  {
    id: 'story-generator',
    name: 'Gemini story generator',
    line: 'Stories and pictures for children.',
    detail:
      'A React and Vite interface and a FastAPI service collect a child\u2019s age, theme and characters, then prompt Gemini for a story and matching images, for ages 4 to 12.',
    role: 'Contribution details to be confirmed.',
    stack: ['React', 'Vite', 'FastAPI', 'Python', 'Gemini API'],
    trace: [
      { label: 'Story preferences', depth: 0 },
      { label: 'Build the prompt', depth: 1 },
      { label: 'Gemini', depth: 2 },
      { label: 'Story and images', depth: 3 },
    ],
  },
];

/** Shorter write-ups for coursework and experiments. They share one card. */
export const smallProjects = [
  {
    name: 'RocksDB key-value store',
    line: 'C++17 operations over a 255 MB Reddit dataset of 750,000+ pairs: bulk load with WriteBatch, point lookups, range scans and deletes.',
  },
  {
    name: 'Distributed graph engine',
    line: 'PageRank and shortest-path analysis on NYC taxi data in a containerised Neo4j with the Graph Data Science plugin.',
  },
  {
    name: 'Prolog semantic evaluator',
    line: 'A definite clause grammar parser and evaluator in SWI-Prolog, checked against eight test programs.',
  },
  {
    name: 'Supply chain traceability study',
    line: 'Regression analysis of how record completeness relates to inspection and logistics outcomes, using real data from a cashew processor.',
  },
];

export const roles = [
  {
    id: 'thryv',
    title: 'Software engineering intern',
    org: 'Thryv',
    when: 'May to Aug 2026',
    note: 'Independent deployment for five Java and Micronaut services, gated CircleCI promotion, hermetic JMH and K6 tests, OpenAPI compatibility checks across 100+ operations, 40 pull requests.',
  },
  {
    id: 'insight',
    title: 'Technical team lead',
    org: 'InfoCenter, an Insight Company',
    when: 'Jun to Dec 2024',
    note: 'Led eight people across five ServiceNow projects and mentored 12 developers. Zero critical post-deployment defects. Best Team Award among 30+ teams.',
  },
  {
    id: 'tcs-dev',
    title: 'ServiceNow developer',
    org: 'Tata Consultancy Services',
    when: 'Sep 2022 to May 2024',
    note: 'Python and LLDP discovery that kept a CMDB of 10,000+ devices current, 100+ portals and forms, monitoring integrations, runbooks that cut onboarding from two weeks to five days.',
  },
  {
    id: 'tcs-ase',
    title: 'Assistant systems engineer',
    org: 'Tata Consultancy Services',
    when: 'Nov 2021 to Sep 2022',
    note: 'RHEL, Docker and HPC operations with IBM Spectrum LSF, monitoring, and 99.9% documented uptime.',
  },
];

export const education = [
  {
    id: 'asu',
    title: 'MS, Computer Software Engineering',
    org: 'Arizona State University',
    when: 'Jan 2025 to Dec 2026',
    note: 'GPA 3.85. Statistical machine learning, AI for software engineers, data processing at scale, cloud computing, software project management.',
  },
  {
    id: 'manipal',
    title: 'Bachelor of Information Technology',
    org: 'Manipal University Jaipur',
    when: 'Aug 2017 to Aug 2021',
    note: 'Data structures and algorithms, databases, computer networks, object-oriented programming. ServiceNow Certified System Administrator and ServiceNow Discovery certifications.',
  },
];

export const stackGroups = [
  {
    group: 'AI applications',
    items:
      'LLM and ReAct orchestration, RAG, prompt engineering, embeddings, pgvector, Ollama, Claude, Gemini API, AWS Bedrock, PyTorch, scikit-learn',
  },
  {
    group: 'Backend and web',
    items:
      'Java, Micronaut, Python, FastAPI, Node.js, REST and OpenAPI, WebSockets, React, Next.js, TypeScript, Tailwind CSS',
  },
  {
    group: 'Cloud and delivery',
    items:
      'AWS (Lambda, SQS, Kinesis, Bedrock), GCP (Cloud Run, Pub/Sub), Docker, Kubernetes, Terraform, CircleCI',
  },
  { group: 'Data', items: 'PostgreSQL, MongoDB, Neo4j, RocksDB, Kafka, Pandas, NumPy' },
  {
    group: 'Systems and testing',
    items: 'Linux and RHEL, Bash, C++17, Rust, JUnit 5, JMH, K6, Prometheus, Grafana',
  },
  {
    group: 'Platforms and leadership',
    items: 'ServiceNow (ITSM, ITOM, CMDB), technical leadership, mentoring, code review, Agile',
  },
];

export type Answer = { text: string; cites: string[] };

export const suggestions = [
  'What has Yash built with RAG?',
  'Show me his backend experience',
  'Has he worked with agents?',
  'What cloud work has he done?',
];

const find = (ids: string[]) =>
  ids.filter(
    (id) =>
      projects.some((p) => p.id === id) ||
      roles.some((r) => r.id === id) ||
      education.some((e) => e.id === id) ||
      id === 'tools',
  );

/** Answers are written from the owner-provided notes only. Anything else gets an honest miss. */
export function answerFor(question: string): Answer {
  const q = question.toLowerCase();
  // A keyword matches at the start of a word ("retriev" finds "retrieval"); short ones must be whole
  // words, so "ci" does not match inside "specific" and "story" does not match inside "history".
  const has = (...words: string[]) =>
    words.some((w) => {
      const body = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const end = w.length <= 3 && /\w$/.test(w) ? '\\b' : '';
      return new RegExp(`\\b${body}${end}`).test(q);
    });

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
  if (has('edge', 'iot', 'greengrass', 'mqtt', 'hybrid'))
    return {
      text: 'The edge inference project runs face detection on an AWS IoT Greengrass device and sends only detected faces to cloud recognition over MQTT and SQS. It pairs with the serverless face recognition pipeline.',
      cites: find(['edge-inference', 'face-recognition']),
    };
  if (has('rust', 'process', 'monitor', 'dashboard'))
    return {
      text: 'ProcWatch is a Rust process monitor. It reads metrics with sysinfo and streams CPU and memory updates to a live web dashboard over WebSockets.',
      cites: find(['procwatch']),
    };
  if (has('gemini', 'story', 'stories', 'children', 'multimodal'))
    return {
      text: 'The Gemini story generator takes a child\u2019s age, theme and characters from a React interface, and a FastAPI service prompts Gemini for a story and matching images.',
      cites: find(['story-generator']),
    };
  if (has('education', 'degree', 'school', 'universit', 'study', 'gpa', 'certif', 'asu'))
    return {
      text: 'Yash is finishing an MS in Computer Software Engineering at Arizona State University (GPA 3.85), after a Bachelor of Information Technology at Manipal University Jaipur. He holds ServiceNow CSA and Discovery certifications.',
      cites: find(['asu', 'manipal']),
    };
  if (has('skill', 'stack', 'tool', 'technolog'))
    return {
      text: 'Day to day: Python and Java, FastAPI and Micronaut, AWS and GCP, Docker and Kubernetes, with Rust, C++ and TypeScript in project work. The full list is further down the page.',
      cites: find(['tools']),
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
      text: 'Email, LinkedIn, GitHub and a 30 minute booking link are at the bottom of the page.',
      cites: ['contact'],
    };
  return {
    text: 'That is not in the notes this page draws on yet. Try one of the suggested questions, or browse the projects below.',
    cites: [],
  };
}
