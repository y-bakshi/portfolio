import { Line, Solid } from '../iso/vendor/draw';
import { planOutline, slabOf } from '../iso/vendor/kit';
import type { Piece, StationBuilder } from '../scene/types';
import { BED, base, box } from './shared';

/** Where things end up: a shallow tray with a few results already in it. */
export const tray: StationBuilder = ({ P, x, y }) => {
  const wall = (cx: number, cy: number, w: number, d: number, key: string) => (
    <Solid
      key={key}
      paths={slabOf(box(cx, cy, w, d, 1), BED, 8, P, 2, 0.4)}
      tone="mid"
      crease="faint"
    />
  );
  const card = (cx: number, cy: number, z: number, key: string) => (
    <Solid
      key={key}
      paths={slabOf(box(cx, cy, 11, 11, 1), BED + z, 3, P, 2)}
      tone="mid"
      crease="faint"
    />
  );
  const back: Piece = {
    slot: 'back',
    node: (
      <g key="back">
        {base({ P, x, y })}
        <Line d={planOutline(box(x, y, 40, 40, 2), BED, P, 4)} tone="lo" />
        {wall(x - 25, y, 4, 50, 'wall-back-x')}
        {wall(x, y - 25, 46, 4, 'wall-back-y')}
        {card(x - 9, y - 9, 0, 'card-1')}
        {card(x + 9, y - 9, 0, 'card-2')}
        {card(x - 9, y + 9, 0, 'card-3')}
        {card(x - 9, y - 9, 3, 'card-4')}
      </g>
    ),
  };
  const front: Piece = {
    slot: 'front',
    node: (
      <g key="front">
        {wall(x + 25, y, 4, 50, 'wall-front-x')}
        {wall(x, y + 25, 46, 4, 'wall-front-y')}
      </g>
    ),
  };
  return [back, front];
};
