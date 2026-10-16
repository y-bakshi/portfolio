import type { ReactNode } from 'react';
import type { Diagram } from '../../content/diagrams/types';
import { depthOf, type Projection } from '../iso/vendor/kit';
import { builders } from '../stations';
import { Bench } from './bench';
import { beltDepth, beltNode } from './belt';
import { layoutOf } from './layout';
import { Packet } from './Packet';
import { timelineOf, type Timeline } from './timeline';
import { viewOf, type View } from './view';
import type { Curve, Exit, Layout, Piece } from './types';

/** How many packets are on the line at once; each slot holds one copy of every packet. */
export const PACKET_COPIES = 2;

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
  view: View;
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
  const { view, P } = viewOf(diagram, layout);
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
