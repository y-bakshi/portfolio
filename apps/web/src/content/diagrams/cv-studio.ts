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
      sub: 'The résumé is edited in the browser.',
      col: 0,
      row: 0,
    },
    {
      id: 'latex',
      kind: 'press',
      label: 'Generate LaTeX',
      sub: 'The edit becomes LaTeX source.',
      col: 1,
      row: 0,
    },
    {
      id: 'compile',
      kind: 'press',
      label: 'Compile with pdflatex',
      sub: 'The server builds a PDF, with shell escape off and timeouts.',
      col: 2,
      row: 0,
    },
    {
      id: 'preview',
      kind: 'display',
      label: 'Protected PDF preview',
      sub: 'The PDF is shown back to the editor.',
      col: 3,
      row: 0,
    },
    {
      id: 'revision',
      kind: 'cabinet',
      label: 'Save revision',
      sub: 'A revision is kept, and a stale save is rejected by a version check.',
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
