import type { Diagram } from './types';

/** CatScript: source text becomes tokens, a tree, a checked tree, and then a running program. */
export const catscript: Diagram = {
  summary:
    'A production line. Source text enters a hopper, a press lexes and parses it, a cabinet holds the syntax tree, a gate type-checks it, and a screen shows the interpreter running it.',
  stations: [
    {
      id: 'source',
      kind: 'hopper',
      label: 'Source text',
      sub: 'A CatScript program comes in.',
      col: 0,
      row: 0,
    },
    {
      id: 'parse',
      kind: 'press',
      label: 'Lexer and parser',
      sub: 'The text becomes tokens, then a tree.',
      col: 1,
      row: 0,
    },
    {
      id: 'ast',
      kind: 'cabinet',
      label: 'AST',
      sub: 'More than 20 kinds of tree node hold the program.',
      col: 2,
      row: 0,
    },
    {
      id: 'check',
      kind: 'gate',
      label: 'Type check',
      sub: 'A program with a type error does not pass.',
      col: 3,
      row: 0,
    },
    {
      id: 'run',
      kind: 'display',
      label: 'Interpret',
      sub: 'A tree-walking interpreter runs it.',
      col: 4,
      row: 0,
    },
  ],
  links: [
    { from: 'source', to: 'parse' },
    { from: 'parse', to: 'ast' },
    { from: 'ast', to: 'check' },
    { from: 'check', to: 'run' },
  ],
  routes: [['source', 'parse', 'ast', 'check', 'run']],
};
