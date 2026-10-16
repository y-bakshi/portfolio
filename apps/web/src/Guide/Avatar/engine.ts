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
  /** How far the eyes sweep from side to side, and how fast (cycles a second). */
  sweepX: number;
  sweepRate: number;
  /** How far the whole face sways from side to side, as a share of the body radius. */
  sway: number;
  /** How open the mouth is, 0 none to 1 wide, and how fast it opens and shuts when speaking (0 holds it). */
  mouth: number;
  mouthRate: number;
  /** How far the right eye is shut on its own, 0 open to 1 closed, for a wink. */
  wink: number;
};

export type Point = { x: number; y: number };

export type Face = {
  /** The body outline as an SVG path. */
  body: string;
  eyes: { cx: number; cy: number; rx: number; ry: number }[];
  /** The mouth, an ellipse. It has no width when it is closed. */
  mouth: { cx: number; cy: number; rx: number; ry: number };
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
  const swayX = base * p.sway * Math.sin(t * 1.3);
  const points: Point[] = [];
  for (let i = 0; i < POINTS; i++) {
    const angle = (i / POINTS) * TAU;
    const r = base * radiusAt(p, angle, t);
    points.push({
      x: r * Math.cos(angle) + swayX,
      y: r * Math.sin(angle) * (1 - p.squash) + base * p.squash * 0.35,
    });
  }
  const spread = base * 0.36;
  const eyeY = -base * 0.08 + base * p.squash * 0.35;
  const ry = base * 0.19 * p.eyes;
  const rx = base * 0.085 * (1 + (1 - p.eyes) * 0.9);
  const gazeX = p.gazeX + p.sweepX * Math.sin(t * p.sweepRate * TAU);
  const eyes = [-1, 1].map((side) => ({
    cx: round(side * spread + gazeX * base * 0.2 + swayX),
    cy: round(eyeY + p.gazeY * base * 0.16),
    rx: round(rx),
    ry: round(Math.max(ry, base * 0.018)),
  }));
  // a wink shuts one eye only
  eyes[1].ry = round(Math.max(eyes[1].ry * (1 - 0.94 * p.wink), base * 0.018));
  // speaking opens and shuts the mouth unevenly, like syllables; a held mouth stays as it is
  const talk = p.mouthRate
    ? Math.abs(Math.sin(t * p.mouthRate * Math.PI)) *
      (0.65 + 0.35 * Math.sin(t * p.mouthRate * 2.3))
    : 1;
  const open = p.mouth * talk;
  const mouth = {
    cx: round(p.gazeX * base * 0.1 + swayX),
    cy: round(base * 0.34 + p.gazeY * base * 0.06),
    rx: round(open > 0.02 ? base * (0.1 + 0.12 * open) : 0),
    ry: round(open > 0.02 ? base * (0.03 + 0.17 * open) : 0),
  };
  return { body: smooth(points), eyes, mouth };
}
