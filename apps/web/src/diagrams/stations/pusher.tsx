import { Dots, Line, Solid } from '../iso/vendor/draw';
import { planOutline, pointsAt, slabOf } from '../iso/vendor/kit';
import type { Piece, StationBuilder } from '../scene/types';
import { BED, base, box } from './shared';

/** Where a packet is routed: a ram on the far side that shoves it sideways onto another belt when that is the way it goes. */
export const pusher: StationBuilder = ({ P, x, y }) => {
  const back: Piece = {
    slot: 'back',
    node: (
      <g key="back">
        {base({ P, x, y })}
        <Line d={planOutline(box(x, y + 2, 24, 28, 2), BED, P, 4)} tone="lo" />
        <Solid
          paths={slabOf(box(x, y - 23, 30, 10, 2), BED, 22, P, 3, 0.6)}
          tone="mid"
          crease="faint"
        />
        <Line d={planOutline(box(x, y - 23, 22, 4, 1), BED + 22, P, 2)} tone="faint" />
        <Dots
          points={pointsAt(
            [
              [x - 11, y - 23, BED + 22],
              [x + 11, y - 23, BED + 22],
            ],
            P,
          )}
          size={0.45}
          tone="mid"
        />
      </g>
    ),
  };
  const ram: Piece = {
    slot: 'back',
    motion: 'ram',
    curve: 'late',
    move: (a, exit) => [0, exit === '+y' ? 24 * a : 0, 0],
    node: (
      <g key="ram">
        <Solid paths={slabOf(box(x, y - 15, 5, 5, 1), BED + 6, 4, P, 2)} tone="mid" crease="none" />
        <Solid
          paths={slabOf(box(x, y - 11, 18, 4, 1), BED, 14, P, 2, 0.4)}
          tone="hi"
          crease="faint"
          className="iso-ink"
        />
      </g>
    ),
  };
  return [back, ram];
};
