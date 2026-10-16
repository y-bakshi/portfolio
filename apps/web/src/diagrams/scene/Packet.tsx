import { Solid } from '../iso/vendor/draw';
import { slabOf, type Projection } from '../iso/vendor/kit';
import { SIZE } from './types';

/** The thing that travels: a small navy crate with a gold lid, drawn at the origin and moved into place by its group. */
export function Packet({ P }: { P: Projection }) {
  const s = SIZE.packet;
  const plan = { x: -s / 2, y: -s / 2, w: s, d: s, r: 1 };
  return (
    <g className="iso-packet">
      <Solid paths={slabOf(plan, 0, s, P, 2, 0.5)} tone="hi" crease="faint" />
    </g>
  );
}
