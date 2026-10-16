import type { ReactNode } from 'react';
import type { Diagram } from '../../content/diagrams/types';
import { boxCorners, depthOf, fitProjection, iso, type Projection } from '../iso/vendor/kit';
import { builders } from '../stations';
import { Bench } from './bench';
import { beltDepth, beltNode } from './belt';
import { layoutOf } from './layout';
import { Packet } from './Packet';
import { timelineOf, type Timeline } from './timeline';
import type { Curve, Exit, Layout, Piece } from './types';

/** The drawing is always this wide; its height follows the shape of the line so no figure is mostly empty. */
export const VIEW_WIDTH = 560;
const AZIMUTH = 58;
const ELEVATION = 30;
const PAD = 14;
/** How many packets are on the line at once; each slot holds one copy of every packet. */
export const PACKET_COPIES = 2;
const TALLEST = 64;

/** One thing to paint, and where it sits in the painting order. */
type Item = { key: string; depth: number; node: ReactNode };

/** A piece that moves, found again by name when the figure is animated. */
export type Mover = {
  name: string;
  station: string;
  curve: Curve;
  move: NonNullable<Piece['move']>;
};

export type Scene = {
  P: Projection;
  view: { width: number; height: number };
  layout: Layout;
  timeline: Timeline;
  items: Item[];
  movers: Mover[];
};

const cache = new WeakMap<Diagram, Scene>();

/** The packets that can be in a slot: one copy per packet on the line, hidden until the timeline puts one there. */
function packetsIn(slot: string, P: Projection): ReactNode {
  return (
    <g key={`packets-${slot}`} data-slot={slot}>
      {Array.from({ length: PACKET_COPIES }, (_, k) => (
        <g key={k} data-packet={k} opacity={0}>
          <Packet P={P} />
        </g>
      ))}
    </g>
  );
}

/** Lays a diagram out on the bench and draws every part once, in painting order. Pure, so it also runs at build time. */
export function buildScene(diagram: Diagram): Scene {
  const hit = cache.get(diagram);
  if (hit) return hit;

  const layout = layoutOf(diagram);
  const points = boxCorners(layout.bench, -20, TALLEST);
  // how tall the drawing needs to be for this shape, at the width it always has
  const flat = points.map((p) =>
    iso(p, { origin: [0, 0], scale: 1, azimuth: AZIMUTH, elevation: ELEVATION }),
  );
  const xs = flat.map((p) => p[0]);
  const ys = flat.map((p) => p[1]);
  const shape = (Math.max(...ys) - Math.min(...ys)) / (Math.max(...xs) - Math.min(...xs));
  const height = Math.round(Math.min(460, Math.max(240, (VIEW_WIDTH - PAD * 2) * shape + PAD * 2)));
  const view = { width: VIEW_WIDTH, height };
  const P = fitProjection(points, view.width, view.height, {
    pad: PAD,
    azimuth: AZIMUTH,
    elevation: ELEVATION,
  });
  const items: Item[] = [
    { key: 'bench', depth: -1e9, node: <Bench key="bench" plan={layout.bench} P={P} /> },
  ];
  const movers: Mover[] = [];

  for (const s of layout.stations) {
    const depth = depthOf([s.x, s.y, 0], P);
    const pieces = builders[s.kind]({ P, x: s.x, y: s.y });
    const layer = (slot: Piece['slot']) =>
      pieces
        .filter((p) => p.slot === slot)
        .map((p, i) => {
          if (!p.motion || !p.move) return <g key={i}>{p.node}</g>;
          const name = `${s.id}:${p.motion}`;
          movers.push({ name, station: s.id, curve: p.curve ?? 'bump', move: p.move });
          return (
            <g key={i} data-mover={name}>
              {p.node}
            </g>
          );
        });
    const group = (slot: Piece['slot'], node: ReactNode) => (
      <g key={`${s.id}-${slot}`} className="iso-station" data-station={s.id}>
        {node}
      </g>
    );
    items.push(
      { key: `${s.id}-back`, depth, node: group('back', layer('back')) },
      { key: `${s.id}-packets`, depth: depth + 0.001, node: packetsIn(`s:${s.id}`, P) },
      { key: `${s.id}-front`, depth: depth + 0.002, node: group('front', layer('front')) },
    );
  }

  for (const belt of layout.belts) {
    const depth = beltDepth(belt, P);
    items.push(
      { key: `belt-${belt.index}`, depth, node: beltNode(belt, P) },
      {
        key: `belt-${belt.index}-packets`,
        depth: depth + 0.001,
        node: packetsIn(`b:${belt.index}`, P),
      },
    );
  }

  items.sort((a, b) => a.depth - b.depth);
  const scene: Scene = { P, view, layout, timeline: timelineOf(diagram, layout), items, movers };
  cache.set(diagram, scene);
  return scene;
}

export type { Exit };
