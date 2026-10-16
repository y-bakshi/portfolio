import type { Diagram } from './types';

/** TestPilot: coding standards are retrieved first, tests are drafted against them, and a critique sends weak ones back. */
export const testpilot: Diagram = {
  summary:
    'A production line. A repository enters a hopper, a cabinet looks up the five closest coding standards, a press drafts tests against them, and a gate scores each draft. A draft that scores below 0.6 rides a return belt back to the press; the rest go to the tray of finished tests.',
  stations: [
    {
      id: 'repo',
      kind: 'hopper',
      label: 'Read repository',
      sub: 'The codebase and its context come in.',
      col: 0,
      row: 0,
    },
    {
      id: 'standards',
      kind: 'cabinet',
      label: 'Retrieve coding standards',
      sub: 'The five closest standards are looked up in pgvector.',
      col: 1,
      row: 0,
    },
    {
      id: 'draft',
      kind: 'press',
      label: 'Draft tests',
      sub: 'Qwen writes tests that follow those standards.',
      col: 2,
      row: 0,
    },
    {
      id: 'critique',
      kind: 'gate',
      label: 'Critique gate',
      sub: 'Each draft is scored. Below 0.6 goes back to be redrafted.',
      col: 3,
      row: 0,
    },
    {
      id: 'tests',
      kind: 'tray',
      label: 'Keep tests',
      sub: 'Drafts that pass are kept.',
      col: 4,
      row: 0,
    },
  ],
  links: [
    { from: 'repo', to: 'standards' },
    { from: 'standards', to: 'draft' },
    { from: 'draft', to: 'critique' },
    { from: 'critique', to: 'draft' },
    { from: 'critique', to: 'tests' },
  ],
  routes: [
    ['repo', 'standards', 'draft', 'critique', 'draft', 'critique', 'tests'],
    ['repo', 'standards', 'draft', 'critique', 'tests'],
  ],
};
