import { Dots, Line, Solid } from '../iso/vendor/draw';
import { pointsAt, segment, slabOf } from '../iso/vendor/kit';
import type { Piece, StationBuilder } from '../scene/types';
import { BED, base, box } from './shared';

/** Where things wait their turn: a trough divided into slots, with a packet moving up it a slot at a time. */
export const queue: StationBuilder = ({ P, x, y }) => {
  const rail = (dy: number) => (
    <Solid
      key={dy}
      paths={slabOf(box(x, y + dy, 52, 3, 1), BED, 6, P, 2, 0.3)}
      tone="mid"
      crease="faint"
    />
  );
  const fins = [-18, -6, 6, 18].map((dx) => (
    <Line key={dx} d={segment([x + dx, y - 12, BED], [x + dx, y + 12, BED], P)} tone="mid" />
  ));
  const back: Piece = {
    slot: 'back',
    node: (
      <g key="back">
        {base({ P, x, y })}
        {rail(-12)}
        {fins}
        <Dots
          points={pointsAt(
            [
              [x - 22, y, BED],
              [x + 22, y, BED],
            ],
            P,
          )}
          size={0.5}
          tone="mid"
        />
      </g>
    ),
  };
  const front: Piece = { slot: 'front', node: <g key="front">{rail(12)}</g> };
  return [back, front];
};
