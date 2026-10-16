import type { Diagram } from './types';

/** GuardianAI: a question takes a fast lane through database summaries or a slower one through a ReAct agent. */
export const guardianai: Diagram = {
  summary:
    'A production line with two lanes. Incident feeds enter a hopper and reach a pusher that routes each question. A location question goes straight on to a cabinet of database summaries, in 1 to 2 seconds. An open-ended one is pushed sideways to a press that stands for the ReAct agent, in 3 to 4 seconds. Both end at the safety response tray.',
  stations: [
    {
      id: 'feeds',
      kind: 'hopper',
      label: 'Incident map and feeds',
      sub: 'The incident map and feeds come in.',
      col: 0,
      row: 0,
    },
    {
      id: 'route',
      kind: 'pusher',
      label: 'Route the question',
      sub: 'Location questions take the summary path; open-ended ones take the ReAct path.',
      col: 1,
      row: 0,
    },
    {
      id: 'summary',
      kind: 'cabinet',
      label: 'Summary path',
      sub: 'Database summaries answer in 1 to 2 seconds.',
      col: 2,
      row: 0,
    },
    {
      id: 'react',
      kind: 'press',
      label: 'ReAct path',
      sub: 'The ReAct agent answers in 3 to 4 seconds, and runs only when it is needed.',
      col: 1,
      row: 1,
    },
    {
      id: 'response',
      kind: 'tray',
      label: 'Safety response',
      sub: 'The safety response is returned.',
      col: 3,
      row: 0,
    },
  ],
  links: [
    { from: 'feeds', to: 'route' },
    { from: 'route', to: 'summary' },
    { from: 'route', to: 'react' },
    { from: 'summary', to: 'response' },
    { from: 'react', to: 'response' },
  ],
  routes: [
    ['feeds', 'route', 'summary', 'response'],
    ['feeds', 'route', 'react', 'response'],
  ],
};
