import { useMemo, useRef } from 'react';
import type { Diagram } from '../../content/diagrams';
import { useInView } from '@/lib/useInView';
import { FlowNode } from './FlowNode';
import { layoutOf } from './layout';
import { timelineOf } from './timeline';
import { useFlowMotion } from './useFlowMotion';
import { useWidth } from './useWidth';

/**
 * The flow chart of a project: each step a box with an icon and a name, an arrow for each hand-off, a
 * curved arrow back for a loop, and a small packet that travels the routes while the chart is on screen.
 * Charts keep one size from page to page: none is stretched, and a wide one shrinks only a little before the
 * charts on a narrow screen all turn to run down the page.
 */
export function FlowChart({
  diagram,
  label,
  compact,
  numbered = true,
  onPoint,
}: {
  diagram: Diagram;
  label: string;
  compact: boolean;
  /** Put each step's number on its box. */
  numbered?: boolean;
  /** Called with a step's id when the pointer or focus is on its box, and with null when it leaves. */
  onPoint: (id: string | null) => void;
}) {
  const across = useMemo(() => layoutOf(diagram, 'across'), [diagram]);
  const down = useMemo(() => layoutOf(diagram, 'down'), [diagram]);
  const holder = useRef<HTMLDivElement>(null);
  const room = useWidth(holder);
  // every chart is drawn at one size and never blown up; it shrinks a little to fit, and on a narrow screen they all run down the page
  const fit = (w: number) => (room === null ? 1 : Math.min(1, room / w));
  const layout = room !== null && room < (compact ? 470 : 540) ? down : across;
  const scale = fit(layout.width);
  const timeline = useMemo(() => timelineOf(layout, diagram.routes), [layout, diagram]);
  const root = useRef<HTMLDivElement>(null);
  const packet = useRef<SVGGElement>(null);
  const visible = useInView(root, '0px');
  useFlowMotion(root, packet, timeline, visible);

  const { width, height } = layout;
  const at = new Map(layout.boxes.map((b) => [b.id, b]));

  return (
    <div ref={holder} className="w-full min-w-0 max-w-full overflow-hidden">
      <div
        ref={root}
        role="img"
        aria-label={label}
        className="relative mx-auto w-full"
        style={{
          maxWidth: width,
          aspectRatio: `${width} / ${height}`,
        }}
      >
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <marker
              id="flow-head"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
            >
              <path d="M1 1.5 8.5 5 1 8.5z" fill="var(--color-ink)" />
            </marker>
            <marker
              id="flow-head-back"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
            >
              <path d="M1 1.5 8.5 5 1 8.5z" fill="var(--color-ink)" />
            </marker>
          </defs>
          {layout.groups.map((g) => (
            <g key={g.label}>
              <rect
                x={g.x}
                y={g.y}
                width={g.w}
                height={g.h}
                rx={12}
                fill="none"
                stroke="var(--color-muted)"
                strokeWidth={1.2}
                strokeDasharray="6 4"
              />
              <text
                x={g.x + g.w - 10}
                y={g.y + 12}
                textAnchor="end"
                fontSize={10}
                fontWeight={600}
                fill="var(--color-muted)"
              >
                {g.label}
              </text>
            </g>
          ))}
          {layout.edges.map((e) => (
            <g key={`${e.from}>${e.to}`}>
              <path
                d={e.d}
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth={2}
                strokeDasharray={e.back ? '5 4' : undefined}
                markerEnd={`url(#${e.back ? 'flow-head-back' : 'flow-head'})`}
              />
              {e.label && (
                <text
                  x={e.at[0]}
                  y={e.at[1]}
                  textAnchor={e.anchor}
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--color-ink)"
                >
                  {e.label}
                </text>
              )}
            </g>
          ))}
          <g ref={packet} data-packet opacity={0}>
            <circle r={9} fill="var(--color-mark)" opacity={0.28} />
            <circle r={4.5} fill="var(--color-ink)" />
          </g>
        </svg>
        {diagram.stations.map((s, i) => {
          const b = at.get(s.id)!;
          return (
            <FlowNode
              key={s.id}
              station={s}
              index={i}
              compact={compact}
              scale={scale}
              numbered={numbered}
              onPoint={onPoint}
              box={{
                left: (b.x / width) * 100,
                top: (b.y / height) * 100,
                width: (layout.node.w / width) * 100,
                height: (layout.node.h / height) * 100,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
