import type { StationKind } from '../../content/diagrams';

/** The small word under a step's name that says what kind of step it is. */
export const captionOf: Record<StationKind, string> = {
  hopper: 'Input',
  press: 'Process',
  scanner: 'Analyse',
  cabinet: 'Data',
  gate: 'Check',
  pusher: 'Route',
  queue: 'Queue',
  display: 'Output',
  tray: 'Result',
};
