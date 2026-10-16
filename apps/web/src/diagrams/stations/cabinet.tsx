import { Dots, Line, Solid } from '../iso/vendor/draw';
import { cylinder, planOutline, pointsAt, segment, slabOf } from '../iso/vendor/kit';
import type { Piece, StationBuilder } from '../scene/types';
import { BED, base, box } from './shared';

const DRAWERS = [
  { z: 13, name: 'low' },
  { z: 26, name: 'mid' },
  { z: 39, name: 'top' },
];

/** Where something is looked up or stored: a cabinet of drawers, one of which slides out as the packet is checked. */
export const cabinet: StationBuilder = ({ P, x, y }) => {
  const bx = x - 14;
  const face = bx + 12;
  const body = slabOf(box(bx, y, 24, 50, 2), BED, 46, P, 3, 0.6);
  const drawer = (z: number, key: string, open: boolean) => (
    <g key={key}>
      <Solid
        paths={slabOf(box(face + 1.5, y, 3, 40, 1), BED + z - 7, 10, P, 2, 0.4)}
        tone="mid"
        crease="faint"
      />
      <Line
        d={segment([face + 3, y - 6, BED + z - 2], [face + 3, y + 6, BED + z - 2], P)}
        tone="hi"
      />
      <Dots
        points={pointsAt(
          [
            [face + 3, y - 16, BED + z - 2],
            [face + 3, y + 16, BED + z - 2],
          ],
          P,
        )}
        size={0.4}
        tone="mid"
      />
      {open && (
        <Line d={planOutline(box(face + 1.5, y, 3, 34, 1), BED + z + 3, P, 2)} tone="faint" />
      )}
    </g>
  );
  const back: Piece = {
    slot: 'back',
    node: (
      <g key="back">
        {base({ P, x, y })}
        <Solid paths={body} tone="mid" crease="faint" />
        <Line d={planOutline(box(bx, y, 18, 44, 1), BED + 46, P, 3)} tone="faint" />
        <Solid paths={cylinder(bx - 6, y - 18, 2, BED + 46, 2, P, 12)} tone="lo" crease="none" />
        {drawer(DRAWERS[0].z, 'low', false)}
        {drawer(DRAWERS[2].z, 'top', false)}
      </g>
    ),
  };
  const sliding: Piece = {
    slot: 'back',
    motion: 'drawer',
    move: (a) => [10 * a, 0, 0],
    node: drawer(DRAWERS[1].z, 'mid', true),
  };
  return [back, sliding];
};
