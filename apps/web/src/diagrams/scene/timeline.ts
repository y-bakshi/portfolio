import type { Diagram } from '../../content/diagrams/types';
import type { Point3 } from '../iso/vendor/kit';
import { SIZE, type Belt, type Curve, type Exit, type Layout, type Placed } from './types';

/** Seconds a packet spends on a station, and how fast it rides a belt in world units a second. */
const DWELL = 1.5;
const SPEED = 56;
/** A pause after a packet has left the last station, before the next one starts its route. */
const GAP = 0.8;
/** How many packets are on the line at once. */
const PACKETS = 2;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
const between = (u: number, a: number, b: number) => smooth((u - a) / (b - a));

/** How hard a station is working, 0 to 1, `u` being how far through the packet's stay it is (it runs past 1 as the packet leaves). */
export const curves: Record<Curve, (u: number) => number> = {
  /** Down and back up: a press, a drawer. */
  bump: (u) => between(u, 0.12, 0.38) * (1 - between(u, 0.62, 0.88)),
  /** One steady pass: a scan, a cursor. */
  ramp: (u) => clamp((u - 0.12) / 0.76),
  /** Opens late and shuts after the packet has gone: a gate, a ram. */
  late: (u) => between(u, 0.45, 0.7) * (1 - between(u, 1.0, 1.4)),
};

type Leg = {
  t0: number;
  t1: number;
  /** The station a packet stays on, or the belt it rides. */
  station?: Placed;
  belt?: Belt;
  exit: Exit;
  /** The points a packet follows on a belt, with the length at each one. */
  walk?: { points: [number, number][]; at: number[] };
};

type Route = { legs: Leg[]; end: number };

const exitOf = (from: [number, number], to: [number, number]): Exit => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? '+x' : '-x';
  return dy >= 0 ? '+y' : '-y';
};

function walkOf(points: [number, number][]) {
  const at = [0];
  for (let i = 1; i < points.length; i++) {
    at.push(
      at[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]),
    );
  }
  return { points, at };
}

/** One route as a list of legs in time: stay, ride, stay, ride, and so on. */
function routeOf(ids: string[], layout: Layout): Route {
  const byId = new Map(layout.stations.map((s) => [s.id, s]));
  const legs: Leg[] = [];
  let t = 0;
  ids.forEach((id, i) => {
    const station = byId.get(id);
    if (!station) throw new Error(`route names a missing station: ${id}`);
    const next = ids[i + 1];
    const belt = next ? layout.belts.find((b) => b.from === id && b.to === next) : undefined;
    if (next && !belt) throw new Error(`route goes from ${id} to ${next}, but there is no belt`);
    legs.push({
      t0: t,
      t1: t + DWELL,
      station,
      exit: belt ? exitOf(belt.path[0], belt.path[1]) : '+x',
    });
    t += DWELL;
    if (belt) {
      const walk = walkOf(belt.path);
      const duration = walk.at[walk.at.length - 1] / SPEED;
      legs.push({ t0: t, t1: t + duration, belt, exit: '+x', walk });
      t += duration;
    }
  });
  return { legs, end: t };
}

export type PackedPacket = {
  /** Which group of the drawing the packet is painted in: `s:<station>` or `b:<belt>`. */
  slot: string;
  pos: Point3;
  opacity: number;
};

export type Frame = {
  packets: PackedPacket[];
  /** For each station, how hard it is working under each curve, and which way the packet leaves. */
  stations: Record<string, { bump: number; ramp: number; late: number; exit: Exit }>;
};

export type Timeline = {
  period: number;
  /** A time at which the figure looks good standing still. */
  still: number;
  at: (seconds: number) => Frame;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Where a packet is while it stays on a station: most stay at the centre, a few move about on it. */
function stayAt(s: Placed, u: number): { pos: Point3; opacity: number } {
  const z = SIZE.bed;
  const e = smooth(u);
  switch (s.kind) {
    case 'hopper':
      return { pos: [s.x - 6 + 22 * e, s.y, z], opacity: 1 };
    case 'queue':
      return { pos: [s.x - 18 + 36 * e, s.y, z], opacity: 1 };
    case 'tray':
      return { pos: [s.x + 6, s.y + 6, z + 3], opacity: 1 };
    case 'display':
      return { pos: [s.x + 10, s.y, z], opacity: 1 };
    case 'cabinet':
      return { pos: [s.x + 14, s.y, z], opacity: 1 };
    case 'gate':
      return { pos: [s.x - 6, s.y, z], opacity: 1 };
    case 'press':
      return { pos: [s.x + 4, s.y, z], opacity: 1 };
    default:
      return { pos: [s.x, s.y, z], opacity: 1 };
  }
}

function alongWalk(walk: NonNullable<Leg['walk']>, share: number): [number, number] {
  const total = walk.at[walk.at.length - 1];
  const d = share * total;
  let i = 1;
  while (i < walk.at.length - 1 && walk.at[i] < d) i++;
  const span = walk.at[i] - walk.at[i - 1] || 1;
  const t = (d - walk.at[i - 1]) / span;
  const a = walk.points[i - 1];
  const b = walk.points[i];
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

/** The motion of a figure as a function of time: packets riding the belts and stopping at each station. */
export function timelineOf(diagram: Diagram, layout: Layout): Timeline {
  const routes = diagram.routes.map((r) => routeOf(r, layout));
  const period = Math.max(...routes.map((r) => r.end)) + GAP;
  const offset = period / PACKETS;

  const at = (seconds: number): Frame => {
    const stations: Frame['stations'] = {};
    for (const s of layout.stations) stations[s.id] = { bump: 0, ramp: 0, late: 0, exit: '+x' };
    const packets: PackedPacket[] = [];

    for (let k = 0; k < PACKETS; k++) {
      const clock = seconds + k * offset;
      const cycle = Math.floor(clock / period);
      const local = clock - cycle * period;
      const route = routes[((cycle % routes.length) + routes.length) % routes.length];
      if (local >= route.end) {
        packets.push({ slot: 'none', pos: [0, 0, 0], opacity: 0 });
        continue;
      }
      let shown: PackedPacket | null = null;
      const stays = route.legs.filter((l) => l.station);
      for (const leg of route.legs) {
        if (leg.station) {
          const u = (local - leg.t0) / (leg.t1 - leg.t0);
          if (u >= 0 && u <= 1.45) {
            const st = stations[leg.station.id];
            st.bump = Math.max(st.bump, curves.bump(u));
            st.ramp = Math.max(st.ramp, curves.ramp(u));
            st.late = Math.max(st.late, curves.late(u));
            st.exit = leg.exit;
          }
          if (u >= 0 && u < 1) {
            const { pos, opacity } = stayAt(leg.station, u);
            // the first station brings the packet in and the last takes it away
            const arriving = leg === stays[0] ? clamp(u / 0.2) : 1;
            const leaving = leg === stays[stays.length - 1] ? 1 - between(u, 0.6, 1) : 1;
            shown = { slot: `s:${leg.station.id}`, pos, opacity: opacity * arriving * leaving };
          }
        } else if (leg.belt && leg.walk && local >= leg.t0 && local < leg.t1) {
          const raw = (local - leg.t0) / (leg.t1 - leg.t0);
          const [x, y] = alongWalk(leg.walk, smooth(raw) * 0.9 + raw * 0.1);
          shown = { slot: `b:${leg.belt.index}`, pos: [x, y, SIZE.bed], opacity: 1 };
        }
      }
      packets.push(shown ?? { slot: 'none', pos: [0, 0, 0], opacity: 0 });
    }
    return { packets, stations };
  };

  // standing still, the first packet is mid-route, where the figure shows the most
  const still = routes[0].end * 0.42;
  return { period, still, at };
}
