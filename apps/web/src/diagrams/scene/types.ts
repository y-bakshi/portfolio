import type { ReactNode } from 'react';
import type { Plan, Point3, Projection } from '../iso/vendor/kit';
import type { StationKind } from '../../content/diagrams/types';

/** World size of the things in a figure, in units of about one pixel. */
export const SIZE = {
  /** A station's footprint is a square this wide. */
  station: 60,
  /** The belt between stations is this wide, and sits flush with a station's top. */
  belt: 20,
  /** The height of a station's bed and of the belts: where a packet rests. */
  bed: 10,
  /** The packet is a cube this big. */
  packet: 10,
  /** Distance between station centres along the line, and across it. */
  pitchX: 94,
  pitchY: 94,
} as const;

/** How a piece follows its station's work: down and back, one steady pass, or open late and shut after. */
export type Curve = 'bump' | 'ramp' | 'late';

/** Which way a packet leaves a station, in world axes. Pushers use it to decide whether to push. */
export type Exit = '+x' | '-x' | '+y' | '-y';

/** Where a station is, and what it is drawn with. */
export type Placed = {
  id: string;
  kind: StationKind;
  /** The centre of the station on the floor. */
  x: number;
  y: number;
};

/** What a station builder is given. */
export type Ctx = { P: Projection; x: number; y: number };

/**
 * One drawn piece of a station. `back` pieces are painted before the packets that sit on the station
 * and `front` pieces after, so a packet standing on the bed is hidden by the posts in front of it.
 * A piece with a `motion` moves with the station's activity (0 at rest, 1 fully working).
 */
export type Piece = {
  slot: 'back' | 'front';
  node: ReactNode;
  /** A name unique within the station, for pieces that move. */
  motion?: string;
  curve?: Curve;
  move?: (activity: number, exit: Exit) => Point3;
};

export type StationBuilder = (ctx: Ctx) => Piece[];

/** A belt, as the straight runs it is made of. A run goes from one floor point to another. */
export type Belt = {
  from: string;
  to: string;
  index: number;
  /** The floor points the packet follows from the first station's centre to the second's. */
  path: [number, number][];
  /** The runs that are drawn as belt, between the stations' edges. */
  runs: { a: [number, number]; b: [number, number] }[];
  isReturn: boolean;
};

export type Layout = {
  stations: Placed[];
  belts: Belt[];
  /** The floor plan of the bench every station stands on. */
  bench: Plan;
};
