import type { ComponentType, SVGProps } from 'react';
import Aws from '@thesvg/react/amazon-web-services';
import CircleCi from '@thesvg/react/circleci';
import Claude from '@thesvg/react/claude';
import Cpp from '@thesvg/react/cplusplus';
import Docker from '@thesvg/react/docker';
import FastApi from '@thesvg/react/fastapi';
import Gemini from '@thesvg/react/gemini';
import Java from '@thesvg/react/java';
import Kafka from '@thesvg/react/kafka';
import Kubernetes from '@thesvg/react/kubernetes';
import Mapbox from '@thesvg/react/mapbox';
import Neo4j from '@thesvg/react/neo4j';
import NextJs from '@thesvg/react/nextjs';
import Ollama from '@thesvg/react/ollama';
import Postgres from '@thesvg/react/postgresql';
import Python from '@thesvg/react/python';
import PyTorch from '@thesvg/react/pytorch';
import React from '@thesvg/react/react';
import Rust from '@thesvg/react/rust';
import SqlAlchemy from '@thesvg/react/sqlalchemy';
import Tokio from '@thesvg/react/tokio';
import TypeScript from '@thesvg/react/typescript';
import Vite from '@thesvg/react/vite';

export type LogoComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** Brand marks for the technologies a project lists, keyed by the name the content uses. A name with no mark shows as text only. */
export const techLogos: Record<string, LogoComponent> = {
  FastAPI: FastApi,
  'Qwen via Ollama': Ollama,
  Docker,
  React,
  TypeScript,
  SQLAlchemy: SqlAlchemy,
  PostgreSQL: Postgres,
  pgvector: Postgres,
  'Next.js': NextJs,
  Claude,
  Mapbox,
  'C++17': Cpp,
  Rust,
  tokio: Tokio,
  Kafka,
  Java,
  AWS: Aws,
  CircleCI: CircleCi,
  Neo4j,
  Kubernetes,
  PyTorch,
  Python,
  Vite,
  'Gemini API': Gemini,
  Kinesis: Aws,
  Lambda: Aws,
  Rekognition: Aws,
  Bedrock: Aws,
  EventBridge: Aws,
  SQS: Aws,
  ECR: Aws,
  EC2: Aws,
  'IoT Greengrass': Aws,
};
