import type { Diagram } from './types';

/** ProcWatch: /proc is read, events are detected, and they are shown in the terminal and written to logs. */
export const procwatch: Diagram = {
  summary:
    'A production line. A hopper stands for /proc, a scanner detects spawn, exit, CPU-spike and memory-growth events, a screen shows them in the terminal, and a cabinet keeps the session logs.',
  stations: [
    {
      id: 'proc',
      kind: 'hopper',
      label: 'Read /proc',
      sub: 'Per-process CPU and memory are read.',
      col: 0,
      row: 0,
    },
    {
      id: 'detect',
      kind: 'scanner',
      label: 'Detect events',
      sub: 'Spawns, exits, CPU spikes and memory growth are noticed.',
      col: 1,
      row: 0,
    },
    {
      id: 'tui',
      kind: 'display',
      label: 'Terminal UI',
      sub: 'Ratatui shows them as they happen.',
      col: 2,
      row: 0,
    },
    {
      id: 'logs',
      kind: 'cabinet',
      label: 'Session logs',
      sub: 'Rotating JSONL logs are written, and an incident bundle can be exported.',
      col: 3,
      row: 0,
    },
  ],
  links: [
    { from: 'proc', to: 'detect' },
    { from: 'detect', to: 'tui' },
    { from: 'tui', to: 'logs' },
  ],
  routes: [['proc', 'detect', 'tui', 'logs']],
};
