import { Dots, Line, Solid } from '../iso/vendor/draw';
import { iso, pathOf, planOutline, pointsAt, slabOf } from '../iso/vendor/kit';
import type { Point3 } from '../iso/vendor/kit';
import type { Piece, StationBuilder } from '../scene/types';
import { BED, base, box } from './shared';

/** Where something is read: an arch over the belt with a scanning frame that sweeps along the packet. */
export const scanner: StationBuilder = ({ P, x, y }) => {
  const post = (py: number, key: string) => (
    <g key={key}>
      <Solid paths={slabOf(box(x, py, 8, 8, 1), BED, 34, P, 2, 0.5)} tone="mid" crease="faint" />
      <Dots points={pointsAt([[x, py, BED + 34]], P)} size={0.5} tone="mid" />
    </g>
  );
  const back: Piece = {
    slot: 'back',
    node: (
      <g key="back">
        {base({ P, x, y })}
        <Line d={planOutline(box(x, y, 36, 30, 2), BED, P, 4)} tone="lo" />
        {post(y - 23, 'post-a')}
      </g>
    ),
  };
  // a frame drawn in outline only, so the packet shows through it
  const w = 17;
  const corners: Point3[] = [
    [x, y - w, BED + 1],
    [x, y + w, BED + 1],
    [x, y + w, BED + 25],
    [x, y - w, BED + 25],
  ];
  const sweep: Piece = {
    slot: 'front',
    motion: 'sweep',
    curve: 'ramp',
    move: (a) => [-14 + 28 * a, 0, 0],
    node: (
      <g key="sweep">
        <Line
          d={pathOf(
            corners.map((p) => iso(p, P)),
            true,
          )}
          tone="lit"
        />
      </g>
    ),
  };
  const beam: Piece = {
    slot: 'front',
    node: (
      <g key="beam">
        <Solid
          paths={slabOf(box(x, y, 10, 54, 2), BED + 34, 7, P, 3, 0.5)}
          tone="hi"
          crease="faint"
          className="iso-ink"
        />
        {post(y + 23, 'post-b')}
      </g>
    ),
  };
  return [back, beam, sweep];
};
