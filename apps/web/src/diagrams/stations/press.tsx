import { Dots, Line, Solid } from '../iso/vendor/draw';
import { corners, cylinder, planOutline, pointsAt, slabOf } from '../iso/vendor/kit';
import type { Piece, StationBuilder } from '../scene/types';
import { BED, base, box } from './shared';

/** Where something is made: a C-frame over a die, with a piston that comes down on whatever sits on it. */
export const press: StationBuilder = ({ P, x, y }) => {
  const column = box(x - 22, y, 10, 50, 2);
  const arm = box(x - 6, y, 34, 16, 2);
  const back: Piece = {
    slot: 'back',
    node: (
      <g key="back">
        {base({ P, x, y })}
        <Line d={planOutline(box(x + 4, y, 30, 30, 2), BED, P, 4)} tone="lo" />
        <Line d={planOutline(box(x + 4, y, 22, 22, 1), BED, P, 4)} tone="faint" />
        <Solid paths={slabOf(column, BED, 42, P, 3, 0.6)} tone="mid" crease="faint" />
        <Dots
          points={pointsAt(
            [
              [x - 22, y - 18, BED + 42],
              [x - 22, y + 18, BED + 42],
            ],
            P,
          )}
          size={0.5}
          tone="mid"
        />
        <Solid paths={slabOf(arm, BED + 34, 10, P, 3, 0.6)} tone="mid" crease="faint" />
        <Line d={planOutline(box(x - 6, y, 24, 8, 1), BED + 44, P, 3)} tone="faint" />
        <Dots
          points={pointsAt(
            corners(arm, 4).map(([cx, cy]) => [cx, cy, BED + 44] as [number, number, number]),
            P,
          )}
          size={0.45}
          tone="mid"
        />
      </g>
    ),
  };
  const piston: Piece = {
    slot: 'front',
    motion: 'piston',
    move: (a) => [0, 0, -9 * a],
    node: (
      <g key="piston">
        <Solid paths={cylinder(x + 4, y, 3.4, BED + 24, 11, P, 16)} tone="mid" crease="none" />
        <Solid
          paths={cylinder(x + 4, y, 9, BED + 18, 6, P, 24, 0.5)}
          tone="hi"
          crease="faint"
          className="iso-ink"
        />
        <Line d={planOutline(box(x + 4, y, 10, 10, 5), BED + 24, P, 4)} tone="faint" />
      </g>
    ),
  };
  return [back, piston];
};
