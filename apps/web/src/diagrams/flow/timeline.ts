import type { Layout } from './layout';

/** How fast a packet travels, in drawing units a second, and how long it rests at a step. */
const SPEED = 190;
const REST = 0.55;
/** A pause before the next route starts. */
const GAP = 0.9;

export type Frame = { x: number; y: number; at: string | null };

type Leg = {
  from: number;
  to: number;
  pts: [number, number][];
  lens: number[];
  len: number;
  at: string;
};

/**
 * A packet's whole trip as a function of time: along each route, belt by belt, resting at each step,
 * then round again. Pure, so it can be tested and drawn at any moment.
 */
export function timelineOf(layout: Layout, routes: string[][]) {
  const edge = new Map(layout.edges.map((e) => [`${e.from}>${e.to}`, e]));
  const box = new Map(layout.boxes.map((b) => [b.id, b]));
  const legs: Leg[] = [];
  let t = 0;
  for (const route of routes) {
    const first = box.get(route[0])!;
    legs.push({
      from: t,
      to: t + REST,
      pts: [[first.x + layout.node.w / 2, first.y + layout.node.h / 2]],
      lens: [0],
      len: 0,
      at: route[0],
    });
    t += REST;
    for (let i = 0; i < route.length - 1; i++) {
      const e = edge.get(`${route[i]}>${route[i + 1]}`)!;
      const lens = [0];
      for (let k = 1; k < e.pts.length; k++) {
        lens.push(
          lens[k - 1] + Math.hypot(e.pts[k][0] - e.pts[k - 1][0], e.pts[k][1] - e.pts[k - 1][1]),
        );
      }
      const len = lens[lens.length - 1];
      legs.push({ from: t, to: t + len / SPEED, pts: e.pts, lens, len, at: '' });
      t += len / SPEED;
      legs.push({
        from: t,
        to: t + REST,
        pts: [e.pts[e.pts.length - 1]],
        lens: [0],
        len: 0,
        at: route[i + 1],
      });
      t += REST;
    }
    legs[legs.length - 1].to += GAP;
    t += GAP;
  }
  const total = t;

  const frame = (time: number): Frame => {
    const m = ((time % total) + total) % total;
    const leg = legs.find((l) => m >= l.from && m < l.to) ?? legs[legs.length - 1];
    if (leg.len === 0) return { x: leg.pts[0][0], y: leg.pts[0][1], at: leg.at || null };
    const d = ((m - leg.from) / (leg.to - leg.from)) * leg.len;
    let k = 1;
    while (k < leg.lens.length - 1 && leg.lens[k] < d) k++;
    const span = leg.lens[k] - leg.lens[k - 1] || 1;
    const f = (d - leg.lens[k - 1]) / span;
    const [ax, ay] = leg.pts[k - 1];
    const [bx, by] = leg.pts[k];
    return { x: ax + (bx - ax) * f, y: ay + (by - ay) * f, at: null };
  };
  return { total, frame };
}
