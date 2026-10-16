import type { Diagram } from './types';

/** CityWatch: public signals are ingested, analysed and classified, then routed to the right department. */
export const citywatch: Diagram = {
  summary:
    'A flow chart. Social signals go into a Kinesis stream. Lambda and Rekognition analyse each one, Bedrock classifies it, and EventBridge routes the alert down one of two branches to the department that needs it.',
  stations: [
    {
      id: 'signals',
      kind: 'hopper',
      label: 'Social signals',
      sub: 'Social-media signals come in.',
      col: 0,
      row: 0,
    },
    {
      id: 'ingest',
      kind: 'queue',
      label: 'Kinesis ingests',
      sub: 'Kinesis ingests them.',
      col: 1,
      row: 0,
    },
    {
      id: 'analyse',
      kind: 'scanner',
      label: 'Lambda and Rekognition analyse',
      sub: 'Lambda and Rekognition analyse them.',
      col: 2,
      row: 0,
    },
    {
      id: 'classify',
      kind: 'press',
      label: 'Bedrock classifies',
      sub: 'Bedrock classifies them.',
      col: 3,
      row: 0,
    },
    {
      id: 'route',
      kind: 'pusher',
      label: 'EventBridge routes',
      sub: 'EventBridge routes each alert.',
      col: 4,
      row: 0,
    },
    {
      id: 'alert-a',
      kind: 'tray',
      label: 'Department alert',
      sub: 'Department alerts arrive within 15 seconds.',
      col: 5,
      row: 0,
    },
    {
      id: 'alert-b',
      kind: 'tray',
      label: 'Another department',
      sub: 'Each alert goes to the right department.',
      col: 4,
      row: 1,
    },
  ],
  links: [
    { from: 'signals', to: 'ingest' },
    { from: 'ingest', to: 'analyse' },
    { from: 'analyse', to: 'classify' },
    { from: 'classify', to: 'route' },
    { from: 'route', to: 'alert-a' },
    { from: 'route', to: 'alert-b' },
  ],
  groups: [{ label: 'AWS', members: ['ingest', 'analyse', 'classify', 'route'] }],
  routes: [
    ['signals', 'ingest', 'analyse', 'classify', 'route', 'alert-a'],
    ['signals', 'ingest', 'analyse', 'classify', 'route', 'alert-b'],
  ],
};
