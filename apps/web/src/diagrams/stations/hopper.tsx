import { Dots, Line, Solid } from '../iso/vendor/draw';
import { cylinder, planOutline, pointsAt, slabOf } from '../iso/vendor/kit';
import type { Piece, StationBuilder } from '../scene/types';
import { BED, base, box } from './shared';

const BIN_Z = 26;
const BIN_H = 22;

/** Where things enter: an open bin on legs, full of what is about to be processed, with a spout that drops onto the belt. */
export const hopper: StationBuilder = ({ P, x, y }) => {
  const bx = x - 10;
  const leg = (px: number, py: number) => (
    <Solid
      key={`leg-${px}-${py}`}
      paths={cylinder(px, py, 2.4, BED, BIN_Z - BED, P, 14)}
      tone="mid"
      crease="faint"
    />
  );
  const wall = (cx: number, cy: number, w: number, d: number, key: string) => (
    <Solid
      key={key}
      paths={slabOf(box(cx, cy, w, d, 1), BIN_Z, BIN_H, P, 2, 0.4)}
      tone="mid"
      crease="faint"
    />
  );
  const card = (cx: number, cy: number, z: number, key: string) => (
    <Solid
      key={key}
      paths={slabOf(box(cx, cy, 14, 18, 1), BIN_Z + z, 2.4, P, 2)}
      tone="lo"
      crease="faint"
    />
  );
  const back: Piece = {
    slot: 'back',
    node: (
      <g key="back">
        {base({ P, x, y })}
        {leg(bx - 19, y - 19)}
        {leg(bx + 19, y - 19)}
        {leg(bx - 19, y + 19)}
        <Solid
          paths={slabOf(box(bx, y, 40, 40, 2), BIN_Z - 3, 3, P, 3, 0.4)}
          tone="lo"
          crease="faint"
        />
        {wall(bx - 18, y, 4, 40, 'wall-back-x')}
        {wall(bx, y - 18, 40, 4, 'wall-back-y')}
        {card(bx - 6, y - 8, 2, 'card-a')}
        {card(bx + 4, y + 2, 2, 'card-b')}
        {card(bx - 2, y - 2, 5, 'card-c')}
        <Solid
          paths={slabOf(box(x + 18, y, 12, 14, 1), BED, 6, P, 2, 0.4)}
          tone="mid"
          crease="faint"
        />
        <Line d={planOutline(box(x + 18, y, 8, 10, 1), BED + 6, P, 2)} tone="lo" />
        <Solid paths={cylinder(bx + 6, y, 5, BIN_Z - 8, 5, P, 14)} tone="mid" crease="faint" />
        <Dots
          points={pointsAt(
            [
              [bx - 18, y - 18, BIN_Z + BIN_H],
              [bx + 18, y - 18, BIN_Z + BIN_H],
            ],
            P,
          )}
          size={0.45}
          tone="mid"
        />
      </g>
    ),
  };
  const front: Piece = {
    slot: 'front',
    node: (
      <g key="front">
        {wall(bx + 18, y, 4, 40, 'wall-front-x')}
        {wall(bx, y + 18, 40, 4, 'wall-front-y')}
        {leg(bx + 19, y + 19)}
      </g>
    ),
  };
  return [back, front];
};
