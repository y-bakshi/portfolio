import type { Diagram } from '../../content/diagrams';

/** One drawing unit is one pixel at the chart's natural size. The chart scales to fill the width it is given. */
const PAD = 14;
const CORNER = 9;
const LIFT = 34;
/** How far a group's outline stands off its boxes. */
const GROUP_PAD = 16;

type Pt = [number, number];

/**
 * A chart runs either across (steps left to right, rows below) or down (steps top to bottom, rows
 * to the side). Both are worked out in one frame, u along the flow and v across it, then turned.
 */
export type Way = 'across' | 'down';

const FRAME = {
  across: { pitch: 132, along: 82, rowPitch: 118, cross: 84, side: -1, room: 46 },
  down: { pitch: 120, along: 78, rowPitch: 190, cross: 158, side: 1, room: 150 },
} as const;

export type Box = { id: string; x: number; y: number };

export type Edge = {
  from: string;
  to: string;
  /** The SVG path, drawn with rounded corners. */
  d: string;
  /** The same route as points, which the packet follows. */
  pts: Pt[];
  label?: string;
  /** Where the label sits, and which way it runs from there. */
  at: Pt;
  anchor: 'middle' | 'start';
  /** True for an arrow that runs back against the flow. */
  back: boolean;
};

export type Group = { label: string; x: number; y: number; w: number; h: number };

export type Layout = {
  way: Way;
  width: number;
  height: number;
  /** The size of each step's box. */
  node: { w: number; h: number };
  boxes: Box[];
  edges: Edge[];
  /** An outline around the boxes of each group, with its name. */
  groups: Group[];
};

const bezier = (a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt => {
  const u = 1 - t;
  const f = (i: 0 | 1) =>
    u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i];
  return [f(0), f(1)];
};

/** A path through the points, with the corners rounded. */
export function rounded(pts: Pt[]): string {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    const r = Math.min(CORNER, Math.hypot(x - px, y - py) / 2, Math.hypot(nx - x, ny - y) / 2);
    const k1 = r / Math.hypot(x - px, y - py);
    const k2 = r / Math.hypot(nx - x, ny - y);
    d += `L${x - (x - px) * k1} ${y - (y - py) * k1}Q${x} ${y} ${x + (nx - x) * k2} ${y + (ny - y) * k2}`;
  }
  const last = pts[pts.length - 1];
  return `${d}L${last[0]} ${last[1]}`;
}

/** Places each step on its grid cell and routes an arrow for each link. */
export function layoutOf(diagram: Diagram, way: Way): Layout {
  const f = FRAME[way];
  const turn = (u: number, v: number): Pt => (way === 'across' ? [u, v] : [v, u]);
  const isBack = (l: { from: string; to: string }) => {
    const a = diagram.stations.find((s) => s.id === l.from)!;
    const b = diagram.stations.find((s) => s.id === l.to)!;
    return a.row === b.row && b.col <= a.col;
  };
  const loops = diagram.links.some(isBack);
  const pad = PAD + (diagram.groups?.length ? GROUP_PAD + 2 : 0);
  const before = loops && f.side < 0 ? f.room : pad;
  const after = loops && f.side > 0 ? f.room : pad;
  const cols = Math.max(...diagram.stations.map((s) => s.col)) + 1;
  const rows = Math.max(...diagram.stations.map((s) => s.row)) + 1;
  // long arrows read best, but a chart of six or more steps gives up some length to keep its boxes a readable size
  const pitch = way === 'across' ? f.along + (cols > 5 ? 38 : 50) : f.pitch;
  const uLen = pad * 2 + (cols - 1) * pitch + f.along;
  const vLen = before + (rows - 1) * f.rowPitch + f.cross + after;

  const place = new Map(
    diagram.stations.map((s) => [s.id, { u: pad + s.col * pitch, v: before + s.row * f.rowPitch }]),
  );
  const boxes = diagram.stations.map((s) => {
    const p = place.get(s.id)!;
    const [x, y] = turn(p.u, p.v);
    return { id: s.id, x, y };
  });

  const edges = diagram.links.map((l): Edge => {
    const a = place.get(l.from)!;
    const b = place.get(l.to)!;
    const back = isBack(l);
    const mid = f.cross / 2;
    let pts: Pt[];
    let d: string;
    let at: Pt = [0, 0];
    if (back) {
      const edgeV = f.side < 0 ? 0 : f.cross;
      const s: Pt = [a.u + f.along / 2, a.v + edgeV];
      const e: Pt = [b.u + f.along / 2, b.v + edgeV + f.side * 3];
      const c1: Pt = [s[0], s[1] + f.side * LIFT];
      const c2: Pt = [e[0], e[1] + f.side * LIFT];
      pts = Array.from({ length: 25 }, (_, i) => bezier(s, c1, c2, e, i / 24)).map((p) =>
        turn(...p),
      );
      const [m, c1t, c2t, et] = [s, c1, c2, e].map((p) => turn(...p));
      d = `M${m.join(' ')}C${c1t.join(' ')} ${c2t.join(' ')} ${et.join(' ')}`;
      const apex = s[1] + f.side * LIFT * 0.75;
      at =
        way === 'across'
          ? turn((s[0] + e[0]) / 2, apex - 7)
          : turn((s[0] + e[0]) / 2 + 4, apex + 8);
    } else {
      let line: Pt[];
      if (a.v === b.v) {
        line = [
          [a.u + f.along, a.v + mid],
          [b.u - 3, b.v + mid],
        ];
      } else if (a.u === b.u) {
        const up = b.v < a.v;
        line = [
          [a.u + f.along / 2, a.v + (up ? 0 : f.cross)],
          [b.u + f.along / 2, b.v + (up ? f.cross + 3 : -3)],
        ];
      } else {
        const up = b.v < a.v;
        line = [
          [b.u > a.u ? a.u + f.along : a.u, a.v + mid],
          [b.u + f.along / 2, a.v + mid],
          [b.u + f.along / 2, b.v + (up ? f.cross + 3 : -3)],
        ];
      }
      pts = line.map((p) => turn(...p));
      d = rounded(pts);
      at = pts[0];
    }
    return {
      from: l.from,
      to: l.to,
      d,
      pts,
      label: l.label,
      at,
      anchor: way === 'across' ? 'middle' : 'start',
      back,
    };
  });

  const [width, height] = turn(uLen, vLen);
  const [w, h] = turn(f.along, f.cross);
  const groups = (diagram.groups ?? []).map((g) => {
    const mine = boxes.filter((b) => g.members.includes(b.id));
    const x = Math.min(...mine.map((b) => b.x)) - GROUP_PAD;
    const y = Math.min(...mine.map((b) => b.y)) - GROUP_PAD;
    return {
      label: g.label,
      x,
      y,
      w: Math.max(...mine.map((b) => b.x + w)) + GROUP_PAD - x,
      h: Math.max(...mine.map((b) => b.y + h)) + GROUP_PAD - y,
    };
  });
  return { way, width, height, node: { w, h }, boxes, edges, groups };
}
