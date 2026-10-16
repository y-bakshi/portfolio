import type { Diagram, DiagramLink } from '../../content/diagrams/types';
import type { Belt, Layout, Placed } from './types';
import { SIZE } from './types';

const HALF = SIZE.station / 2;
/** How far behind a station the return lane runs. */
const RETURN_GAP = 24;
/** Space left around the stations on the bench. */
const MARGIN = 18;

type Point = [number, number];

/** Puts each station at its grid cell. */
function place(diagram: Diagram): Placed[] {
  return diagram.stations.map((s) => ({
    id: s.id,
    kind: s.kind,
    x: s.col * SIZE.pitchX,
    y: s.row * SIZE.pitchY,
  }));
}

const centre = (p: Placed): Point => [p.x, p.y];

/** The belt for one link: straight along the line, round the corner across it, or back behind the stations. */
function beltFor(link: DiagramLink, index: number, byId: Map<string, Placed>): Belt {
  const a = byId.get(link.from);
  const b = byId.get(link.to);
  if (!a || !b) throw new Error(`diagram link ${link.from} to ${link.to} names a missing station`);
  const from = centre(a);
  const to = centre(b);

  if (a.y === b.y && b.x < a.x) {
    // a return lane: out of the back of the first station, along behind, into the back of the second
    const out: Point = [a.x, a.y - HALF];
    const lane = a.y - HALF - RETURN_GAP;
    const p1: Point = [a.x, lane];
    const p2: Point = [b.x, lane];
    const into: Point = [b.x, b.y - HALF];
    return {
      from: link.from,
      to: link.to,
      index,
      path: [from, out, p1, p2, into, to],
      runs: [
        { a: out, b: p1 },
        { a: p1, b: p2 },
        { a: p2, b: into },
      ],
      isReturn: true,
    };
  }

  const sx = Math.sign(b.x - a.x);
  const sy = Math.sign(b.y - a.y);
  if (a.y === b.y) {
    const start: Point = [a.x + sx * HALF, a.y];
    const end: Point = [b.x - sx * HALF, b.y];
    return {
      from: link.from,
      to: link.to,
      index,
      path: [from, start, end, to],
      runs: [{ a: start, b: end }],
      isReturn: false,
    };
  }
  if (a.x === b.x) {
    const start: Point = [a.x, a.y + sy * HALF];
    const end: Point = [b.x, b.y - sy * HALF];
    return {
      from: link.from,
      to: link.to,
      index,
      path: [from, start, end, to],
      runs: [{ a: start, b: end }],
      isReturn: false,
    };
  }
  // across and along: leave sideways, turn at the second station's column, and come in along y
  const start: Point = [a.x + sx * HALF, a.y];
  const corner: Point = [b.x, a.y];
  const end: Point = [b.x, b.y - sy * HALF];
  return {
    from: link.from,
    to: link.to,
    index,
    path: [from, start, corner, end, to],
    runs: [
      { a: start, b: corner },
      { a: corner, b: end },
    ],
    isReturn: false,
  };
}

/** Where everything stands: the stations on their grid, the belts between them, and the bench under all of it. */
export function layoutOf(diagram: Diagram): Layout {
  const stations = place(diagram);
  const byId = new Map(stations.map((s) => [s.id, s]));
  const belts = diagram.links.map((l, i) => beltFor(l, i, byId));

  const xs = stations.map((s) => s.x);
  const ys = stations.map((s) => s.y);
  const returns = belts.some((b) => b.isReturn);
  const x0 = Math.min(...xs) - HALF - MARGIN;
  const x1 = Math.max(...xs) + HALF + MARGIN;
  const y0 = Math.min(...ys) - HALF - MARGIN - (returns ? RETURN_GAP + 8 : 0);
  const y1 = Math.max(...ys) + HALF + MARGIN;
  return { stations, belts, bench: { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 10 } };
}
