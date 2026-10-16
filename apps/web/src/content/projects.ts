import type { Project } from './types';

export const projects: Project[] = [
  {
    id: 'testpilot',
    categories: ['ai', 'backend', 'cloud'],
    featured: true,
    name: 'TestPilot',
    line: 'Writes tests, then argues with them.',
    detail:
      'Generates pytest, Jest and JUnit tests and ranks defect-prone files in public GitHub repositories. It retrieves the five most relevant coding-standard chunks first, drafts the tests against them, and an LLM critique loop regenerates anything scoring below 0.6.',
    role: 'Owned all of it but the frontend: AI pipeline, fine-tuning, defect prediction, CI/CD, backend.',
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
    id: 'citywatch',
    categories: ['cloud', 'ai'],
    featured: true,
    name: 'CityWatch',
    line: 'Turns noisy public signals into alerts for the right department.',
    detail:
      'A serverless pipeline on AWS that turns social-media signals into department alerts within 15 seconds. Kinesis ingests, Lambda and Rekognition analyse, Bedrock classifies, and EventBridge routes each alert. Won the AWS Ideathon 2026.',
    role: 'Designed the pipeline and its scaling model. Won the AWS Ideathon 2026.',
    stack: ['Kinesis', 'Lambda', 'Rekognition', 'Bedrock', 'EventBridge'],
    links: [
      {
        label: 'Pitch deck',
        href: 'https://gamma.app/docs/CityWatch-we9ido0egg80ra9?mode=present',
      },
    ],
    trace: [
      { label: 'Social signals', depth: 0 },
      { label: 'Kinesis and Lambda', depth: 1 },
      { label: 'Vision and LLM classification', depth: 2 },
      { label: 'Department alerts', depth: 3 },
    ],
  },
  {
    id: 'cv-studio',
    categories: ['backend'],
    featured: true,
    name: 'CV Studio',
    line: 'A résumé editor that compiles real LaTeX.',
    detail:
      'A multi-user workspace where a résumé is edited visually, inspected as LaTeX source, and compiled to PDF on the server with pdflatex (shell escape off, with timeouts). It keeps revision history with restore, rejects silent concurrent overwrites with version checks, and stores job descriptions and text-selection annotations beside each CV.',
    role: 'Sole author: the React editor, the FastAPI service, and the CI pipeline.',
    stack: ['React', 'TypeScript', 'Tiptap', 'FastAPI', 'SQLAlchemy', 'PostgreSQL', 'pdflatex'],
    links: [{ label: 'GitHub', href: 'https://github.com/y-bakshi/cv-studio' }],
    trace: [
      { label: 'Visual edit', depth: 0 },
      { label: 'Generate LaTeX', depth: 1 },
      { label: 'Compile with pdflatex', depth: 2 },
      { label: 'Protected PDF preview', depth: 3 },
      { label: 'Save revision', depth: 4 },
    ],
  },
  {
    id: 'guardianai',
    categories: ['ai', 'backend'],
    featured: true,
    name: 'GuardianAI',
    line: 'Two ways to answer a safety question.',
    detail:
      'A neighborhood safety assistant. Location questions take a 1 to 2 second path through database summaries. Open-ended ones go to a 3 to 4 second ReAct path, so the expensive agent runs only when it is needed. The team later renamed it CityWatch, which is the name its live demo shows. It is a different project from the AWS Ideathon entry below.',
    role: 'Designed the two-lane chat and built the data pipeline.',
    stack: ['Next.js', 'TypeScript', 'FastAPI', 'Claude', 'PostgreSQL', 'Mapbox', 'WebSockets'],
    links: [{ label: 'Live demo', href: 'https://city-watch-frontend.vercel.app/' }],
    trace: [
      { label: 'Incident map and feeds', depth: 0 },
      { label: 'Route the question', depth: 1 },
      { label: 'Summary path', depth: 2 },
      { label: 'ReAct path', depth: 2 },
      { label: 'Safety response', depth: 3 },
    ],
  },
  {
    id: 'catscript',
    categories: ['systems'],
    name: 'CatScript',
    line: 'A small programming language, lexer to interpreter.',
    detail:
      'A C++17 language with a lexer, a grammar of over 450 lines, 20+ AST node types, a type checker and a tree-walking interpreter. It passes all 12 end-to-end test programs.',
    role: 'Led a four-person team.',
    stack: ['C++17', 'Flex', 'Bison', 'Make'],
    links: [{ label: 'GitHub', href: 'https://github.com/y-bakshi/SER502-CatScript-Team8' }],
    trace: [
      { label: 'Source text', depth: 0 },
      { label: 'Lexer and parser', depth: 1 },
      { label: 'AST', depth: 2 },
      { label: 'Type check', depth: 3 },
      { label: 'Interpret', depth: 4 },
    ],
  },
  {
    id: 'procwatch',
    categories: ['systems'],
    name: 'ProcWatch',
    line: 'A terminal process monitor for Linux and WSL.',
    detail:
      'A Rust terminal monitor built with Ratatui. It reads /proc for per-process CPU and memory, shows spawn, exit, CPU-spike and memory-growth events, writes rotating JSONL session logs and exports an incident bundle. A web dashboard is planned.',
    role: 'Built on my own.',
    stack: ['Rust', 'Ratatui', 'tokio', '/proc'],
    links: [{ label: 'GitHub', href: 'https://github.com/y-bakshi/procwatch' }],
    trace: [
      { label: 'Read /proc', depth: 0 },
      { label: 'Detect events', depth: 1 },
      { label: 'Terminal UI', depth: 2 },
      { label: 'Session logs', depth: 3 },
    ],
  },
  {
    id: 'streaming-pipeline',
    categories: ['backend', 'cloud'],
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
    id: 'face-recognition',
    categories: ['cloud', 'ai'],
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
    id: 'edge-inference',
    categories: ['cloud', 'ai'],
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
    id: 'story-generator',
    categories: ['ai'],
    name: 'Gemini story generator',
    line: 'Stories and pictures for children.',
    detail:
      'A React and Vite interface and a FastAPI service collect a child\u2019s age, theme and characters, then prompt Gemini for a story and matching images, for ages 4 to 12.',
    role: 'Hackathon team project.',
    stack: ['React', 'Vite', 'FastAPI', 'Python', 'Gemini API'],
    trace: [
      { label: 'Story prompt', depth: 0 },
      { label: 'Build the prompt', depth: 1 },
      { label: 'Gemini', depth: 2 },
      { label: 'Story and images', depth: 3 },
    ],
  },
];
