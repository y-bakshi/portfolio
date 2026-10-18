import type { Diagram } from './types';

/** Streaming data pipeline: taxi events go through Kafka and a custom consumer into a Neo4j graph. */
export const streamingPipeline: Diagram = {
  summary:
    'A flow chart. Taxi events go through Kafka to a custom consumer, which writes them into a Neo4j graph.',
  stations: [
    {
      id: 'events',
      kind: 'hopper',
      label: 'Taxi events',
      sub: 'A producer sends NYC taxi records.',
      col: 0,
      row: 0,
    },
    {
      id: 'kafka',
      kind: 'queue',
      label: 'Kafka',
      sub: 'The records go through Kafka.',
      col: 1,
      row: 0,
    },
    {
      id: 'consumer',
      kind: 'press',
      label: 'Custom consumer',
      sub: 'A custom consumer reads them.',
      col: 2,
      row: 0,
    },
    {
      id: 'graph',
      kind: 'cabinet',
      label: 'Neo4j graph',
      sub: 'They are written into Neo4j as nodes and relationships.',
      col: 3,
      row: 0,
    },
  ],
  links: [
    { from: 'events', to: 'kafka' },
    { from: 'kafka', to: 'consumer' },
    { from: 'consumer', to: 'graph' },
  ],
  routes: [['events', 'kafka', 'consumer', 'graph']],
};
