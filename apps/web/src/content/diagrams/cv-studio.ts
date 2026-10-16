import type { Diagram } from './types';

/** CV Studio: a résumé is edited visually, turned into LaTeX, compiled to PDF on the server, and saved as a revision. */
export const cvStudio: Diagram = {
  summary:
    'A production line. A screen takes the visual edit, a press generates LaTeX, a second press compiles it with pdflatex, a second screen shows the protected PDF preview, and a cabinet saves each revision.',
  stations: [
    {
      id: 'edit',
      kind: 'display',
      label: 'Visual edit',
      sub: 'The résumé is edited visually.',
      col: 0,
      row: 0,
    },
    {
      id: 'latex',
      kind: 'press',
      label: 'Generate LaTeX',
      sub: 'The edit is turned into LaTeX source.',
      col: 1,
      row: 0,
    },
    {
      id: 'compile',
      kind: 'press',
      label: 'Compile with pdflatex',
      sub: 'The server compiles it with pdflatex, with shell escape off and timeouts.',
      col: 2,
      row: 0,
    },
    {
      id: 'preview',
      kind: 'display',
      label: 'Protected PDF preview',
      sub: 'A protected PDF preview is shown.',
      col: 3,
      row: 0,
    },
    {
      id: 'revision',
      kind: 'cabinet',
      label: 'Save revision',
      sub: 'A revision is saved, and version checks reject silent concurrent overwrites.',
      col: 4,
      row: 0,
    },
  ],
  links: [
    { from: 'edit', to: 'latex' },
    { from: 'latex', to: 'compile' },
    { from: 'compile', to: 'preview' },
    { from: 'preview', to: 'revision' },
  ],
  routes: [['edit', 'latex', 'compile', 'preview', 'revision']],
};
