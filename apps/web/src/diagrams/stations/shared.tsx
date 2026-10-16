import type { ReactNode } from 'react';
import { Dots, Line, Solid } from '../iso/vendor/draw';
import { corners, insetPlan, planOutline, pointsAt, slabOf, type Plan } from '../iso/vendor/kit';
import { SIZE, type Ctx } from '../scene/types';

export const BED = SIZE.bed;

/** A floor rectangle by its centre and size. */
export const box = (cx: number, cy: number, w: number, d: number, r = 2): Plan => ({
  x: cx - w / 2,
  y: cy - d / 2,
  w,
  d,
  r,
});

/** The block every station stands on: a low plinth with an inset groove and four screws. */
export function base({ P, x, y }: Ctx): ReactNode {
  const plan = box(x, y, SIZE.station, SIZE.station, 5);
  return (
    <g key="base">
      <Solid paths={slabOf(plan, 0, BED, P, 6, 0.8)} tone="lo" crease="faint" />
      <Line d={planOutline(insetPlan(plan, 4), BED, P, 6)} tone="faint" />
      <Dots
        points={pointsAt(
          corners(plan, 6).map(([cx, cy]) => [cx, cy, BED] as [number, number, number]),
          P,
        )}
        size={0.5}
        tone="mid"
      />
    </g>
  );
}
