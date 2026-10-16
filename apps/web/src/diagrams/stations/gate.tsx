import { Dots, Line, Solid } from '../iso/vendor/draw';
import { planOutline, pointsAt, sideTicks, slabOf } from '../iso/vendor/kit';
import type { Piece, StationBuilder } from '../scene/types';
import { BED, base, box } from './shared';

/** Where something is checked: two gauge posts and a barrier that lifts only when the packet passes. */
export const gate: StationBuilder = ({ P, x, y }) => {
  const gx = x + 18;
  const post = (py: number, key: string) => {
    const plan = box(gx, py, 7, 7, 1);
    const ticks = sideTicks(BED + 4, BED + 30, 3, 5, py + 3.5, BED + 36, [1.6, 3.2], P, 'x');
    return (
      <g key={key}>
        <Solid paths={slabOf(plan, BED, 38, P, 2, 0.5)} tone="mid" crease="faint" />
        <Line d={ticks.minor} tone="lo" />
        <Line d={ticks.major} tone="mid" />
        <Dots points={pointsAt([[gx, py, BED + 38]], P)} size={0.5} tone="mid" />
      </g>
    );
  };
  const back: Piece = {
    slot: 'back',
    node: (
      <g key="back">
        {base({ P, x, y })}
        <Line d={planOutline(box(x - 6, y, 22, 22, 2), BED, P, 4)} tone="lo" />
        {post(y - 22, 'post-a')}
      </g>
    ),
  };
  const arm: Piece = {
    slot: 'front',
    motion: 'arm',
    curve: 'late',
    move: (a) => [0, 0, 16 * a],
    node: (
      <g key="arm">
        <Solid
          paths={slabOf(box(gx, y, 3, 40, 1), BED + 6, 6, P, 2, 0.4)}
          tone="hi"
          crease="faint"
          className="iso-ink"
        />
        <Line d={planOutline(box(gx, y, 1.5, 34, 0.5), BED + 12, P, 2)} tone="faint" />
      </g>
    ),
  };
  const frontPost: Piece = { slot: 'front', node: post(y + 22, 'post-b') };
  return [back, arm, frontPost];
};
