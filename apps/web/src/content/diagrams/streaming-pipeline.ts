import type { Diagram } from './types';

/** Streaming data pipeline: taxi events go through Kafka and a custom consumer into a Neo4j graph. */
export const streamingPipeline: Diagram = {
  summary:
    'A production line. Taxi events enter a hopper and wait in a Kafka stream. A press stands for the custom consumer, and a cabinet is the Neo4j graph they are stored in.',
  stations: [
    {
      id: 'events',
      kind: 'hopper',
      label: 'Taxi events',
      sub: 'A producer sends NYC taxi records.',
      col: 0,
      row: 0,
    },
    { id: 'kafka', kind: 'queue', label: 'Kafka', sub: 'Records wait in a topic.', col: 1, row: 0 },
    {
      id: 'consumer',
      kind: 'press',
      label: 'Custom consumer',
      sub: 'Each record becomes nodes and relationships.',
      col: 2,
      row: 0,
    },
    {
      id: 'graph',
      kind: 'cabinet',
      label: 'Neo4j graph',
      sub: 'The graph is stored and can be queried.',
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
