import type { Diagram } from './types';

/** CatScript: source text becomes tokens, a tree, a checked tree, and then a running program. */
export const catscript: Diagram = {
  summary:
    'A flow chart. Source text goes to the lexer and parser, which build an abstract syntax tree. The type check reads the tree, and the interpreter then runs it.',
  stations: [
    {
      id: 'source',
      kind: 'hopper',
      label: 'Source text',
      sub: 'Source text goes in.',
      col: 0,
      row: 0,
    },
    {
      id: 'parse',
      kind: 'press',
      label: 'Lexer and parser',
      sub: 'The lexer and parser, with a grammar of over 450 lines.',
      col: 1,
      row: 0,
    },
    {
      id: 'ast',
      kind: 'cabinet',
      label: 'AST',
      sub: 'More than 20 types of AST node.',
      col: 2,
      row: 0,
    },
    {
      id: 'check',
      kind: 'gate',
      label: 'Type check',
      sub: 'A type checker checks the tree.',
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
