import { education, roles } from './history';
import { projects } from './projects';
import type { Answer } from './types';

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
      text: 'TestPilot is the RAG project. It retrieves a team’s coding standards before drafting tests, stores them in pgvector, and runs a critique loop over the output. Yash led its AI pipeline, model integration and backend within a four-person team.',
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
