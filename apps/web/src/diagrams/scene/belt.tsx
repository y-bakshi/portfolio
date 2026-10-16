import type { ReactNode } from 'react';
import { Dots, Line, Solid } from '../iso/vendor/draw';
import { depthOf, pointsAt, segment, slabOf, type Projection } from '../iso/vendor/kit';
import { SIZE, type Belt } from './types';

const BELT_DEPTH = 8;
const RAIL = 2.4;

type Run = Belt['runs'][number];

/** A rectangle on the floor for a straight run, `across` wide. */
function runPlan(run: Run, across: number, offset = 0) {
  const [ax, ay] = run.a;
  const [bx, by] = run.b;
  const alongX = Math.abs(bx - ax) >= Math.abs(by - ay);
  if (alongX) {
    return {
      x: Math.min(ax, bx),
      y: ay - across / 2 + offset,
      w: Math.abs(bx - ax),
      d: across,
      r: 1,
    };
  }
  return {
    x: ax - across / 2 + offset,
    y: Math.min(ay, by),
    w: across,
    d: Math.abs(by - ay),
    r: 1,
  };
}

function runAlongX(run: Run) {
  return Math.abs(run.b[0] - run.a[0]) >= Math.abs(run.b[1] - run.a[1]);
}

/** One straight run of belt: a low bed between two rails, with a dashed line down the middle that flows the way packets go. */
function runNode(run: Run, belt: Belt, index: number, P: Projection): ReactNode {
  const z = SIZE.bed;
  const alongX = runAlongX(run);
  const side = SIZE.belt / 2 - RAIL / 2;
  const rail = (offset: number, key: string) => (
    <Solid
      key={key}
      paths={slabOf(runPlan(run, RAIL, offset), z, 2.4, P, 1)}
      tone="mid"
      crease="faint"
    />
  );
  const start: [number, number, number] = [run.a[0], run.a[1], z];
  const end: [number, number, number] = [run.b[0], run.b[1], z];
  // the belt is flat, so its dashes run from the first station to the second
  const dashes = belt.isReturn && index === 1 ? [end, start] : [start, end];
  const bed = slabOf(runPlan(run, SIZE.belt), BELT_DEPTH - 6, 6, P, 1, 0.4);
  void alongX;
  return (
    <g key={`run-${index}`}>
      <Solid paths={bed} tone="lo" crease="faint" />
      {rail(-side, 'rail-a')}
      {rail(side, 'rail-b')}
      <Line d={segment(dashes[0], dashes[1], P)} tone="mid" flow />
      <Dots points={pointsAt([start, end], P)} size={0.45} tone="mid" />
    </g>
  );
}

/** A whole belt, painted as one piece. */
export function beltNode(belt: Belt, P: Projection): ReactNode {
  return <g key={`belt-${belt.index}`}>{belt.runs.map((run, i) => runNode(run, belt, i, P))}</g>;
}

/** Where a belt sits in the painting order: the middle of its runs. */
export function beltDepth(belt: Belt, P: Projection) {
  const mids = belt.runs.map((r) => [(r.a[0] + r.b[0]) / 2, (r.a[1] + r.b[1]) / 2] as const);
  const [x, y] = mids.reduce<[number, number]>(
    (acc, m) => [acc[0] + m[0] / mids.length, acc[1] + m[1] / mids.length],
    [0, 0],
  );
  return depthOf([x, y, 0], P);
}
