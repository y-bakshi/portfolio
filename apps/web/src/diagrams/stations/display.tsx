import { Dots, Line, Solid } from '../iso/vendor/draw';
import { pointsAt, segment, slabOf } from '../iso/vendor/kit';
import type { Piece, StationBuilder } from '../scene/types';
import { BED, base, box } from './shared';

const HALF_ROWS = [15, 11, 17, 9, 13];

/** Where something is shown to a person: a screen on a stand, with a cursor that works down its lines. */
export const display: StationBuilder = ({ P, x, y }) => {
  const sx = x - 16;
  const face = sx + 4;
  const rows = HALF_ROWS.map((half, i) => {
    const z = BED + 38 - i * 6;
    return <Line key={i} d={segment([face, y - half, z], [face, y + half, z], P)} tone="lo" />;
  });
  const back: Piece = {
    slot: 'back',
    node: (
      <g key="back">
        {base({ P, x, y })}
        <Solid paths={slabOf(box(sx, y, 14, 30, 2), BED, 6, P, 3, 0.5)} tone="mid" crease="faint" />
        <Solid
          paths={slabOf(box(sx, y, 8, 46, 3), BED + 6, 36, P, 4, 0.7)}
          tone="hi"
          crease="faint"
          className="iso-ink"
        />
        <Line d={segment([face, y - 19, BED + 40], [face, y + 19, BED + 40], P)} tone="faint" />
        <Line d={segment([face, y - 19, BED + 10], [face, y + 19, BED + 10], P)} tone="faint" />
        {rows}
        <Dots
          points={pointsAt(
            [
              [face, y - 21, BED + 42],
              [face, y + 21, BED + 42],
              [face, y - 21, BED + 8],
              [face, y + 21, BED + 8],
            ],
            P,
          )}
          size={0.45}
          tone="mid"
        />
      </g>
    ),
  };
  const cursor: Piece = {
    slot: 'back',
    motion: 'cursor',
    curve: 'ramp',
    move: (a) => [0, 0, -24 * a],
    node: (
      <g key="cursor">
        <Solid
          paths={slabOf(box(face + 0.8, y - 17, 1.6, 4, 0.5), BED + 36, 4, P, 2)}
          tone="hi"
          lit
        />
      </g>
    ),
  };
  return [back, cursor];
};
