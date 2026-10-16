import type { Diagram } from './types';

/** TestPilot: coding standards are retrieved first, tests are drafted against them, and a critique sends weak ones back. */
export const testpilot: Diagram = {
  summary:
    'A flow chart with a loop. A repository is read, the five closest coding standards are retrieved, and tests are drafted against them. A critique gate scores each draft. A draft that scores below 0.6 goes back to be redrafted; the rest are kept as tests.',
  stations: [
    {
      id: 'repo',
      kind: 'hopper',
      label: 'Read repository',
      sub: 'A repository comes in.',
      col: 0,
      row: 0,
    },
    {
      id: 'standards',
      kind: 'cabinet',
      label: 'Retrieve coding standards',
      sub: 'The five most relevant coding-standard chunks are retrieved first.',
      col: 1,
      row: 0,
    },
    {
      id: 'draft',
      kind: 'press',
      label: 'Draft tests',
      sub: 'Tests are drafted against those standards.',
      col: 2,
      row: 0,
    },
    {
      id: 'critique',
      kind: 'gate',
      label: 'Critique gate',
      sub: 'An LLM critique scores each draft. Anything below 0.6 is sent back.',
      col: 3,
      row: 0,
    },
    {
      id: 'tests',
      kind: 'tray',
      label: 'Keep tests',
      sub: 'Drafts that pass the critique are kept.',
      col: 4,
      row: 0,
    },
  ],
  links: [
    { from: 'repo', to: 'standards' },
    { from: 'standards', to: 'draft' },
    { from: 'draft', to: 'critique' },
    { from: 'critique', to: 'draft', label: 'Below 0.6: redraft' },
    { from: 'critique', to: 'tests' },
  ],
  routes: [
    ['repo', 'standards', 'draft', 'critique', 'draft', 'critique', 'tests'],
    ['repo', 'standards', 'draft', 'critique', 'tests'],
  ],
};
