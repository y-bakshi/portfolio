import { Dots, Line, Solid } from '../iso/vendor/draw';
import {
  corners,
  cylinder,
  insetPlan,
  planOutline,
  pointsAt,
  slabOf,
  type Plan,
  type Projection,
} from '../iso/vendor/kit';

const HEIGHT = 10;
const FOOT = 8;

/** The bench the whole line stands on: a plate on four feet, with a groove round its edge, screws, and a plate for a label. */
export function Bench({ plan, P }: { plan: Plan; P: Projection }) {
  const slab = slabOf(plan, -HEIGHT, HEIGHT, P, 8, 1);
  const groove = insetPlan(plan, 5);
  const label = { x: plan.x + plan.w - 52, y: plan.y + plan.d - 3, w: 36, d: 3, r: 0 };
  return (
    <g>
      <path className="iso-halo" d={slabOf(plan, -HEIGHT - FOOT, HEIGHT + FOOT, P, 8).fill} />
      {corners(plan, 16).map(([x, y]) => (
        <Solid
          key={`${x}-${y}`}
          paths={cylinder(x, y, 5, -HEIGHT - FOOT, FOOT, P, 16, 0.4)}
          tone="lo"
          crease="faint"
        />
      ))}
      <Solid paths={slab} tone="mid" crease="faint" />
      <Line d={planOutline(groove, 0, P, 8)} tone="faint" />
      <Dots
        points={pointsAt(
          corners(plan, 10).map(([x, y]) => [x, y, 0] as [number, number, number]),
          P,
        )}
        size={0.55}
        tone="mid"
      />
      <Solid paths={slabOf(label, -HEIGHT + 2, 5, P, 1)} tone="lo" crease="none" />
    </g>
  );
}
