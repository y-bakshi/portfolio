import type { Diagram } from './types';

/** CityWatch: public signals are ingested, analysed and classified, then routed to the right department. */
export const citywatch: Diagram = {
  summary:
    'A production line. Social signals enter a hopper and queue up in a stream. A scanner analyses each one, a press classifies it, and a pusher routes the alert down one of two belts to the right department tray.',
  stations: [
    {
      id: 'signals',
      kind: 'hopper',
      label: 'Social signals',
      sub: 'Public posts and reports come in.',
      col: 0,
      row: 0,
    },
    {
      id: 'ingest',
      kind: 'queue',
      label: 'Kinesis ingests',
      sub: 'Signals wait in a stream until they are picked up.',
      col: 1,
      row: 0,
    },
    {
      id: 'analyse',
      kind: 'scanner',
      label: 'Lambda and Rekognition analyse',
      sub: 'Text and images are read.',
      col: 2,
      row: 0,
    },
    {
      id: 'classify',
      kind: 'press',
      label: 'Bedrock classifies',
      sub: 'The signal is sorted by department and priority.',
      col: 3,
      row: 0,
    },
    {
      id: 'route',
      kind: 'pusher',
      label: 'EventBridge routes',
      sub: 'Each alert goes to the department that should see it.',
      col: 4,
      row: 0,
    },
    {
      id: 'alert-a',
      kind: 'tray',
      label: 'Department alert',
      sub: 'Alerts arrive within 15 seconds.',
      col: 5,
      row: 0,
    },
    {
      id: 'alert-b',
      kind: 'tray',
      label: 'Another department',
      sub: 'A different alert goes elsewhere.',
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
  routes: [
    ['signals', 'ingest', 'analyse', 'classify', 'route', 'alert-a'],
    ['signals', 'ingest', 'analyse', 'classify', 'route', 'alert-b'],
  ],
};
