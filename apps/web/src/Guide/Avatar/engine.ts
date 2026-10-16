/**
 * The guide's face: one filled blob and two eyes, as a pure function of time. There is no clock in here, so
 * the same inputs always draw the same picture. The way it is built (a body as a radius for each angle,
 * eased between moods) follows the idea of the bloub project (MIT); the shapes and numbers are our own.
 */

const TAU = Math.PI * 2;
/** How many points the outline is drawn through. */
const POINTS = 72;

/** Everything that makes one mood different from another. Moods are blended by easing these numbers. */
export type Params = {
  /** How much the whole body swells and settles, as a share of its radius. */
  breathe: number;
  /** How fast it breathes, in cycles a second. */
  rate: number;
  /** How far the outline bulges into lobes: two, three and four of them. */
  lobe2: number;
  lobe3: number;
  lobe4: number;
  /** How fast the lobes turn round the body, in turns a second. */
  spin: number;
  /** How flat the body is pressed, 0 round to 0.3 squat. */
  squash: number;
  /** How open the eyes are, 0 shut to 1 wide. */
  eyes: number;
  /** Where the eyes look, -1 to 1 across and up and down. */
  gazeX: number;
  gazeY: number;
};

export type Point = { x: number; y: number };

export type Face = {
  /** The body outline as an SVG path. */
  body: string;
  eyes: { cx: number; cy: number; rx: number; ry: number }[];
};

const round = (v: number) => Math.round(v * 100) / 100;

/** The radius of the body in one direction, at one moment, as a share of the base radius. */
function radiusAt(p: Params, angle: number, t: number): number {
  const turn = t * p.spin * TAU;
  const swell = 1 + p.breathe * Math.sin(t * p.rate * TAU);
  const lobes =
    p.lobe2 * Math.sin(2 * (angle - turn) + 0.7) +
    p.lobe3 * Math.sin(3 * (angle + turn * 0.8) + 2.1) +
    p.lobe4 * Math.sin(4 * (angle - turn * 1.3) + 4.2);
  return swell * (1 + lobes);
}

/** A smooth closed curve through the points, as cubic segments (Catmull-Rom turned into Béziers). */
function smooth(points: Point[]): string {
  const n = points.length;
  const at = (i: number) => points[(i + n) % n];
  let d = `M${round(at(0).x)} ${round(at(0).y)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(p2.x)} ${round(p2.y)}`;
  }
  return `${d}Z`;
}

/** The face at time `t`, drawn in a box `size` wide centred on the origin. */
export function sample(p: Params, t: number, size = 100): Face {
  const base = size * 0.4;
  const points: Point[] = [];
  for (let i = 0; i < POINTS; i++) {
    const angle = (i / POINTS) * TAU;
    const r = base * radiusAt(p, angle, t);
    points.push({
      x: r * Math.cos(angle),
      y: r * Math.sin(angle) * (1 - p.squash) + base * p.squash * 0.35,
    });
  }
  const spread = base * 0.36;
  const eyeY = -base * 0.08 + base * p.squash * 0.35;
  const ry = base * 0.19 * p.eyes;
  const rx = base * 0.085 * (1 + (1 - p.eyes) * 0.9);
  const eyes = [-1, 1].map((side) => ({
    cx: round(side * spread + p.gazeX * base * 0.12),
    cy: round(eyeY + p.gazeY * base * 0.1),
    rx: round(rx),
    ry: round(Math.max(ry, base * 0.018)),
  }));
  return { body: smooth(points), eyes };
}
